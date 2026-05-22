-- 00001_initial_schema.sql
-- Foundational Database Schema for Shubham Art Online Store

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define Roles Type check helper function if needed, but text constraints are fine.

-- =========================================================================
-- 1. TABLES DEFINITIONS
-- =========================================================================

-- Profiles table: references auth.users (Supabase native authentication schema)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'manager', 'editor', 'order_staff', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    category_id UUID REFERENCES public.categories ON DELETE SET NULL,
    base_price NUMERIC(12, 2) NOT NULL,
    sale_price NUMERIC(12, 2) CHECK (sale_price IS NULL OR sale_price >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('available', 'sold', 'custom_order', 'hidden', 'draft')),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_customizable BOOLEAN NOT NULL DEFAULT false,
    estimated_delivery_days INTEGER,
    material TEXT,
    size TEXT,
    color_theme TEXT,
    seo_title TEXT,
    seo_description TEXT,
    created_by UUID REFERENCES public.profiles ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_prices CHECK (sale_price IS NULL OR sale_price <= base_price)
);

-- Product Media table
CREATE TABLE IF NOT EXISTS public.product_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
    alt_text TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Product Variants table (Sizes, frame finishes, etc.)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
    name TEXT NOT NULL,                  -- e.g., 'Size', 'Frame'
    option_name TEXT NOT NULL,           -- e.g., 'A4', 'A3', 'Black Frame', 'Physical Copy'
    price_adjustment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom Options table (Custom fields like text input, reference image, dropdowns)
CREATE TABLE IF NOT EXISTS public.custom_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories ON DELETE CASCADE,
    label TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image_upload', 'color', 'size', 'dropdown', 'checkbox')),
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB,                       -- Array of option strings if input_type is dropdown
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Offers table (Discounts & Campaigns)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    code TEXT UNIQUE,                    -- coupon code if applicable, nullable for passive sale banners
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping', 'bundle')),
    discount_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    banner_image_url TEXT,
    applies_to TEXT NOT NULL DEFAULT 'all_products' CHECK (applies_to IN ('all_products', 'selected_products', 'selected_categories')),
    minimum_order_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Offer Products mapping table
CREATE TABLE IF NOT EXISTS public.offer_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
    UNIQUE(offer_id, product_id)
);

-- Offer Categories mapping table
CREATE TABLE IF NOT EXISTS public.offer_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES public.offers ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories ON DELETE CASCADE,
    UNIQUE(offer_id, category_id)
);

-- Site Settings table (Dynamic configurations)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_address TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(12, 2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_status TEXT NOT NULL DEFAULT 'new' CHECK (order_status IN ('new', 'confirmed', 'in_progress', 'ready', 'shipped', 'delivered', 'cancelled')),
    source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'instagram', 'manual')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE,
    product_id UUID REFERENCES public.products ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    final_price NUMERIC(12, 2) NOT NULL,
    customization_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Custom Requests table (Commission inquiries)
CREATE TABLE IF NOT EXISTS public.custom_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    product_id UUID REFERENCES public.products ON DELETE SET NULL,
    request_type TEXT,                    -- e.g., 'pencil_sketch', 'color_portrait'
    description TEXT,
    reference_image_urls TEXT[],          -- Array of public URLs
    estimated_budget NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'accepted', 'rejected', 'completed')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('instagram', 'whatsapp', 'website', 'manual')),
    is_visible BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles ON DELETE SET NULL,
    action TEXT NOT NULL,                 -- INSERT, UPDATE, DELETE
    entity_type TEXT NOT NULL,            -- e.g., 'products', 'offers', 'site_settings'
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. TRIGGER FUNCTIONS
-- =========================================================================

-- Trigger to auto-update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_custom_requests_updated_at ON public.custom_requests;
CREATE TRIGGER update_custom_requests_updated_at BEFORE UPDATE ON public.custom_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle auto-creation of profiles on Auth SignUp
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
    CASE WHEN is_first_user THEN 'owner' ELSE 'viewer' END,
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind the auth user trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Audit log trigger function
CREATE OR REPLACE FUNCTION public.log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
  old_data JSONB := null;
  new_data JSONB := null;
  actor UUID := null;
