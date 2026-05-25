import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { WhatsAppService } from '@/lib/services/whatsapp.service';
import { logger } from '@/lib/logger';
import { apiError, apiSuccess, ErrorCode } from '@/lib/api-response';
import { PaymentService } from '@/lib/services/payment.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      kalaasutra_order_id,
      kalaasutra_order_number
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !kalaasutra_order_id) {
      return apiError(ErrorCode.VALIDATION_ERROR, 400, undefined, 'Missing parameters');
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      logger.error('Razorpay secret not configured during verification');
      return apiError(ErrorCode.INTERNAL_ERROR, 500);
    }

    // Verify signature
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      logger.warn('Invalid Razorpay signature', { razorpay_order_id, kalaasutra_order_id });
      return apiError(ErrorCode.VALIDATION_ERROR, 400, undefined, 'Invalid payment signature');
    }

    const supabaseAdmin = createAdminClient();

    let paymentRow = await PaymentService.findLatestPaymentByOrderId(kalaasutra_order_id);

    if (!paymentRow) {
      const { data: orderData, error: orderError } = await supabaseAdmin
        .from('orders')
        .select('final_amount')
        .eq('id', kalaasutra_order_id)
        .single();

      if (orderError || !orderData) {
        logger.error('Unable to load order for payment verification', { kalaasutra_order_id, error: orderError?.message });
        return apiError(ErrorCode.INTERNAL_ERROR, 500, undefined, 'Unable to verify payment');
      }

      const createdPaymentId = await PaymentService.createPaymentAttempt(kalaasutra_order_id, Number(orderData.final_amount), 'INR');
      await PaymentService.linkProviderOrderId(createdPaymentId, razorpay_order_id);
      paymentRow = await PaymentService.findLatestPaymentByOrderId(kalaasutra_order_id);
    }

    if (!paymentRow) {
      logger.error('Payment row still missing after recovery attempt', { kalaasutra_order_id, razorpay_order_id });
      return apiError(ErrorCode.INTERNAL_ERROR, 500, undefined, 'Unable to verify payment');
    }

    if (paymentRow.provider_order_id !== razorpay_order_id) {
      await PaymentService.linkProviderOrderId(paymentRow.id, razorpay_order_id);
    }

    try {
      const paymentId = paymentRow.id;

      // Record verification transaction (idempotent via provider_event_id)
      await PaymentService.recordTransaction(paymentId, kalaasutra_order_id, 'verification_succeeded', razorpay_payment_id, { signature: razorpay_signature }, razorpay_payment_id);

      // Mark payment as succeeded (durable write). If this fails, return 500 so provider/webhook retries.
      await PaymentService.markPaymentSucceeded(paymentId, kalaasutra_order_id, razorpay_payment_id, razorpay_signature, 'verify');

      // Now update the order state transactionally (best-effort)
      const { data: orderData, error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          order_status: 'confirmed'
        })
        .eq('id', kalaasutra_order_id)
        .select('customer_name, customer_phone')
        .single();

      if (updateError || !orderData) {
        // Log but do NOT mask success to provider — payment was recorded; admin can reconcile order status
        logger.error('Failed to update order status after payment ledger write', { error: updateError, kalaasutra_order_id });
        return apiError(ErrorCode.INTERNAL_ERROR, 500, undefined, 'Payment verified but failed to update order record');
      }

      // Call WhatsApp automation
      await WhatsAppService.sendOrderConfirmation(
        orderData.customer_phone,
        kalaasutra_order_number,
        orderData.customer_name,
      );

      logger.info('Payment verified and order confirmed', { kalaasutra_order_id, razorpay_payment_id });

      return apiSuccess({ success: true });
    } catch (e: any) {
      logger.error('Payment verification processing failed', { error: e?.message ?? String(e), kalaasutra_order_id });
      return apiError(ErrorCode.INTERNAL_ERROR, 500, undefined, 'Failed to persist payment records');
    }

  } catch (err: any) {
    logger.error('Error during payment verification', { error: err.message });
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }
}
