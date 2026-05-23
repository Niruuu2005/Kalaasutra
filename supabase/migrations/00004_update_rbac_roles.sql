-- 00004_update_rbac_roles.sql
-- Refines roles to 'owner', 'admin', 'user'

BEGIN;

-- 1. Drop existing role constraint and policies
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Update existing rows to new roles
UPDATE public.profiles SET role = 'user' WHERE role = 'viewer';
UPDATE public.profiles SET role = 'admin' WHERE role IN ('manager', 'editor', 'order_staff');

-- 3. Add new role constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('owner', 'admin', 'user'));

-- 4. Update user creation trigger to default to 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT COUNT(*) = 0 INTO is_first_user FROM public.profiles;
  
  INSERT INTO public.profiles (id, full_name, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN is_first_user THEN 'owner' ELSE 'user' END,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Recreate check_product_price_permissions trigger
CREATE OR REPLACE FUNCTION public.check_product_price_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF public.get_user_role(auth.uid()) NOT IN ('owner', 'admin') THEN
    IF OLD.base_price IS DISTINCT FROM NEW.base_price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
      RAISE EXCEPTION 'Only owners and admins are allowed to modify prices.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Recreate check_settings_permissions trigger
CREATE OR REPLACE FUNCTION public.check_settings_permissions()
RETURNS TRIGGER AS $$
DECLARE
  role TEXT;
BEGIN
  role := public.get_user_role(auth.uid());
  IF role = 'owner' THEN
    RETURN NEW;
  ELSIF role = 'admin' THEN
    -- Admins cannot change site_status (critical setting)
    IF NEW.key = 'site_status' THEN
      RAISE EXCEPTION 'Only owners can modify the website status (site_status).';
    END IF;
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Access denied. You do not have permissions to modify site settings.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Update Policies to use new role array ['owner', 'admin', 'user']

-- Profiles
DROP POLICY IF EXISTS "Profiles are readable by admins" ON public.profiles;
CREATE POLICY "Profiles are readable by admins" ON public.profiles
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

-- Categories
DROP POLICY IF EXISTS "Categories are readable by admins even if inactive" ON public.categories;
CREATE POLICY "Categories are readable by admins even if inactive" ON public.categories
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Categories can be modified by content managers/editors" ON public.categories;
CREATE POLICY "Categories can be modified by content managers/editors" ON public.categories
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Products
DROP POLICY IF EXISTS "Products are readable by admins in any status" ON public.products;
CREATE POLICY "Products are readable by admins in any status" ON public.products
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Products can be created/deleted by owner/manager" ON public.products;
CREATE POLICY "Products can be created/deleted by owner/manager" ON public.products
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Products can be updated by editors" ON public.products;
CREATE POLICY "Products can be updated by editors" ON public.products
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Product Media
DROP POLICY IF EXISTS "Product media is readable by admins for all products" ON public.product_media;
CREATE POLICY "Product media is readable by admins for all products" ON public.product_media
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Product media can be modified by content managers/editors" ON public.product_media;
CREATE POLICY "Product media can be modified by content managers/editors" ON public.product_media
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Product Variants
DROP POLICY IF EXISTS "Product variants are readable by admins for all products" ON public.product_variants;
CREATE POLICY "Product variants are readable by admins for all products" ON public.product_variants
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Product variants can be modified by owner/manager" ON public.product_variants;
CREATE POLICY "Product variants can be modified by owner/manager" ON public.product_variants
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Custom Options
DROP POLICY IF EXISTS "Custom options are readable by admins" ON public.custom_options;
CREATE POLICY "Custom options are readable by admins" ON public.custom_options
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Custom options can be modified by owner/manager" ON public.custom_options;
CREATE POLICY "Custom options can be modified by owner/manager" ON public.custom_options
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Offers
DROP POLICY IF EXISTS "Offers are readable by admins" ON public.offers;
CREATE POLICY "Offers are readable by admins" ON public.offers
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Offers can be modified by owner/manager" ON public.offers;
CREATE POLICY "Offers can be modified by owner/manager" ON public.offers
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Offer Products/Categories
DROP POLICY IF EXISTS "Offer scopes readable by admins" ON public.offer_products;
CREATE POLICY "Offer scopes readable by admins" ON public.offer_products
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Offer scopes modified by owner/manager" ON public.offer_products;
CREATE POLICY "Offer scopes modified by owner/manager" ON public.offer_products
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

DROP POLICY IF EXISTS "Offer categories readable by admins" ON public.offer_categories;
CREATE POLICY "Offer categories readable by admins" ON public.offer_categories
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Offer categories modified by owner/manager" ON public.offer_categories;
CREATE POLICY "Offer categories modified by owner/manager" ON public.offer_categories
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Site Settings
DROP POLICY IF EXISTS "Site settings are readable by admins" ON public.site_settings;
CREATE POLICY "Site settings are readable by admins" ON public.site_settings
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Site settings can be modified by admins based on permissions trigger" ON public.site_settings;
CREATE POLICY "Site settings can be modified by admins based on permissions trigger" ON public.site_settings
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Orders
DROP POLICY IF EXISTS "Orders readable by authorized staff" ON public.orders;
CREATE POLICY "Orders readable by authorized staff" ON public.orders
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Orders updatable by staff" ON public.orders;
CREATE POLICY "Orders updatable by staff" ON public.orders
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Order Items
DROP POLICY IF EXISTS "Order items readable by authorized staff" ON public.order_items;
CREATE POLICY "Order items readable by authorized staff" ON public.order_items
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Order items updatable by staff" ON public.order_items;
CREATE POLICY "Order items updatable by staff" ON public.order_items
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Custom Requests
DROP POLICY IF EXISTS "Custom requests readable by staff" ON public.custom_requests;
CREATE POLICY "Custom requests readable by staff" ON public.custom_requests
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Custom requests updatable by staff" ON public.custom_requests;
CREATE POLICY "Custom requests updatable by staff" ON public.custom_requests
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Testimonials
DROP POLICY IF EXISTS "Testimonials readable by admins" ON public.testimonials;
CREATE POLICY "Testimonials readable by admins" ON public.testimonials
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

DROP POLICY IF EXISTS "Testimonials modified by content managers/editors" ON public.testimonials;
CREATE POLICY "Testimonials modified by content managers/editors" ON public.testimonials
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'admin']));

-- Audit Logs
DROP POLICY IF EXISTS "Audit logs readable by owner and viewer" ON public.audit_logs;
CREATE POLICY "Audit logs readable by owner and viewer" ON public.audit_logs
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'admin', 'user']));

COMMIT;
