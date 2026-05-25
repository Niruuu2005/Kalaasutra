import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { PAYMENT_STATES, PAYMENT_TRANSACTION_TYPES } from '@/lib/payment-domain';
import { logger } from '@/lib/logger';

export class PaymentService {
  /** Create a payment attempt record for an order. Returns the payment row id. */
  static async createPaymentAttempt(orderId: string, amount: number, currency = 'INR') {
    const supabase = createAdminClient();
    const paymentId = crypto.randomUUID();

    const { error } = await supabase.from('payments').insert({
      id: paymentId,
      order_id: orderId,
      amount,
      currency,
      payment_state: 'initiated',
      metadata: {},
    });

    if (error) {
      logger.error('Failed to create payment attempt', { orderId, amount, error: error.message });
      throw new Error('Failed to create payment attempt');
    }

    // Log transaction
    await PaymentService.recordTransaction(paymentId, orderId, 'created', null, {});

    // Record initial order status
    try {
      await PaymentService.recordOrderStatus(orderId, 'payment_pending', 'system', 'Initial payment attempt created');
    } catch (e: any) {
      logger.debug('Failed to record initial order status history', { orderId, err: e?.message ?? String(e) });
    }

    return paymentId;
  }

  static async recordOrderStatus(orderId: string, status: string, source: string = 'system', note: string | null = null, metadata: Record<string, unknown> = {}) {
    const supabase = createAdminClient();

    const { error } = await supabase.from('order_status_history').insert({
      order_id: orderId,
      status,
      source,
      note,
      metadata,
    });

    if (error) {
      logger.error('Failed to insert order status history', { orderId, status, source, error: error.message });
      throw new Error('Failed to insert order status history');
    }

    return true;
  }

  static async findLatestPaymentByOrderId(orderId: string) {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('Failed to fetch payment by order id', { orderId, error: error.message });
      throw new Error('Failed to fetch payment by order id');
    }

    return data && data.length > 0 ? data[0] : null;
  }

  static async linkProviderOrderId(paymentId: string, providerOrderId: string) {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('payments')
      .update({ provider_order_id: providerOrderId })
      .eq('id', paymentId);

    if (error) {
      logger.error('Failed to link provider order id', { paymentId, providerOrderId, error: error.message });
      throw new Error('Failed to link provider order id');
    }

    return true;
  }

  static async recordTransaction(
    paymentId: string | null,
    orderId: string,
    eventType: string,
    providerEventId: string | null,
    payload: Record<string, unknown>,
    idempotencyKey: string | null = null,
  ) {
    const supabase = createAdminClient();

    const { error } = await supabase.from('payment_transactions').insert({
      payment_id: paymentId,
      order_id: orderId,
      event_type: eventType,
      provider_event_id: providerEventId,
      idempotency_key: idempotencyKey,
      payload,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('unique') || message.includes('duplicate') || message.includes('already exists')) {
        logger.info('Duplicate payment transaction ignored', { orderId, paymentId, eventType, providerEventId, idempotencyKey });
        return true;
      }
      logger.error('Failed to record payment transaction', { orderId, paymentId, eventType, error: error.message });
      throw new Error('Failed to record payment transaction');
    }

    return true;
  }

  static async recordLog(level: 'info' | 'warn' | 'error', paymentId: string | null, orderId: string, message: string, payload: Record<string, unknown> = {}) {
    const supabase = createAdminClient();
    await supabase.from('payment_logs').insert({ payment_id: paymentId, order_id: orderId, level, message, payload });
  }

  static async markPaymentSucceeded(paymentId: string, orderId: string, providerPaymentId: string, signature: string | null, source: string = 'system') {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('payments')
      .update({ payment_state: 'paid', provider_payment_id: providerPaymentId, provider_signature: signature, paid_at: new Date().toISOString() })
      .eq('id', paymentId);

    if (error) {
      logger.error('Failed to mark payment succeeded', { paymentId, orderId, error: error.message });
      throw new Error('Failed to mark payment succeeded');
    }
    // Record verification transaction (idempotent) only when we have a signature
    if (signature) {
      try {
        await PaymentService.recordTransaction(paymentId, orderId, 'verification_succeeded', providerPaymentId, { signature });
      } catch (e: any) {
        const msg = (e?.message ?? '').toLowerCase();
        if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
          logger.info('verification_succeeded transaction already exists, continuing', { paymentId, orderId, providerPaymentId });
        } else {
          throw e;
        }
      }
    }

    await PaymentService.recordLog('info', paymentId, orderId, 'Payment marked as succeeded');

    // Add order status history
    try {
      await PaymentService.recordOrderStatus(orderId, 'payment_confirmed', source === 'webhook' ? 'webhook' : 'system', 'Payment confirmed');
    } catch (e: any) {
      logger.debug('Failed to record order status after payment succeeded', { orderId, err: e?.message ?? String(e) });
    }

    return true;
  }
}

export default PaymentService;
