/**
 * POST /api/orders
 * Public order submission endpoint.
 * Protected by: rate limiting, Zod validation, server-side price validation (in service).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { OrderService } from '@/lib/services/order.service';
import { checkRateLimit, getRateLimitKey, rateLimitConfig } from '@/lib/rate-limit';
import {
  apiError,
  apiSuccess,
  corsPreflightResponse,
  withCorsHeaders,
  withRateLimitHeaders,
  ErrorCode,
} from '@/lib/api-response';
import { logger, generateRequestId } from '@/lib/logger';

// ─── Validation Schemas ───────────────────────────────────────────────────────
const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(50, 'Quantity too large'),
  customization_data: z.record(z.string(), z.unknown()).optional().nullable(),
});

const orderRequestSchema = z.object({
  orderData: z.object({
    customer_name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
    customer_phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .max(15, 'Phone too long')
      .regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone format'),
    customer_email: z.string().email('Invalid email').nullable().or(z.literal('')).optional(),
    customer_address: z.string().min(5, 'Address is required').max(500, 'Address too long').trim(),
    notes: z.string().max(500, 'Notes too long').nullable().optional(),
    promo_code: z.string().max(50).nullable().optional(),
    source: z.enum(['website', 'whatsapp', 'instagram', 'manual']).default('website'),
  }),
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must have at least one item')
    .max(20, 'Too many items in one order'),
});

// ─── OPTIONS preflight ────────────────────────────────────────────────────────
export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');

  // 1. Rate limiting
  const rlKey = getRateLimitKey(request, 'orders');
  const rl = checkRateLimit(rlKey, rateLimitConfig.orders);

  if (!rl.allowed) {
    logger.warn('Rate limit exceeded', { route: '/api/orders', method: 'POST', requestId });
    return withRateLimitHeaders(
      withCorsHeaders(apiError(ErrorCode.RATE_LIMITED, 429), origin),
      rl.limit, rl.remaining, rl.resetAt,
    );
  }

  // 2. Parse + validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return withCorsHeaders(apiError(ErrorCode.INVALID_PAYLOAD, 400), origin);
  }

  const parsed = orderRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    logger.warn('Order validation failed', { route: '/api/orders', requestId, fieldCount: Object.keys(fields).length });
    return withCorsHeaders(apiError(ErrorCode.VALIDATION_ERROR, 422, fields), origin);
  }

  const { orderData, items } = parsed.data;

  // 3. Call service (server-side price validation happens inside)
  try {
    const result = await OrderService.createOrder(orderData, items);
    logger.info('Order created', { route: '/api/orders', requestId, orderNumber: result.order_number });
    return withRateLimitHeaders(
      withCorsHeaders(
        apiSuccess(result, { order: result }),
        origin,
      ),
      rl.limit, rl.remaining, rl.resetAt,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';

    // Translate known business-logic errors into safe codes
    if (msg.includes('not available') || msg.includes('not found')) {
      logger.warn('Product unavailable during order', { route: '/api/orders', requestId });
      return withCorsHeaders(apiError(ErrorCode.PRODUCT_UNAVAILABLE, 400), origin);
    }
    if (msg.toLowerCase().includes('promo') || msg.toLowerCase().includes('coupon')) {
      logger.warn('Promo code failure during order', { route: '/api/orders', requestId });
      return withCorsHeaders(apiError(ErrorCode.PROMO_INVALID, 400), origin);
    }

    logger.apiError('/api/orders', 'POST', err, { requestId });
    return withCorsHeaders(apiError(ErrorCode.ORDER_FAILED, 500), origin);
  }
}
