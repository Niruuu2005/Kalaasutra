import { describe, it, expect } from 'vitest';
import { ADMIN_ROLES, isRoleAllowed } from '@/lib/services/auth-helper';

describe('auth helper role checks', () => {
  it('allows owner and admin roles for admin access', () => {
    expect(isRoleAllowed('owner', ADMIN_ROLES)).toBe(true);
    expect(isRoleAllowed('admin', ADMIN_ROLES)).toBe(true);
  });

  it('rejects user role for admin access', () => {
    expect(isRoleAllowed('user', ADMIN_ROLES)).toBe(false);
  });
});