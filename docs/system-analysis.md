# System Analysis Report

## Executive Summary
- Current maturity level: medium-low for a production commerce workflow.
- Major risks: payment trust boundary gaps, incomplete authorization boundaries, and missing durable order/payment history.
- Technical debt: coarse order/payment schema, in-memory rate limiting, and duplicated role assumptions across UI and services.
- Scalability score: 4/10.
- Security score: 5/10.

## Existing Architecture
- Frontend analysis: the app uses Next.js App Router with a client-heavy checkout flow centered on [src/components/OrderDrawer.tsx](../src/components/OrderDrawer.tsx) and a public tracking page in [src/app/track/page.tsx](../src/app/track/page.tsx).
- Backend analysis: route handlers live under [src/app/api/**](../src/app/api) and business logic is in [src/lib/services/**](../src/lib/services), which is a reasonable split, but payment orchestration is still embedded in the checkout endpoint.
- Infra assumptions: the project is Supabase-backed with server and admin clients, plus Razorpay SDK support already installed in `package.json`.
- Database analysis: the schema has `orders` and `order_items`, but no dedicated payment ledger, webhook reconciliation table, or status history table, which limits auditability and refund readiness.

## Critical Issues

### P0
- Problem: payment verification is callback-centric and does not yet have webhook reconciliation or durable payment state tracking.
- Why it matters: browser callbacks can fail or be replayed, and the current design cannot reliably reconcile payment truth if the client disconnects.
- Risk level: high.
- Affected files: [src/app/api/orders/route.ts](../src/app/api/orders/route.ts), [src/app/api/orders/verify/route.ts](../src/app/api/orders/verify/route.ts), [src/components/OrderDrawer.tsx](../src/components/OrderDrawer.tsx), [supabase/migrations/00001_initial_schema.sql](../supabase/migrations/00001_initial_schema.sql).
- Recommended fix: create a payment domain with server-owned state, signature verification, webhook handlers, idempotency keys, and a transaction log.

- Problem: authorization boundaries are inconsistent across admin actions and services.
- Why it matters: several server methods still accept the generic `user` role for admin-facing work, which weakens privilege separation.
- Risk level: high.
- Affected files: [src/lib/services/auth-helper.ts](../src/lib/services/auth-helper.ts), [src/app/actions/admin.ts](../src/app/actions/admin.ts), [src/lib/services/order.service.ts](../src/lib/services/order.service.ts), [src/lib/services/product.service.ts](../src/lib/services/product.service.ts), [src/lib/services/offer.service.ts](../src/lib/services/offer.service.ts), [src/lib/services/category.service.ts](../src/lib/services/category.service.ts), [src/lib/services/site-settings.service.ts](../src/lib/services/site-settings.service.ts), [src/lib/services/custom-request.service.ts](../src/lib/services/custom-request.service.ts).
- Recommended fix: normalize admin access to owner/admin only and centralize the role boundary in one helper.

### P1
- Problem: order tracking is a lookup page with a single status label rather than a status history timeline.
- Why it matters: users and admins need a lifecycle trail for support, SLA visibility, and payment/order reconciliation.
- Risk level: medium.
- Affected files: [src/app/track/page.tsx](../src/app/track/page.tsx), [src/app/api/orders/track/route.ts](../src/app/api/orders/track/route.ts), [src/components/admin/OrdersTab.tsx](../src/components/admin/OrdersTab.tsx).
- Recommended fix: add an order history table and render the timeline from event rows instead of deriving everything from the current status.

- Problem: rate limiting is in-memory only.
- Why it matters: it will not behave correctly across multiple server instances or cold starts in production.
- Risk level: medium.
- Affected files: [src/lib/rate-limit.ts](../src/lib/rate-limit.ts).
- Recommended fix: move to a shared store-backed limiter for production.

- Problem: the auth UX exposes only admin login, not the full signup/reset lifecycle.
- Why it matters: a real customer/admin user journey needs signup, password reset, and email verification.
- Risk level: medium.
- Affected files: [src/app/admin/login/page.tsx](../src/app/admin/login/page.tsx), [src/lib/supabase/client.ts](../src/lib/supabase/client.ts), [src/lib/supabase/server.ts](../src/lib/supabase/server.ts).
- Recommended fix: add dedicated auth pages and session-management flows on top of Supabase Auth.

### P2
- Problem: observability, analytics, and graceful failure paths are not standardized.
- Why it matters: production operations require traceable errors, monitoring, and user-safe failure states.
- Risk level: low-medium.
- Affected files: [src/lib/logger.ts](../src/lib/logger.ts), route handlers, and checkout components.
- Recommended fix: standardize error boundaries, structured logging, and post-payment observability.

## Missing Features
- Payments: order creation API, payment initiation state, secure signature verification, webhook reconciliation, retries, refunds, and payment logs.
- Order tracking: lifecycle events, timeline UI, admin update history, estimated delivery display, and support context.
- Auth: signup, login, logout, forgot-password, reset-password, email verification, and protected-route/session lifecycle UX.
- Startup readiness: shared rate limiting, monitoring, analytics, feature flags, API versioning, stronger loading/error states, and accessibility hardening.

## Refactor Recommendations
- Split payment orchestration out of checkout and into a dedicated payment service.
- Introduce a status-history table so order updates are event-driven rather than overwritten in place.
- Normalize admin authorization checks through a single role helper and stop using generic `user` access for admin tools.
- Add explicit domain types for payment state, payment attempts, and webhook events.

## Recommended Architecture
- Keep Next.js App Router for the storefront and admin UI.
- Keep Supabase Auth as the identity provider.
- Use Supabase Postgres as the source of truth for orders, payments, and status history.
- Treat Razorpay as an external payment processor and reconcile it through server callbacks and webhooks only.
- Keep public tracking guest-safe, but back it with a richer order-event model.

## Suggested Milestones
- M1: foundation and domain refactor.
- M2: authentication and authorization hardening.
- M3: Razorpay payment domain and webhook support.
- M4: order lifecycle and tracking history.
- M5: admin operations and refund-ready controls.
- M6: production hardening, observability, and testing.