BEGIN
  -- Extract user ID from application session context if available
  actor := auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_value, new_value)
  VALUES (actor, TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), old_data, new_data);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind audit triggers
DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();
DROP TRIGGER IF EXISTS audit_offers ON public.offers;
CREATE TRIGGER audit_offers AFTER INSERT OR UPDATE OR DELETE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();
DROP TRIGGER IF EXISTS audit_settings ON public.site_settings;
CREATE TRIGGER audit_settings AFTER INSERT OR UPDATE OR DELETE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.log_audit_action();

-- =========================================================================
-- 3. SECURITY DEFINER HELPER FUNCTIONS (FOR RLS BYPASS AND CACHING)
-- =========================================================================

-- Fetch user role securely bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Check if user role is within a permitted set of roles
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  user_role := public.get_user_role(auth.uid());
  RETURN user_role = ANY(required_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to prevent Content Editors from updating product prices
CREATE OR REPLACE FUNCTION public.check_product_price_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF public.get_user_role(auth.uid()) NOT IN ('owner', 'manager') THEN
    IF OLD.base_price IS DISTINCT FROM NEW.base_price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price THEN
      RAISE EXCEPTION 'Only owners and managers are allowed to modify prices.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS restrict_product_price_updates ON public.products;
CREATE TRIGGER restrict_product_price_updates
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.check_product_price_permissions();

-- Trigger to enforce site settings editing rules based on role
CREATE OR REPLACE FUNCTION public.check_settings_permissions()
RETURNS TRIGGER AS $$
DECLARE
  role TEXT;
BEGIN
  role := public.get_user_role(auth.uid());
  IF role = 'owner' THEN
    RETURN NEW;
  ELSIF role = 'manager' THEN
    -- Managers cannot change site_status (critical setting)
    IF NEW.key = 'site_status' THEN
      RAISE EXCEPTION 'Only owners can modify the website status (site_status).';
    END IF;
    RETURN NEW;
  ELSIF role = 'editor' THEN
    -- Editors can only change specific layout/content keys
    IF NEW.key NOT IN ('homepage_banner', 'delivery_message', 'announcement_bar', 'faq') THEN
      RAISE EXCEPTION 'Editors can only update layout and content settings (banner, delivery message, announcements, FAQs).';
    END IF;
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Access denied. You do not have permissions to modify site settings.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS restrict_site_settings_updates ON public.site_settings;
CREATE TRIGGER restrict_site_settings_updates
  BEFORE INSERT OR UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.check_settings_permissions();

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by admins" ON public.profiles;
CREATE POLICY "Profiles are readable by admins" ON public.profiles
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Profiles can be read by their owners" ON public.profiles;
CREATE POLICY "Profiles can be read by their owners" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles can be updated by owners" ON public.profiles;
CREATE POLICY "Profiles can be updated by owners" ON public.profiles
  FOR UPDATE USING (public.check_user_role(ARRAY['owner'])) WITH CHECK (public.check_user_role(ARRAY['owner']));

DROP POLICY IF EXISTS "Users can update their own full_name" ON public.profiles;
CREATE POLICY "Users can update their own full_name" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4.2 Categories Policies
DROP POLICY IF EXISTS "Categories are readable by everyone" ON public.categories;
CREATE POLICY "Categories are readable by everyone" ON public.categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Categories are readable by admins even if inactive" ON public.categories;
CREATE POLICY "Categories are readable by admins even if inactive" ON public.categories
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Categories can be modified by content managers/editors" ON public.categories;
CREATE POLICY "Categories can be modified by content managers/editors" ON public.categories
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager', 'editor']));

-- 4.3 Products Policies
DROP POLICY IF EXISTS "Products are readable by everyone if active" ON public.products;
CREATE POLICY "Products are readable by everyone if active" ON public.products
  FOR SELECT USING (status IN ('available', 'sold', 'custom_order'));

DROP POLICY IF EXISTS "Products are readable by admins in any status" ON public.products;
CREATE POLICY "Products are readable by admins in any status" ON public.products
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Products can be created/deleted by owner/manager" ON public.products;
CREATE POLICY "Products can be created/deleted by owner/manager" ON public.products
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "Products can be updated by editors" ON public.products;
CREATE POLICY "Products can be updated by editors" ON public.products
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'manager', 'editor']));

