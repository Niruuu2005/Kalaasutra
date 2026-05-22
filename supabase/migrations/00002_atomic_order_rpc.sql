-- supabase/migrations/00002_atomic_order_rpc.sql

-- Define the custom type for order items input to the RPC
CREATE TYPE public.order_item_input AS (
  product_id UUID,
  product_title TEXT,
  quantity INTEGER,
  unit_price NUMERIC(12, 2),
  final_price NUMERIC(12, 2),
  customization_data JSONB
);

-- RPC function to atomically create an order and its line items
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_order_number TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_customer_email TEXT,
  p_customer_address TEXT,
  p_total_amount NUMERIC(12, 2),
  p_discount_amount NUMERIC(12, 2),
  p_final_amount NUMERIC(12, 2),
  p_source TEXT,
  p_notes TEXT,
  p_items public.order_item_input[]
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to insert order (bypassing strict RLS if needed for unauthenticated users, though RLS on insert is currently allowed for all)
AS $$
DECLARE
  v_order public.orders;
  v_item public.order_item_input;
BEGIN
  -- Insert the main order record
  INSERT INTO public.orders (
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    total_amount,
    discount_amount,
    final_amount,
    payment_status,
    order_status,
    source,
    notes
  ) VALUES (
    p_order_number,
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    p_customer_address,
    p_total_amount,
    p_discount_amount,
    p_final_amount,
    'pending',
    'new',
    p_source,
    p_notes
  )
  RETURNING * INTO v_order;

  -- Insert order items
  IF array_length(p_items, 1) > 0 THEN
    FOREACH v_item IN ARRAY p_items LOOP
      INSERT INTO public.order_items (
        order_id,
        product_id,
        product_title,
        quantity,
        unit_price,
        final_price,
        customization_data
      ) VALUES (
        v_order.id,
        v_item.product_id,
        v_item.product_title,
        v_item.quantity,
        v_item.unit_price,
        v_item.final_price,
        v_item.customization_data
      );
    END LOOP;
  END IF;

  RETURN v_order;
END;
$$;
