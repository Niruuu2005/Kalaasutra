import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger, generateRequestId } from '@/lib/logger';
import { apiError, apiSuccess, ErrorCode } from '@/lib/api-response';

export async function POST(request: Request) {
  const requestId = generateRequestId();

  // Read raw body for signature verification
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err: any) {
    logger.error('Failed to read webhook body', { requestId, error: err?.message ?? String(err) });
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }

  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const idempotencyKey = request.headers.get('x-idempotency-key') ?? null;

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('Razorpay webhook secret not configured', { requestId });
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }

  // Verify HMAC SHA256 signature
  try {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const expectedBuf = Buffer.from(expected, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    const valid = expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf);
    if (!valid) {
      logger.warn('Invalid webhook signature', { requestId });
      return apiError(ErrorCode.VALIDATION_ERROR, 400, undefined, 'Invalid webhook signature');
    }
  } catch (err: any) {
    logger.warn('Webhook signature verification failed', { requestId, error: err?.message ?? String(err) });
    return apiError(ErrorCode.VALIDATION_ERROR, 400, undefined, 'Invalid webhook signature');
  }

  // Parse payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err: any) {
    logger.warn('Invalid webhook JSON payload', { requestId, error: err?.message ?? String(err) });
    return apiError(ErrorCode.INVALID_PAYLOAD, 400);
  }

  const event = typeof payload?.event === 'string' ? payload.event : String(payload?.event ?? '');
  const entity = payload?.payload?.payment?.entity ?? payload?.payload?.order?.entity ?? {};
  const providerPaymentId = entity?.id ?? entity?.payment_id ?? payload?.payload?.payment?.entity?.id ?? null;
  const providerOrderId = entity?.order_id ?? entity?.orderId ?? payload?.payload?.order?.entity?.id ?? null;
  const providerEventId = payload?.id ?? providerPaymentId ?? null;

  const supabase = createAdminClient();

  try {
    // Find mapped payment (prefer provider_order_id then provider_payment_id)
    let paymentRow: any = null;

    if (providerOrderId) {
      const { data } = await supabase.from('payments').select('*').eq('provider_order_id', providerOrderId).limit(1);
      if (data && data.length > 0) paymentRow = data[0];
    }

    if (!paymentRow && providerPaymentId) {
      const { data } = await supabase.from('payments').select('*').eq('provider_payment_id', providerPaymentId).limit(1);
      if (data && data.length > 0) paymentRow = data[0];
    }

    if (!paymentRow) {
      // No mapping found — log and ack so provider doesn't keep retrying indefinitely
      logger.warn('No payment mapping for webhook', { requestId, event, providerOrderId, providerPaymentId, providerEventId });
      return apiSuccess({ received: true });
    }

    const paymentId: string = paymentRow.id;
    const orderId: string = paymentRow.order_id;

    // Infer simple event type (last token after dot)
    const inferred = event.includes('.') ? event.split('.').pop() : event;
    const eventType = ['created', 'authorized', 'captured', 'failed', 'refunded', 'cancelled'].includes(inferred)
      ? inferred
      : 'webhook_received';

    // Record transaction (idempotent by DB UNIQUE on provider_event_id)
    try {
      const { PaymentService } = await import('@/lib/services/payment.service');
      await PaymentService.recordTransaction(paymentId, orderId, eventType, providerEventId, payload, idempotencyKey);
    } catch (recErr: any) {
      const msg = (recErr?.message ?? String(recErr)).toLowerCase();
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
        logger.info('Duplicate webhook ignored (already recorded)', { requestId, providerEventId, paymentId, orderId });
        return apiSuccess({ received: true });
      }
      logger.error('Failed to record webhook transaction', { requestId, error: recErr?.message ?? String(recErr), providerEventId, paymentId, orderId });
      return apiError(ErrorCode.INTERNAL_ERROR, 500);
    }

    // For capture events, mark payment succeeded (durable)
    if (inferred === 'captured') {
      try {
        const { PaymentService } = await import('@/lib/services/payment.service');
        await PaymentService.markPaymentSucceeded(paymentId, orderId, providerPaymentId ?? providerEventId, null, 'webhook');
      } catch (markErr: any) {
        logger.error('Failed to mark payment succeeded from webhook', { requestId, error: markErr?.message ?? String(markErr), paymentId, orderId });
        return apiError(ErrorCode.INTERNAL_ERROR, 500);
      }
    }

    logger.info('Webhook processed', { requestId, event, providerEventId, providerOrderId, providerPaymentId, paymentId, orderId });
    return apiSuccess({ received: true });
  } catch (err: any) {
    logger.apiError('/api/payments/webhook', 'POST', err, { requestId });
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }
}
