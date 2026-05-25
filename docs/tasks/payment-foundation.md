# Feature Plan

## Goal
Create the payment and order-history foundation needed for production Razorpay integration, retries, reconciliation, and order tracking.

## Problem Being Solved
The current schema only models orders and order items. That is not enough to represent payment attempts, processor callbacks, webhook reconciliation, refund readiness, or a historical order timeline.

## Current State
Orders are stored in `orders`, items in `order_items`, and payment status is collapsed into a small set of fields on the order row. There is no dedicated payment ledger or event history table.

## Proposed Architecture
Add an additive payment domain that stores payment attempts, transaction events, operational logs, and order status history while preserving the current order tables for compatibility.

## DB Changes
- Add a `payment_state` enum.
- Add an `order_tracking_status` enum.
- Add `payments`, `payment_transactions`, `payment_logs`, and `order_status_history` tables.
- Add indexes and update triggers for the new tables.

## API Contracts
Request: unchanged for this slice.
Response: unchanged for this slice.
Error Cases: schema migration failures should block deployment before payment logic is moved over.

## Frontend Flow
No immediate UI change is required for the foundation slice.

## Backend Flow
The backend will gain durable storage primitives for payment attempts, provider events, and future order-timeline reads.

## Security Considerations
The new tables should store provider event metadata without trusting client-reported payment state.

## Edge Cases
- Multiple payment retries for the same order.
- Duplicate webhook delivery.
- A payment succeeds after the browser has already closed.

## Failure Handling
The schema should be additive so the current storefront continues to work if the new payment layer is not yet consumed.

## Rollback Plan
Drop the new tables and enums only if this slice needs to be reverted before any checkout code consumes them.

## Acceptance Criteria
- The database can store payment attempts, transaction events, and order history.
- The new payment states are represented in shared types.
- The foundation remains backward-compatible with the existing storefront.