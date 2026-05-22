// src/lib/services/order.service.ts
// Order service — atomic creation, collision-resistant order numbers, server-side price validation.

import { createClient as createServerClient } from '@/lib/supabase/server';
import { assertRole } from './auth-helper';
import { OfferService } from './offer.service';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types/database.types';

export interface OrderInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address?: string | null;
  notes?: string | null;
  promo_code?: string | null;
  source?: 'website' | 'whatsapp' | 'instagram' | 'manual';
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
  customization_data?: Record<string, unknown> | null;
}

// ─── Order Number Generation ──────────────────────────────────────────────────
/**
 * Generates a human-readable, collision-resistant order number.
 * Format: SA-YYYYMM-XXXXXX (X = last 6 chars of a crypto UUID)
 * The UNIQUE constraint in the DB provides the final collision guard.
 * crypto.randomUUID() uses CSPRNG — no Math.random().
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  // Take last 6 characters of a UUID (hex-safe, no hyphens) — 16^6 = 16.7M combinations
  const uniqueSuffix = crypto.randomUUID().replace(/-/g, '').slice(-6).toUpperCase();
  return `SA-${year}${month}-${uniqueSuffix}`;
}

export const OrderService = {
  /** @deprecated Use generateOrderNumber() standalone export instead */
  generateOrderNumber,

  /**
   * Submits a new customer order using an atomic Supabase RPC transaction.
   * - Server-side price validation: client-supplied prices are NEVER trusted.
   * - Promo code validated server-side.
   * - Order + items created atomically (all-or-nothing transaction in the DB).
   */
  async createOrder(
    orderInput: OrderInput,
    itemsInput: OrderItemInput[],
  ): Promise<Order & { items: OrderItem[] }> {
    const supabase = await createServerClient();

    if (!itemsInput || itemsInput.length === 0) {
      throw new Error('Order must contain at least one item.');
    }

    // ── Step 1: Server-side price validation ──────────────────────────────────
    let calculatedTotal = 0;
    const validatedItems: Array<{
      product_id: string;
      product_title: string;
      quantity: number;
      unit_price: number;
      final_price: number;
      customization_data: Record<string, unknown> | null;
    }> = [];

    for (const item of itemsInput) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, title, base_price, sale_price, status')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        throw new Error(`Product not found or unavailable for ID: ${item.product_id}`);
      }

      if (product.status === 'draft' || product.status === 'hidden') {
        throw new Error(`Product "${product.title}" is currently not available.`);
      }

      let unitPrice = Number(product.sale_price !== null ? product.sale_price : product.base_price);

      // Add variant price adjustments (never trust client-sent prices)
      if (item.customization_data && typeof item.customization_data === 'object') {
        const selectedVariantIds: string[] = [];
        const cd = item.customization_data as Record<string, unknown>;
        if (typeof cd.size_variant_id === 'string') selectedVariantIds.push(cd.size_variant_id);
        if (typeof cd.frame_variant_id === 'string') selectedVariantIds.push(cd.frame_variant_id);

        for (const variantId of selectedVariantIds) {
          const { data: variant } = await supabase
            .from('product_variants')
            .select('price_adjustment, is_active')
            .eq('id', variantId)
            .eq('product_id', item.product_id)
            .single();

          if (variant?.is_active) {
            unitPrice += Number(variant.price_adjustment);
          }
        }
      }

      const finalPrice = unitPrice * item.quantity;
      calculatedTotal += finalPrice;
      validatedItems.push({
        product_id: product.id,
        product_title: product.title,
        quantity: item.quantity,
        unit_price: unitPrice,
        final_price: finalPrice,
        customization_data: (item.customization_data as Record<string, unknown>) ?? null,
      });
    }

    // ── Step 2: Promo code validation (server-side) ───────────────────────────
    let discountAmount = 0;
    let finalAmount = calculatedTotal;
    let promoCodeApplied: string | null = null;

    if (orderInput.promo_code) {
      try {
        const { offer, discountAmount: computedDiscount } = await OfferService.validatePromoCode(
          orderInput.promo_code,
          calculatedTotal,
        );
        discountAmount = computedDiscount;
        finalAmount = calculatedTotal - discountAmount;
        promoCodeApplied = offer.code;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Promo code error';
        throw new Error(`Promo code validation failed: ${msg}`);
      }
    }

    // ── Step 3: Atomic order creation via Supabase RPC ───────────────────────
    // The RPC function creates order + order_items in a single DB transaction.
    // If items insert fails, the order is also rolled back automatically.
    const orderNumber = generateOrderNumber();

    const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order_atomic', {
      p_order_number: orderNumber,
      p_customer_name: orderInput.customer_name,
      p_customer_phone: orderInput.customer_phone,
      p_customer_email: orderInput.customer_email || null,
      p_customer_address: orderInput.customer_address || null,
      p_total_amount: calculatedTotal,
      p_discount_amount: discountAmount,
      p_final_amount: finalAmount,
      p_source: orderInput.source || 'website',
      p_notes: orderInput.notes || null,
      p_items: validatedItems,
    });

    if (rpcError) {
      // Handle UNIQUE violation on order_number (extremely rare with UUID suffix)
      if (rpcError.code === '23505') {
        // Retry once with a new order number
        const retryOrderNumber = generateOrderNumber();
        const { data: retryResult, error: retryError } = await supabase.rpc('create_order_atomic', {
          p_order_number: retryOrderNumber,
          p_customer_name: orderInput.customer_name,
          p_customer_phone: orderInput.customer_phone,
          p_customer_email: orderInput.customer_email || null,
          p_customer_address: orderInput.customer_address || null,
          p_total_amount: calculatedTotal,
          p_discount_amount: discountAmount,
          p_final_amount: finalAmount,
          p_source: orderInput.source || 'website',
          p_notes: orderInput.notes || null,
          p_items: validatedItems,
        });
        if (retryError || !retryResult) {
          throw new Error('Failed to create order after retry. Please try again.');
        }
        return retryResult as Order & { items: OrderItem[] };
      }
      throw new Error(`Order creation failed: ${rpcError.message}`);
    }

    if (!rpcResult) {
      throw new Error('Order creation returned no result. Please try again.');
    }

    return rpcResult as Order & { items: OrderItem[] };
  },

  // ─── Admin methods ────────────────────────────────────────────────────────

  async adminGetOrders(
    filters: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; search?: string } = {},
  ): Promise<Order[]> {
    await assertRole(['owner', 'manager', 'order_staff', 'viewer']);
    const supabase = await createServerClient();

    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (filters.orderStatus) query = query.eq('order_status', filters.orderStatus);
    if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch orders: ${error.message}`);
    return data || [];
  },

  async adminGetOrderDetails(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
    await assertRole(['owner', 'manager', 'order_staff', 'viewer']);
    const supabase = await createServerClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) throw new Error(`Failed to fetch order items: ${itemsError.message}`);

    return { ...order, items: items || [] };
  },

  async adminUpdateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    await assertRole(['owner', 'manager', 'order_staff']);
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update order status: ${error.message}`);
    return data;
  },

  async adminUpdatePaymentStatus(id: string, status: PaymentStatus): Promise<Order> {
    await assertRole(['owner', 'manager', 'order_staff']);
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update payment status: ${error.message}`);
    return data;
  },

  async adminGetDashboardMetrics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    ordersThisMonth: number;
    revenueThisMonth: number;
    pendingPaymentsCount: number;
    newCustomRequestsCount: number;
    activeOffersCount: number;
  }> {
    await assertRole(['owner', 'manager', 'order_staff', 'viewer']);
    const supabase = await createServerClient();

    const now = new Date().toISOString();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Parallelize all 6 queries
    const [
      { count: totalProducts, error: pErr1 },
      { count: activeProducts, error: pErr2 },
      { count: activeOffers, error: oErr },
      { count: newCustomRequests, error: crErr },
      { count: pendingPayments, error: payErr },
      { data: monthOrders, error: moErr },
    ] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .in('status', ['available', 'sold', 'custom_order']),
      supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`),
      supabase.from('custom_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'pending'),
      supabase
        .from('orders')
        .select('final_amount, payment_status')
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    if (pErr1 || pErr2 || oErr || crErr || payErr || moErr) {
      throw new Error('Failed to calculate metrics.');
    }

    const revenueThisMonth = (monthOrders ?? []).reduce(
      (sum, order) => sum + (order.payment_status === 'paid' ? Number(order.final_amount) : 0),
      0,
    );

    return {
      totalProducts: totalProducts ?? 0,
      activeProducts: activeProducts ?? 0,
      ordersThisMonth: monthOrders?.length ?? 0,
      revenueThisMonth,
      pendingPaymentsCount: pendingPayments ?? 0,
      newCustomRequestsCount: newCustomRequests ?? 0,
      activeOffersCount: activeOffers ?? 0,
    };
  },
};
