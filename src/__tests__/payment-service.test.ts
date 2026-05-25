import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  loggerMock: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({ logger: testState.loggerMock }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: testState.createAdminClient }));

import PaymentService from '@/lib/services/payment.service';

function makeSupabaseMock(options?: {
  paymentRows?: Array<Record<string, unknown>>;
  paymentInsertError?: { message: string } | null;
  paymentUpdateError?: { message: string } | null;
  txInsertError?: { message: string } | null;
}) {
  const paymentRows = options?.paymentRows ?? [];
  const paymentInsertError = options?.paymentInsertError ?? null;
  const paymentUpdateError = options?.paymentUpdateError ?? null;
  const txInsertError = options?.txInsertError ?? null;

  const paymentsChain: any = {
    select: vi.fn(() => paymentsChain),
    eq: vi.fn(() => paymentsChain),
    order: vi.fn(() => paymentsChain),
    limit: vi.fn(async () => ({ data: paymentRows, error: null })),
    insert: vi.fn(async () => ({ error: paymentInsertError })),
    single: vi.fn(async () => ({ data: paymentRows[0] ?? null, error: paymentRows[0] ? null : { message: 'not found' } })),
  };

  const paymentsUpdateChain: any = {
    eq: vi.fn(async () => ({ error: paymentUpdateError })),
  };

  paymentsChain.update = vi.fn(() => paymentsUpdateChain);

  const txChain: any = {
    insert: vi.fn(async () => ({ error: txInsertError })),
  };

  const orderStatusChain: any = {
    insert: vi.fn(async () => ({ error: null })),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'payments') return paymentsChain;
      if (table === 'payment_transactions') return txChain;
      if (table === 'order_status_history') return orderStatusChain;
      return paymentsChain;
    }),
  };

  return { supabase, paymentsChain, txChain };
}

beforeEach(() => {
  vi.clearAllMocks();
  testState.createAdminClient.mockReset();
});

describe('PaymentService', () => {
  it('creates a payment attempt and records the created transaction', async () => {
    const { supabase, paymentsChain, txChain } = makeSupabaseMock();
    testState.createAdminClient.mockReturnValue(supabase as any);

    const paymentId = await PaymentService.createPaymentAttempt('order-1', 1250, 'INR');

    expect(paymentId).toBeDefined();
    expect(paymentsChain.insert).toHaveBeenCalledTimes(1);
    expect(txChain.insert).toHaveBeenCalledTimes(1);
  });

  it('ignores duplicate payment transactions', async () => {
    const { supabase, txChain } = makeSupabaseMock({ txInsertError: { message: 'duplicate key value violates unique constraint' } });
    testState.createAdminClient.mockReturnValue(supabase as any);

    const result = await PaymentService.recordTransaction('payment-1', 'order-1', 'captured', 'evt_1', { foo: 'bar' }, 'idem-1');

    expect(result).toBe(true);
    expect(txChain.insert).toHaveBeenCalledTimes(1);
    expect(testState.loggerMock.info).toHaveBeenCalled();
  });

  it('marks payment succeeded without writing a duplicate transaction', async () => {
    const { supabase, paymentsChain, txChain } = makeSupabaseMock({ paymentRows: [{ id: 'payment-1' }] });
    testState.createAdminClient.mockReturnValue(supabase as any);

    const result = await PaymentService.markPaymentSucceeded('payment-1', 'order-1', 'pay_1', null);

    expect(result).toBe(true);
    expect(paymentsChain.update).toHaveBeenCalledTimes(1);
    expect(txChain.insert).toHaveBeenCalledTimes(0);
  });

  it('finds the latest payment for an order', async () => {
    const { supabase } = makeSupabaseMock({ paymentRows: [{ id: 'payment-1', order_id: 'order-1' }] });
    testState.createAdminClient.mockReturnValue(supabase as any);

    const payment = await PaymentService.findLatestPaymentByOrderId('order-1');

    expect(payment?.id).toBe('payment-1');
  });
});
