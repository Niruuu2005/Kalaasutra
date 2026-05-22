// src/lib/validations/schemas.ts
// Zod schemas for input validation

import { z } from 'zod';

export const productStatusSchema = z.enum(['available', 'sold', 'custom_order', 'hidden', 'draft']);

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  short_description: z.string().max(300, 'Short description cannot exceed 300 characters').nullable().optional(),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid('Invalid Category ID').nullable().optional(),
  base_price: z.number().positive('Base price must be positive'),
  sale_price: z.number().nonnegative('Sale price must be non-negative').nullable().optional()
    .refine((val) => val === null || val === undefined || true, {
      message: 'Sale price validation logic will be checked against base price',
    }),
  currency: z.string().default('INR'),
  status: productStatusSchema.default('draft'),
  is_featured: z.boolean().default(false),
  is_customizable: z.boolean().default(false),
  estimated_delivery_days: z.number().int().positive().nullable().optional(),
  material: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  color_theme: z.string().nullable().optional(),
  seo_title: z.string().max(100).nullable().optional(),
  seo_description: z.string().max(200).nullable().optional(),
}).refine(
  (data) => {
    if (data.sale_price !== null && data.sale_price !== undefined) {
      return data.sale_price <= data.base_price;
    }
    return true;
  },
  {
    message: 'Sale price must be less than or equal to the base price',
    path: ['sale_price'],
  }
);

export const orderItemSchema = z.object({
  product_id: z.string().uuid('Invalid Product ID').nullable().optional(),
  product_title: z.string().min(1, 'Product title is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unit_price: z.number().nonnegative('Unit price must be non-negative'),
  final_price: z.number().nonnegative('Final price must be non-negative'),
  customization_data: z.any().nullable().optional(),
});

export const orderSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(100),
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  customer_email: z.string().email('Invalid email address').nullable().or(z.literal('')).optional(),
  customer_address: z.string().nullable().optional(),
  total_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().default(0),
  final_amount: z.number().nonnegative(),
  source: z.enum(['website', 'whatsapp', 'instagram', 'manual']).default('website'),
  notes: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
});

export const customRequestSchema = z.object({
  customer_name: z.string().min(1, 'Name is required').max(100),
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  customer_email: z.string().email('Invalid email address').nullable().or(z.literal('')).optional(),
  product_id: z.string().uuid('Invalid Product ID').nullable().optional(),
  request_type: z.string().nullable().optional(),
  description: z.string().min(5, 'Please provide a detailed description of your custom artwork request'),
  reference_image_urls: z.array(z.string().url('Invalid image URL')).nullable().optional(),
  estimated_budget: z.number().positive().nullable().optional(),
});

export const offerSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  code: z.string().regex(/^[A-Z0-9_-]+$/, 'Promo code must be uppercase alphanumeric').nullable().optional(),
  description: z.string().nullable().optional(),
  discount_type: z.enum(['percentage', 'fixed_amount', 'free_shipping', 'bundle']),
  discount_value: z.number().nonnegative('Discount value cannot be negative'),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().default(true),
  banner_image_url: z.string().nullable().optional(),
  applies_to: z.enum(['all_products', 'selected_products', 'selected_categories']).default('all_products'),
  minimum_order_value: z.number().nonnegative().default(0),
});
