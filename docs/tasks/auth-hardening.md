# Feature Plan

## Goal
Tighten the admin authorization boundary so only owner/admin roles can access administrative actions and dashboard data.

## Problem Being Solved
The current server-side role checks still allow the generic `user` role to reach several admin-facing data paths. That weakens the privilege boundary and makes the admin workspace harder to reason about.

## Current State
Admin access is spread across [src/lib/services/auth-helper.ts](../../src/lib/services/auth-helper.ts), [src/app/actions/admin.ts](../../src/app/actions/admin.ts), and service classes under [src/lib/services](../../src/lib/services). Some methods use `['owner', 'admin', 'user']` even when they feed admin screens.

## Proposed Architecture
Introduce a single admin-role constant, keep the public `assertRole` helper, and update admin-facing actions/services to use a shared owner/admin requirement.

## DB Changes
None for this slice.

## API Contracts
Request: unchanged.
Response: unchanged, but unauthorized requests should now be rejected earlier.
Error Cases: unauthorized users receive a forbidden or redirect outcome instead of entering the admin workspace.

## Frontend Flow
The admin dashboard should still load for authorized users and redirect unauthorized users back to login.

## Backend Flow
Server actions and service methods should check the shared owner/admin role set before returning admin data or mutating privileged resources.

## Security Considerations
This is a privilege-boundary fix. It should not introduce new access paths, and it should not widen any public endpoints.

## Edge Cases
- A session exists but the profile is inactive.
- A user has a valid session but lacks admin privileges.
- An existing user role value is stale or unexpected.

## Failure Handling
Fall back to login or forbidden behavior; do not expose any admin data on failed role checks.

## Rollback Plan
Revert the role-constant changes and the updated call sites if this blocks a legitimate admin workflow.

## Acceptance Criteria
- Admin-only server methods no longer allow generic `user` access.
- The dashboard redirects non-admin users away from privileged screens.
- The new helper is unit-tested.