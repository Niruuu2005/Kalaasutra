/**
 * POST /api/offers/validate
 * Public promo code validation endpoint.
 * Protected by: rate limiting, Zod validation, safe error responses.
 */
import { z } from 'zod';
import { OfferService } from '@/lib/services/offer.service';
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

// ─── Validation Schema ────────────────────────────────────────────────────────
const promoValidateSchema = z.object({
  code: z
    .string()
    .min(1, 'Promo code is required')
    .max(50, 'Promo code too long')
    .regex(/^[A-Z0-9_\-]+$/i, 'Invalid promo code format'),
  orderValue: z
    .number()
    .nonnegative('Order value must be a non-negative number')
    .max(10_000_000, 'Order value too large'),
});

// ─── OPTIONS preflight ────────────────────────────────────────────────────────
export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}

// ─── POST /api/offers/validate ────────────────────────────────────────────────
export async function POST(request: Request) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');

  // 1. Rate limiting
  const rlKey = getRateLimitKey(request, 'offers-validate');
  const rl = checkRateLimit(rlKey, rateLimitConfig.promoValidate);

  if (!rl.allowed) {
    logger.warn('Rate limit exceeded', { route: '/api/offers/validate', method: 'POST', requestId });
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

  const parsed = promoValidateSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    return withCorsHeaders(apiError(ErrorCode.VALIDATION_ERROR, 422, fields), origin);
  }

  const { code, orderValue } = parsed.data;

  // 3. Validate promo
  try {
    const result = await OfferService.validatePromoCode(code, orderValue);
    return withRateLimitHeaders(
      withCorsHeaders(
        apiSuccess(result, { offer: result.offer, discountAmount: result.discountAmount }),
        origin,
      ),
      rl.limit, rl.remaining, rl.resetAt,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';

    // Translate known service errors to safe codes — do NOT forward raw messages
    if (msg.toLowerCase().includes('minimum')) {
      return withCorsHeaders(
        apiError(ErrorCode.PROMO_MIN_ORDER, 400, undefined,
          msg.replace(/₹\d+/, match => match) // keep the ₹ amount — it's not PII
        ),
        origin,
      );
    }
    if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
      return withCorsHeaders(apiError(ErrorCode.PROMO_INVALID, 400), origin);
    }

    logger.apiError('/api/offers/validate', 'POST', err, { requestId });
    return withCorsHeaders(apiError(ErrorCode.INTERNAL_ERROR, 500), origin);
  }
}
