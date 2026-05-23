/**
 * src/lib/api-response.ts
 * Standardized, safe API response helpers for all public route handlers.
 *
 * NEVER pass raw error.message from Supabase/DB here — use the helpers below
 * to ensure internal system details are never sent to clients.
 */

import { NextResponse } from 'next/server';

// ─── Error Codes ──────────────────────────────────────────────────────────────
export const ErrorCode = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  // Auth / authz
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',
  // Business logic
  ORDER_FAILED: 'ORDER_FAILED',
  PRODUCT_UNAVAILABLE: 'PRODUCT_UNAVAILABLE',
  PROMO_INVALID: 'PROMO_INVALID',
  PROMO_EXPIRED: 'PROMO_EXPIRED',
  PROMO_MIN_ORDER: 'PROMO_MIN_ORDER',
  INQUIRY_FAILED: 'INQUIRY_FAILED',
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Safe User-Facing Messages ────────────────────────────────────────────────
const SAFE_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Some fields are missing or invalid. Please check your input and try again.',
  MISSING_FIELDS: 'Required fields are missing. Please fill in all required information.',
  INVALID_PAYLOAD: 'The request format is incorrect. Please try again.',
  UNAUTHORIZED: 'Authentication required. Please sign in and try again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  ORDER_FAILED: 'We could not process your order right now. Please try again or contact us on WhatsApp.',
  PRODUCT_UNAVAILABLE: 'One or more items in your cart are no longer available.',
  PROMO_INVALID: 'This promo code is invalid or has expired.',
  PROMO_EXPIRED: 'This promo code has expired.',
  PROMO_MIN_ORDER: 'Your order total does not meet the minimum required for this promo code.',
  INQUIRY_FAILED: 'We could not submit your enquiry right now. Please try again or contact us on WhatsApp.',
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again in a moment.',
  NOT_FOUND: 'The requested resource could not be found.',
};

// ─── Response Builders ────────────────────────────────────────────────────────

export interface ApiErrorBody {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    /** Structured field-level validation errors — safe to expose */
    fields?: Record<string, string[]>;
  };
}

export interface ApiSuccessBody<T = unknown> {
  success: true;
  data?: T;
  [key: string]: unknown; // allow extra top-level keys for backwards compat
}

/** Return a standardized error response. Never includes raw DB/internal errors. */
export function apiError(
  code: ErrorCode,
  httpStatus: number,
  fields?: Record<string, string[]>,
  /** Optional override message — must already be safe and user-facing */
  safeMessageOverride?: string,
): NextResponse<ApiErrorBody> {
  return NextResponse.json<ApiErrorBody>(
    {
      success: false,
      error: {
        code,
        message: safeMessageOverride ?? SAFE_MESSAGES[code],
        ...(fields ? { fields } : {}),
      },
    },
    { status: httpStatus },
  );
}

/** Return a standardized success response. */
export function apiSuccess<T>(data: T, extra?: Record<string, unknown>): NextResponse {
  return NextResponse.json({ success: true, ...extra, data }, { status: 200 });
}

/** Add rate-limit headers to any response. */
export function withRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number,
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
  return response;
}

/** Add CORS headers to a response based on allowed origins from env. */
export function withCorsHeaders(response: NextResponse, requestOrigin: string | null): NextResponse {
  const allowedOrigins = getAllowedOrigins();
  const origin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0] ?? 'http://localhost:3000';

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Idempotency-Key');
  response.headers.set('Vary', 'Origin');
  return response;
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return raw.split(',').map(o => o.trim()).filter(Boolean);
}

/** Handle OPTIONS preflight for CORS */
export function corsPreflightResponse(requestOrigin: string | null): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  return withCorsHeaders(res, requestOrigin);
}
