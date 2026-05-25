-- 00006_order_idempotency.sql
-- Add checkout idempotency so retries cannot create duplicate orders.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key
  ON public.orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key_lookup
  ON public.orders(idempotency_key)
  WHERE idempotency_key IS NOT NULL;