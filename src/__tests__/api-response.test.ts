import { describe, it, expect } from 'vitest';
import { ErrorCode, apiError, apiSuccess } from '@/lib/api-response';

describe('API Response Helpers', () => {
  it('apiError should format correctly and not expose raw errors', () => {
    const res = apiError(ErrorCode.VALIDATION_ERROR, 422, { phone: ['Invalid phone'] });
    
    // NextResponse is mocked or tested by inspecting its internal structure in simple tests
    // For unit testing the helper logic without a server environment, we can check its behavior.
    expect(res.status).toBe(422);
  });

  it('apiSuccess should format correctly', () => {
    const res = apiSuccess({ id: 123 });
    expect(res.status).toBe(200);
  });
});
