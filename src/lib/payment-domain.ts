export const PAYMENT_STATES = [
  'initiated',
  'pending',
  'paid',
  'failed',
  'refunded',
  'cancelled',
] as const;

export type PaymentState = (typeof PAYMENT_STATES)[number];

export const ORDER_TRACKING_STATUSES = [
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
] as const;

export type OrderTrackingStatus = (typeof ORDER_TRACKING_STATUSES)[number];

export const PAYMENT_TRANSACTION_TYPES = [
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded',
  'cancelled',
  'webhook_received',
  'verification_succeeded',
  'verification_failed',
  'reconciled',
] as const;

export type PaymentTransactionType = (typeof PAYMENT_TRANSACTION_TYPES)[number];

export function isPaymentState(value: string): value is PaymentState {
  return PAYMENT_STATES.includes(value as PaymentState);
}

export function isOrderTrackingStatus(value: string): value is OrderTrackingStatus {
  return ORDER_TRACKING_STATUSES.includes(value as OrderTrackingStatus);
}