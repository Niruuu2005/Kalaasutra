# Implementation Roadmap

## M1 — Foundation & Refactor
- Goal: establish the domain model and authorization boundary needed for production payment and tracking work.
- Scope: normalize admin role checks, introduce payment/order history schema changes, and prepare shared domain types.
- Dependencies: none.
- Risks: schema churn can ripple into admin UI and API contracts.
- DB changes: add payment ledger tables, webhook logs, and order status history; extend order rows for processor references and attempt metadata.
- API changes: none required in the first sub-slice if the migration is additive.
- Frontend changes: minimal, mostly role-gate cleanup and type updates.
- Backend changes: tighten admin access to owner/admin and centralize the helper.
- Test strategy: unit tests for the role helper and a focused validation pass for the updated admin gates.
- Rollback strategy: keep the new tables additive and avoid destructive column drops in the first pass.
- Acceptance criteria: admin-only server methods are no longer reachable with generic user access, and the schema can represent payment history without overloading the `orders` row.

## M2 — Authentication
- Goal: deliver production-ready Supabase auth flows.
- Scope: signup, login, logout, forgot password, reset password, email verification, and protected route/session lifecycle.
- Dependencies: M1 role model and route boundaries.
- Risks: auth redirects and cookie refresh behavior can regress if session handling is inconsistent.
- DB changes: profile bootstrap and verification timestamps if needed.
- API changes: auth/session endpoints or server actions as required.
- Frontend changes: new auth pages and reusable form states.
- Backend changes: session helpers and route protection.
- Test strategy: route guards, auth form validation, and session refresh checks.
- Rollback strategy: keep auth pages isolated behind routing so the storefront remains functional.
- Acceptance criteria: users can sign up, verify, log in/out, and reset passwords without exposing admin-only surfaces.

## M3 — Razorpay Integration
- Goal: implement a production-grade payment flow with server-side verification and webhook reconciliation.
- Scope: create-order API, checkout integration, signature verification, retry support, payment logs, and webhook handler.
- Dependencies: M1 schema and M2 auth/session handling.
- Risks: payment idempotency and duplicate webhook processing.
- DB changes: payments, transactions, logs, and processor reference fields.
- API changes: payment initiation and webhook routes.
- Frontend changes: checkout integration, success/failure callbacks, retry UX.
- Backend changes: verification service, webhook reconciliation, idempotency guards.
- Test strategy: service tests for verification and webhook idempotency plus integration tests for payment routes.
- Rollback strategy: keep manual fallback checkout path until payment confidence is established.
- Acceptance criteria: payment success is never trusted from the browser alone, and order payment state can be reconciled server-side.

## M4 — Order Management & Tracking
- Goal: make order status visible as a lifecycle rather than a single field.
- Scope: order status history, tracking timeline, estimated delivery visibility, admin status updates.
- Dependencies: M1 and M3.
- Risks: status transitions can become inconsistent without a single write path.
- DB changes: status history rows and transition metadata.
- API changes: tracking endpoint returns history and enriched order details.
- Frontend changes: richer tracking UI and admin timeline views.
- Backend changes: status transition service and audit writes.
- Test strategy: status transition unit tests and tracking integration tests.
- Rollback strategy: preserve current status fields while adding the event log.
- Acceptance criteria: users can see a timeline, and admins can update the order lifecycle without losing history.

## M5 — Admin Operations
- Goal: make admin workflows safer and more operationally useful.
- Scope: refund-ready controls, payment reconciliation views, order search improvements, and audit display.
- Dependencies: M3 and M4.
- Risks: overexposing financial controls without proper role checks.
- DB changes: optional audit metadata fields.
- API changes: admin mutation routes for payment and refund operations.
- Frontend changes: admin controls and operational dashboards.
- Backend changes: policy-driven mutation helpers.
- Test strategy: admin mutation integration tests and role checks.
- Rollback strategy: keep refund actions behind explicit permission gates.
- Acceptance criteria: admins can manage payment/order state safely and review audit trails.

## M6 — Production Readiness
- Goal: harden the platform for scale, observability, and support.
- Scope: shared rate limiting, structured logging, analytics, feature flags, error boundaries, loading states, and accessibility.
- Dependencies: all prior milestones.
- Risks: broad surface-area changes if done before core flows are stable.
- DB changes: optional telemetry tables only if required.
- API changes: versioning or telemetry hooks as needed.
- Frontend changes: UI polish, responsive states, and better fallbacks.
- Backend changes: shared limiter and observability improvements.
- Test strategy: smoke tests and regression checks around checkout/login/tracking.
- Rollback strategy: keep feature flags for any risky production toggles.
- Acceptance criteria: the app fails gracefully, logs clearly, and supports support/debug workflows without exposing secrets.