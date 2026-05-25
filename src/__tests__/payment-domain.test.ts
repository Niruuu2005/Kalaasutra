import { describe, it, expect } from 'vitest';
import {
  ORDER_TRACKING_STATUSES,
  PAYMENT_STATES,
  isOrderTrackingStatus,
  isPaymentState,
} from '@/lib/payment-domain';

describe('payment domain constants', () => {
  it('includes the production payment states', () => {
    expect(PAYMENT_STATES).toEqual(['initiated', 'pending', 'paid', 'failed', 'refunded', 'cancelled']);
  });

  it('includes the production tracking statuses', () => {
    expect(ORDER_TRACKING_STATUSES).toEqual([
      'order_placed',
      'payment_pending',
      'payment_confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded',
    ]);
  });

  it('validates domain values', () => {
    expect(isPaymentState('paid')).toBe(true);
    expect(isPaymentState('unknown')).toBe(false);
    expect(isOrderTrackingStatus('shipped')).toBe(true);
    expect(isOrderTrackingStatus('new')).toBe(false);
  });
});