-- 4.4 Product Media Policies
DROP POLICY IF EXISTS "Product media is readable by everyone if product is active" ON public.product_media;
CREATE POLICY "Product media is readable by everyone if product is active" ON public.product_media
  FOR SELECT USING (product_id IN (SELECT id FROM public.products WHERE status IN ('available', 'sold', 'custom_order')));

DROP POLICY IF EXISTS "Product media is readable by admins for all products" ON public.product_media;
CREATE POLICY "Product media is readable by admins for all products" ON public.product_media
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Product media can be modified by content managers/editors" ON public.product_media;
CREATE POLICY "Product media can be modified by content managers/editors" ON public.product_media
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager', 'editor']));

-- 4.5 Product Variants Policies
DROP POLICY IF EXISTS "Product variants are readable by everyone if product is active" ON public.product_variants;
CREATE POLICY "Product variants are readable by everyone if product is active" ON public.product_variants
  FOR SELECT USING (product_id IN (SELECT id FROM public.products WHERE status IN ('available', 'sold', 'custom_order')));

DROP POLICY IF EXISTS "Product variants are readable by admins for all products" ON public.product_variants;
CREATE POLICY "Product variants are readable by admins for all products" ON public.product_variants
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Product variants can be modified by owner/manager" ON public.product_variants;
CREATE POLICY "Product variants can be modified by owner/manager" ON public.product_variants
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager']));

-- 4.6 Custom Options Policies
DROP POLICY IF EXISTS "Custom options are readable by everyone if active" ON public.custom_options;
CREATE POLICY "Custom options are readable by everyone if active" ON public.custom_options
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Custom options are readable by admins" ON public.custom_options;
CREATE POLICY "Custom options are readable by admins" ON public.custom_options
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Custom options can be modified by owner/manager" ON public.custom_options;
CREATE POLICY "Custom options can be modified by owner/manager" ON public.custom_options
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager']));

-- 4.7 Offers Policies
DROP POLICY IF EXISTS "Offers are readable by everyone if active and valid" ON public.offers;
CREATE POLICY "Offers are readable by everyone if active and valid" ON public.offers
  FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

DROP POLICY IF EXISTS "Offers are readable by admins" ON public.offers;
CREATE POLICY "Offers are readable by admins" ON public.offers
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Offers can be modified by owner/manager" ON public.offers;
CREATE POLICY "Offers can be modified by owner/manager" ON public.offers
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager']));

-- 4.8 Offer Products & Categories Policies
DROP POLICY IF EXISTS "Offer scopes readable by everyone" ON public.offer_products;
CREATE POLICY "Offer scopes readable by everyone" ON public.offer_products
  FOR SELECT USING (offer_id IN (SELECT id FROM public.offers WHERE is_active = true));

DROP POLICY IF EXISTS "Offer scopes readable by admins" ON public.offer_products;
CREATE POLICY "Offer scopes readable by admins" ON public.offer_products
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Offer scopes modified by owner/manager" ON public.offer_products;
CREATE POLICY "Offer scopes modified by owner/manager" ON public.offer_products
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager']));

DROP POLICY IF EXISTS "Offer categories readable by everyone" ON public.offer_categories;
CREATE POLICY "Offer categories readable by everyone" ON public.offer_categories
  FOR SELECT USING (offer_id IN (SELECT id FROM public.offers WHERE is_active = true));

DROP POLICY IF EXISTS "Offer categories readable by admins" ON public.offer_categories;
CREATE POLICY "Offer categories readable by admins" ON public.offer_categories
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Offer categories modified by owner/manager" ON public.offer_categories;
CREATE POLICY "Offer categories modified by owner/manager" ON public.offer_categories
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager']));

