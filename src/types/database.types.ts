// src/types/database.types.ts
// TypeScript interfaces matching the database schema

export type UserRole = 'owner' | 'manager' | 'editor' | 'order_staff' | 'viewer';

export interface Profile {
  id: string; // references auth.users
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductStatus = 'available' | 'sold' | 'custom_order' | 'hidden' | 'draft';

export interface Product {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  base_price: number;
  sale_price: number | null;
  currency: string;
  status: ProductStatus;
  is_featured: boolean;
  is_customizable: boolean;
  estimated_delivery_days: number | null;
  material: string | null;
  size: string | null;
  color_theme: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type MediaType = 'image' | 'video';

export interface ProductMedia {
  id: string;
  product_id: string;
  media_url: string;
  media_type: MediaType;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string; // e.g., 'Size', 'Frame'
  option_name: string; // e.g., 'A4', 'Black Frame'
  price_adjustment: number;
  is_active: boolean;
  created_at: string;
}

export type CustomOptionInputType = 'text' | 'image_upload' | 'color' | 'size' | 'dropdown' | 'checkbox';

export interface CustomOption {
  id: string;
  product_id: string | null;
  category_id: string | null;
  label: string;
  input_type: CustomOptionInputType;
  required: boolean;
  options: string[] | null; // For dropdown
  display_order: number;
  is_active: boolean;
}

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'bundle';
export type AppliesToScope = 'all_products' | 'selected_products' | 'selected_categories';

export interface Offer {
  id: string;
  title: string;
  code: string | null;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  banner_image_url: string | null;
  applies_to: AppliesToScope;
  minimum_order_value: number;
  created_at: string;
  updated_at: string;
}

export interface OfferProduct {
  id: string;
  offer_id: string;
  product_id: string;
}

export interface OfferCategory {
  id: string;
  offer_id: string;
  category_id: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: any; // JSONB
  updated_by: string | null;
  updated_at: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'new' | 'confirmed' | 'in_progress' | 'ready' | 'shipped' | 'delivered' | 'cancelled';
export type OrderSource = 'website' | 'whatsapp' | 'instagram' | 'manual';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  source: OrderSource;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  quantity: number;
  unit_price: number;
  final_price: number;
  customization_data: any | null; // JSONB
  created_at: string;
}

export type CustomRequestStatus = 'new' | 'contacted' | 'quoted' | 'accepted' | 'rejected' | 'completed';

export interface CustomRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  product_id: string | null;
  request_type: string | null;
  description: string | null;
  reference_image_urls: string[] | null;
  estimated_budget: number | null;
  status: CustomRequestStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  message: string;
  rating: number;
  image_url: string | null;
  source: string;
  is_visible: boolean;
  display_order: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: any | null;
  new_value: any | null;
  created_at: string;
}

// Composite type for full product details
export interface ProductDetailExtended extends Product {
  category: { name: string; slug: string } | null;
  media: ProductMedia[];
  variants: ProductVariant[];
  custom_options: CustomOption[];
}
