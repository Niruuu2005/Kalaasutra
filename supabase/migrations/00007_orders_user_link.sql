-- 00007_orders_user_link.sql
-- Link orders with authenticated customer profiles (nullable for guest checkout)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders(user_id);
