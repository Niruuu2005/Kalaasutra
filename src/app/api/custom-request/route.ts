/**
 * POST /api/custom-request
 * Public custom artwork inquiry submission endpoint.
 * Protected by: rate limiting, Zod validation, safe error responses.
 */
import { z } from 'zod';
import { CustomRequestService } from '@/lib/services/custom-request.service';
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
const customRequestSchema = z.object({
  customer_name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  customer_phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone too long')
    .regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone format'),
  customer_email: z.string().email('Invalid email').nullable().or(z.literal('')).optional(),
  product_id: z.string().uuid('Invalid product ID').nullable().optional(),
  request_type: z.string().max(100).nullable().optional(),
  description: z
    .string()
    .min(10, 'Please describe your custom artwork in at least 10 characters')
    .max(2000, 'Description is too long'),
  reference_image_urls: z.array(z.string().url('Invalid image URL')).max(5).nullable().optional(),
  estimated_budget: z
    .number()
    .positive('Budget must be a positive number')
    .max(1_000_000, 'Budget value is too high')
    .nullable()
    .optional(),
});

// ─── OPTIONS preflight ────────────────────────────────────────────────────────
export async function OPTIONS(request: Request) {
  return corsPreflightResponse(request.headers.get('origin'));
}

// ─── POST /api/custom-request ─────────────────────────────────────────────────
export async function POST(request: Request) {
  const requestId = generateRequestId();
  const origin = request.headers.get('origin');

  // 1. Rate limiting
  const rlKey = getRateLimitKey(request, 'custom-request');
  const rl = checkRateLimit(rlKey, rateLimitConfig.customRequest);

  if (!rl.allowed) {
    logger.warn('Rate limit exceeded', { route: '/api/custom-request', method: 'POST', requestId });
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

  const parsed = customRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }
    logger.warn('Custom request validation failed', { route: '/api/custom-request', requestId });
    return withCorsHeaders(apiError(ErrorCode.VALIDATION_ERROR, 422, fields), origin);
  }

  const input = parsed.data;

  // 3. Call service
  try {
    const result = await CustomRequestService.createCustomRequest({
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email || null,
      product_id: input.product_id || null,
      request_type: input.request_type || null,
      description: input.description,
      reference_image_urls: input.reference_image_urls || null,
      estimated_budget: input.estimated_budget ?? null,
    });

    logger.info('Custom request submitted', { route: '/api/custom-request', requestId });
    return withRateLimitHeaders(
      withCorsHeaders(apiSuccess(result, { customRequest: result }), origin),
      rl.limit, rl.remaining, rl.resetAt,
    );
  } catch (err) {
    logger.apiError('/api/custom-request', 'POST', err, { requestId });
    return withCorsHeaders(apiError(ErrorCode.INQUIRY_FAILED, 500), origin);
  }
}
