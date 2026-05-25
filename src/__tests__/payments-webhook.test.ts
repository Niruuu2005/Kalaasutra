import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  loggerMock: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    apiError: vi.fn(),
  },
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({ logger: testState.loggerMock, generateRequestId: () => 'req-test' }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: testState.createAdminClient }));
vi.mock('@/lib/services/whatsapp.service', () => ({
  WhatsAppService: {
    sendOrderConfirmation: vi.fn(async () => true),
  },
}));

import { POST as webhookPost } from '@/app/api/payments/webhook/route';

function makeSupabaseMock(options?: {
  paymentRows?: Array<Record<string, unknown>>;
  paymentUpdateError?: { message: string } | null;
  txInsertError?: { message: string } | null;
  orderUpdateData?: Record<string, unknown> | null;
}) {
  const paymentRows = options?.paymentRows ?? [];
  const paymentUpdateError = options?.paymentUpdateError ?? null;
  const txInsertError = options?.txInsertError ?? null;
  const orderUpdateData = options?.orderUpdateData ?? { customer_name: 'Mina', customer_phone: '+91 99999 00000' };

  const paymentsChain: any = {
    select: vi.fn(() => paymentsChain),
    eq: vi.fn(() => paymentsChain),
    order: vi.fn(() => paymentsChain),
    limit: vi.fn(async () => ({ data: paymentRows, error: null })),
    insert: vi.fn(async () => ({ error: null })),
    single: vi.fn(async () => ({ data: paymentRows[0] ?? null, error: paymentRows[0] ? null : { message: 'not found' } })),
  };

  const paymentsUpdateChain: any = {
    eq: vi.fn(async () => ({ error: paymentUpdateError })),
  };

  paymentsChain.update = vi.fn(() => paymentsUpdateChain);

  const txChain: any = {
    insert: vi.fn(async () => ({ error: txInsertError })),
  };

  const ordersChain: any = {
    update: vi.fn(() => ordersChain),
    eq: vi.fn(() => ordersChain),
    select: vi.fn(() => ordersChain),
    single: vi.fn(async () => ({ data: orderUpdateData, error: null })),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'payments') return paymentsChain;
      if (table === 'payment_transactions') return txChain;
      if (table === 'orders') return ordersChain;
      return paymentsChain;
    }),
  };

  return { supabase, paymentsChain, txChain, ordersChain };
}

function signBody(body: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

beforeEach(() => {
  vi.clearAllMocks();
  testState.createAdminClient.mockReset();
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test';
});

describe('payments webhook route', () => {
  it('rejects invalid signatures', async () => {
    const { supabase } = makeSupabaseMock({ paymentRows: [{ id: 'payment-1', order_id: 'order-1' }] });
    testState.createAdminClient.mockReturnValue(supabase as any);

    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } } });
    const request = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'bad-signature' },
      body,
    });

    const response = await webhookPost(request);

    expect(response.status).toBe(400);
  });

  it('processes a captured payment and marks it succeeded', async () => {
    const { supabase, txChain, paymentsChain } = makeSupabaseMock({
      paymentRows: [{ id: 'payment-1', order_id: 'order-1', provider_order_id: 'order_1' }],
    });
    testState.createAdminClient.mockReturnValue(supabase as any);

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });
    const signature = signBody(body, 'whsec_test');
    const request = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature },
      body,
    });

    const response = await webhookPost(request);

    expect(response.status).toBe(200);
    expect(txChain.insert).toHaveBeenCalledTimes(1);
    expect(paymentsChain.update).toHaveBeenCalledTimes(1);
  });

  it('treats duplicate webhook deliveries as success', async () => {
    const { supabase, txChain } = makeSupabaseMock({
      paymentRows: [{ id: 'payment-1', order_id: 'order-1', provider_order_id: 'order_1' }],
      txInsertError: { message: 'duplicate key value violates unique constraint' },
    });
    testState.createAdminClient.mockReturnValue(supabase as any);

    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1' } } },
    });
    const signature = signBody(body, 'whsec_test');
    const request = new Request('http://localhost/api/payments/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-razorpay-signature': signature },
      body,
    });

    const response = await webhookPost(request);

    expect(response.status).toBe(200);
    expect(txChain.insert).toHaveBeenCalledTimes(1);
  });
});