-- 4.9 Site Settings Policies
DROP POLICY IF EXISTS "Site settings are readable by everyone if public" ON public.site_settings;
CREATE POLICY "Site settings are readable by everyone if public" ON public.site_settings
  FOR SELECT USING (key IN ('site_status', 'whatsapp_number', 'homepage_banner', 'active_theme', 'delivery_message', 'announcement_bar', 'payment_instructions', 'delivery_areas', 'faq'));

DROP POLICY IF EXISTS "Site settings are readable by admins" ON public.site_settings;
CREATE POLICY "Site settings are readable by admins" ON public.site_settings
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Site settings can be modified by admins based on permissions trigger" ON public.site_settings;
CREATE POLICY "Site settings can be modified by admins based on permissions trigger" ON public.site_settings
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager', 'editor']));

-- 4.10 Orders & Items Policies
DROP POLICY IF EXISTS "Orders cannot be read by public" ON public.orders;
CREATE POLICY "Orders cannot be read by public" ON public.orders
  FOR SELECT USING (false);

DROP POLICY IF EXISTS "Orders readable by authorized staff" ON public.orders;
CREATE POLICY "Orders readable by authorized staff" ON public.orders
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Orders insertable by anyone" ON public.orders;
CREATE POLICY "Orders insertable by anyone" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Orders updatable by staff" ON public.orders;
CREATE POLICY "Orders updatable by staff" ON public.orders
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'manager', 'order_staff']));

DROP POLICY IF EXISTS "Orders deletable by owner" ON public.orders;
CREATE POLICY "Orders deletable by owner" ON public.orders
  FOR DELETE USING (public.check_user_role(ARRAY['owner']));

DROP POLICY IF EXISTS "Order items readable by authorized staff" ON public.order_items;
CREATE POLICY "Order items readable by authorized staff" ON public.order_items
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Order items insertable by anyone" ON public.order_items;
CREATE POLICY "Order items insertable by anyone" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Order items updatable by staff" ON public.order_items;
CREATE POLICY "Order items updatable by staff" ON public.order_items
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'manager', 'order_staff']));

DROP POLICY IF EXISTS "Order items deletable by owner" ON public.order_items;
CREATE POLICY "Order items deletable by owner" ON public.order_items
  FOR DELETE USING (public.check_user_role(ARRAY['owner']));

-- 4.11 Custom Requests Policies
DROP POLICY IF EXISTS "Custom requests readable by staff" ON public.custom_requests;
CREATE POLICY "Custom requests readable by staff" ON public.custom_requests
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Custom requests insertable by anyone" ON public.custom_requests;
CREATE POLICY "Custom requests insertable by anyone" ON public.custom_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Custom requests updatable by staff" ON public.custom_requests;
CREATE POLICY "Custom requests updatable by staff" ON public.custom_requests
  FOR UPDATE USING (public.check_user_role(ARRAY['owner', 'manager', 'order_staff']));

DROP POLICY IF EXISTS "Custom requests deletable by owner" ON public.custom_requests;
CREATE POLICY "Custom requests deletable by owner" ON public.custom_requests
  FOR DELETE USING (public.check_user_role(ARRAY['owner']));

-- 4.12 Testimonials Policies
DROP POLICY IF EXISTS "Testimonials readable by everyone if visible" ON public.testimonials;
CREATE POLICY "Testimonials readable by everyone if visible" ON public.testimonials
  FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "Testimonials readable by admins" ON public.testimonials;
CREATE POLICY "Testimonials readable by admins" ON public.testimonials
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'manager', 'editor', 'order_staff', 'viewer']));

DROP POLICY IF EXISTS "Testimonials modified by content managers/editors" ON public.testimonials;
CREATE POLICY "Testimonials modified by content managers/editors" ON public.testimonials
  FOR ALL USING (public.check_user_role(ARRAY['owner', 'manager', 'editor']));

-- 4.13 Audit Logs Policies
DROP POLICY IF EXISTS "Audit logs readable by owner and viewer" ON public.audit_logs;
CREATE POLICY "Audit logs readable by owner and viewer" ON public.audit_logs
  FOR SELECT USING (public.check_user_role(ARRAY['owner', 'viewer']));
