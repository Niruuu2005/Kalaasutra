import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  assertRole: vi.fn(),
  reconcileMissedWebhooks: vi.fn(),
  loggerMock: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/services/auth-helper', () => ({
  ADMIN_ROLES: ['owner', 'admin'],
  assertRole: testState.assertRole,
}));
vi.mock('@/lib/jobs/reconciliation', () => ({
  reconcileMissedWebhooks: testState.reconcileMissedWebhooks,
}));
vi.mock('@/lib/logger', () => ({ logger: testState.loggerMock }));

import { POST } from '@/app/api/admin/payments/reconcile/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('admin payment reconciliation route', () => {
  it('runs reconciliation for authorized admins', async () => {
    testState.assertRole.mockResolvedValueOnce({ user: { id: 'user-1' }, profile: { role: 'admin' } });
    testState.reconcileMissedWebhooks.mockResolvedValueOnce({ reconciled: 2, scanned: 5 });

    const request = new Request('http://localhost/api/admin/payments/reconcile', {
      method: 'POST',
      body: JSON.stringify({ daysBack: 3, limit: 25 }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(testState.reconcileMissedWebhooks).toHaveBeenCalledWith({ daysBack: 3, limit: 25 });
  });

  it('rejects unauthorized access', async () => {
    testState.assertRole.mockRejectedValueOnce(new Error('Unauthorized: Authentication required.'));

    const request = new Request('http://localhost/api/admin/payments/reconcile', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(testState.reconcileMissedWebhooks).not.toHaveBeenCalled();
  });
});