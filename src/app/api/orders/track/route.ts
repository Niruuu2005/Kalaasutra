import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getRateLimitKey, rateLimitConfig } from '@/lib/rate-limit';
import {
  apiError,
  apiSuccess,
  withRateLimitHeaders,
  ErrorCode,
} from '@/lib/api-response';

const trackSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  phoneNumber: z.string().min(5).max(15).regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone format'),
});

export async function POST(request: Request) {
  // Rate limiting to prevent brute forcing order numbers
  const rlKey = getRateLimitKey(request, 'orders');
  const rl = checkRateLimit(rlKey, { ...rateLimitConfig.orders, limit: 20 }); // strict tracking rate limit

  if (!rl.allowed) {
    return withRateLimitHeaders(
      apiError(ErrorCode.RATE_LIMITED, 429),
      rl.limit, rl.remaining, rl.resetAt,
    );
  }

  try {
    const body = await request.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(ErrorCode.VALIDATION_ERROR, 400);
    }

    const { orderNumber, phoneNumber } = parsed.data;
    
    // Clean phone number for comparison (keep only digits)
    const cleanInputPhone = phoneNumber.replace(/\D/g, '');

    const supabaseAdmin = createAdminClient();

    // Fetch order securely using admin client to bypass SELECT RLS
    // Wait, let's fetch order and items!
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return apiError(ErrorCode.NOT_FOUND, 404, undefined, 'Order not found');
    }

    // Verify phone number
    const cleanOrderPhone = order.customer_phone.replace(/\D/g, '');
    if (cleanInputPhone !== cleanOrderPhone) {
      // Return not found to prevent leaking existence of an order number
      return apiError(ErrorCode.NOT_FOUND, 404, undefined, 'Order not found or phone number does not match');
    }

    // Return safe data
    return withRateLimitHeaders(
      apiSuccess({ order }, { message: 'Order found' }),
      rl.limit, rl.remaining, rl.resetAt
    );

  } catch (err) {
    console.error('Order tracking error:', err);
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }
}
