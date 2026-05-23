import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { WhatsAppService } from '@/lib/services/whatsapp.service';
import { logger } from '@/lib/logger';
import { apiError, apiSuccess, ErrorCode } from '@/lib/api-response';

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

    // Signature is valid. Update order in Supabase
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
      logger.error('Failed to update order status after successful payment', { error: updateError, kalaasutra_order_id });
      return apiError(ErrorCode.INTERNAL_ERROR, 500, undefined, 'Payment verified but failed to update order record');
    }

    // Call WhatsApp automation
    await WhatsAppService.sendOrderConfirmation(
      orderData.customer_phone, 
      kalaasutra_order_number, 
      orderData.customer_name
    );

    logger.info('Payment verified and order confirmed', { kalaasutra_order_id, razorpay_payment_id });

    return apiSuccess({ success: true });

  } catch (err: any) {
    logger.error('Error during payment verification', { error: err.message });
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }
}
