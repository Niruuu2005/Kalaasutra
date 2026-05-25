import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger, generateRequestId } from '@/lib/logger';
import { PaymentService } from '@/lib/services/payment.service';

/**
 * Reconciliation job: query recent payments missing captured state and reconcile
 * by querying Razorpay for the provider payment(s). This job is intended to
 * be run on a schedule (cron) or ad-hoc to backfill missed webhooks.
 */
export async function reconcileMissedWebhooks(opts?: { daysBack?: number; limit?: number }) {
  const requestId = generateRequestId();
  const daysBack = opts?.daysBack ?? 7;
  const limit = opts?.limit ?? 200;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    logger.error('Razorpay keys not configured; cannot run reconciliation', { requestId });
    throw new Error('Missing Razorpay credentials');
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const supabase = createAdminClient();

  // Find payments that are not marked paid and have a provider_order_id or provider_payment_id
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .or("payment_state.eq.pending,payment_state.eq.initiated,payment_state.eq.failed")
    .neq('provider_order_id', null)
    .gte('created_at', since)
    .limit(limit);

  if (error) {
    logger.error('Failed to query payments for reconciliation', { requestId, error: error.message });
    throw error;
  }

  if (!payments || payments.length === 0) {
    logger.info('No payments to reconcile', { requestId });
    return { reconciled: 0 };
  }

  let reconciled = 0;

  for (const p of payments) {
    const paymentId: string = p.id;
    const orderId: string = p.order_id;
    const providerPaymentId: string | null = p.provider_payment_id ?? null;
    const providerOrderId: string | null = p.provider_order_id ?? null;

    try {
      // Prefer fetching a known provider payment
      let providerPayment: any = null;

      if (providerPaymentId) {
        try {
          providerPayment = await razorpay.payments.fetch(providerPaymentId);
        } catch (e) {
          logger.debug('Razorpay fetch by payment id failed', { requestId, paymentId, providerPaymentId, err: String(e) });
        }
      }

      // If no specific payment id, try listing payments for the order
      if (!providerPayment && providerOrderId) {
        try {
          // The SDK exposes payments.fetch or payments.all — use all with order_id filter
          // @ts-ignore - runtime call; guard with try/catch
          const list = await razorpay.payments.all({ order_id: providerOrderId }) as any;
          if (list && Array.isArray(list.items) && list.items.length > 0) {
            providerPayment = list.items.find((it: any) => it.status === 'captured') ?? list.items[0];
          }
        } catch (e) {
          logger.debug('Razorpay list payments by order failed', { requestId, paymentId, providerOrderId, err: String(e) });
        }
      }

      if (!providerPayment) {
        logger.info('No provider payment found during reconciliation', { requestId, paymentId, orderId, providerOrderId, providerPaymentId });
        continue;
      }

      // If provider shows captured, record transaction + mark succeeded
      const status = providerPayment.status ?? providerPayment.state ?? null;
      if (String(status).toLowerCase() === 'captured') {
        // record a transaction and mark payment succeeded
        try {
          await PaymentService.recordTransaction(paymentId, orderId, 'captured', providerPayment.id ?? providerPayment.entity?.id ?? null, providerPayment, null);
          await PaymentService.markPaymentSucceeded(paymentId, orderId, providerPayment.id ?? providerPayment.entity?.id ?? null, null, 'reconciler');
          reconciled += 1;
          logger.info('Reconciled payment from provider', { requestId, paymentId, orderId, providerPaymentId: providerPayment.id ?? null });
        } catch (e: any) {
          logger.error('Failed durable write during reconciliation', { requestId, paymentId, orderId, err: e?.message ?? String(e) });
        }
      } else {
        // record that we saw a provider event (authorized/failed etc.)
        try {
          await PaymentService.recordTransaction(paymentId, orderId, String(providerPayment.status ?? 'webhook_seen'), providerPayment.id ?? null, providerPayment, null);
        } catch (e: any) {
          logger.debug('Failed to record provider transaction during reconciliation', { requestId, paymentId, orderId, err: e?.message ?? String(e) });
        }
      }
    } catch (e: any) {
      logger.error('Reconciliation iteration failed', { requestId, paymentId, orderId, err: e?.message ?? String(e) });
    }
  }

  logger.info('Reconciliation complete', { requestId, reconciled, scanned: payments.length });
  return { reconciled, scanned: payments.length };
}

export default reconcileMissedWebhooks;
