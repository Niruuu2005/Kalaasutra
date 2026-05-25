import { apiError, apiSuccess, ErrorCode } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { reconcileMissedWebhooks } from '@/lib/jobs/reconciliation';
import { ADMIN_ROLES, assertRole } from '@/lib/services/auth-helper';

async function handleReconciliation(request: Request) {
  try {
    await assertRole(ADMIN_ROLES);

    let body: { daysBack?: number; limit?: number } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const daysBack = Number.isFinite(body.daysBack) ? Number(body.daysBack) : 7;
    const limit = Number.isFinite(body.limit) ? Number(body.limit) : 200;

    const result = await reconcileMissedWebhooks({ daysBack, limit });
    return apiSuccess(result, { message: 'Reconciliation completed' });
  } catch (err: any) {
    const message = err?.message ?? String(err);

    if (message.startsWith('Unauthorized')) {
      return apiError(ErrorCode.UNAUTHORIZED, 401);
    }

    if (message.startsWith('Forbidden')) {
      return apiError(ErrorCode.FORBIDDEN, 403);
    }

    logger.error('Failed to run payment reconciliation', { error: message });
    return apiError(ErrorCode.INTERNAL_ERROR, 500);
  }
}

export async function GET(request: Request) {
  return handleReconciliation(request);
}

export async function POST(request: Request) {
  return handleReconciliation(request);
}