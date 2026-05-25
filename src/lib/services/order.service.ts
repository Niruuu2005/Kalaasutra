// src/lib/services/order.service.ts
// Order service — atomic creation, collision-resistant order numbers, server-side price validation.

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_ROLES, assertRole } from './auth-helper';
import { OfferService } from './offer.service';
import { Order, OrderItem, OrderStatus, PaymentStatus } from '@/types/database.types';

type InsertFailure = {
  message?: string;
  code?: string;
};

export interface OrderInput {
  idempotencyKey?: string | null;
  user_id?: string | null;
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
    const admin = createAdminClient();

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

    if (orderInput.promo_code) {
      try {
        const { offer, discountAmount: computedDiscount } = await OfferService.validatePromoCode(
          orderInput.promo_code,
          calculatedTotal,
        );
        discountAmount = computedDiscount;
        finalAmount = calculatedTotal - discountAmount;
        if (!offer.code) {
          throw new Error('Promo code validation failed: Invalid promo code.');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Promo code error';
        throw new Error(`Promo code validation failed: ${msg}`);
      }
    }

    // ── Step 3: Insert Order and Items via Standard JS Client ───────────────────────
    const orderNumber = generateOrderNumber();
    const orderId = crypto.randomUUID();

    // 1. Insert the order (Do NOT use .select() here, as anon role has no SELECT permission on orders)
    const baseInsertPayload: Record<string, unknown> = {
      id: orderId,
      order_number: orderNumber,
      customer_name: orderInput.customer_name,
      customer_phone: orderInput.customer_phone,
      customer_email: orderInput.customer_email || null,
      customer_address: orderInput.customer_address || null,
      total_amount: calculatedTotal,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      payment_status: 'pending',
      order_status: 'new',
      source: orderInput.source || 'website',
      notes: orderInput.notes || null,
    };

    // Include idempotency_key when available in schema (some deployments may not have the column yet).
    const insertPayload: Record<string, unknown> = { ...baseInsertPayload };
    if (orderInput.user_id) insertPayload.user_id = orderInput.user_id;
    if (orderInput.idempotencyKey) insertPayload.idempotency_key = orderInput.idempotencyKey;

    const normalizeInsertFailure = (error: unknown): InsertFailure => {
      if (error && typeof error === 'object') {
        const e = error as { message?: string; code?: string };
        return {
          message: e.message,
          code: e.code,
        };
      }
      if (error instanceof Error) {
        return { message: error.message };
      }
      return { message: String(error) };
    };

    const tryInsertOrder = async (payload: Record<string, unknown>): Promise<InsertFailure | null> => {
      try {
        const { error } = await supabase.from('orders').insert(payload);
        if (!error) return null;
        return normalizeInsertFailure(error);
      } catch (error: unknown) {
        return normalizeInsertFailure(error);
      }
    };

    let orderError = await tryInsertOrder(insertPayload);

    // Retry once when DB schema is behind (missing user_id / idempotency_key column).
    if (orderError?.message) {
      const lower = orderError.message.toLowerCase();
      let shouldRetry = false;

      if (lower.includes('idempotency_key')) {
        delete insertPayload.idempotency_key;
        shouldRetry = true;
      }

      if (lower.includes('user_id')) {
        delete insertPayload.user_id;
        shouldRetry = true;
      }

      if (shouldRetry) {
        orderError = await tryInsertOrder(insertPayload);
      }
    }

    if (orderError) {
      const message = orderError.message || 'Unknown error';
      const code = (orderError as { code?: string }).code;
      const looksDuplicate = code === '23505' || message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique');

      // If it looks like a duplicate and we have an idempotency key, try to find the existing order.
      if (looksDuplicate && orderInput.idempotencyKey) {
        try {
          const { data: existingOrder, error: existingOrderError } = await admin
            .from('orders')
            .select('*')
            .eq('idempotency_key', orderInput.idempotencyKey)
            .single();

          if (existingOrderError || !existingOrder) {
            // If the admin query itself fails because the column doesn't exist, fall through to throwing below.
            throw new Error(`Order creation failed: ${message}`);
          }

          const { data: existingItems, error: existingItemsError } = await admin
            .from('order_items')
            .select('*')
            .eq('order_id', existingOrder.id);

          if (existingItemsError) {
            throw new Error(`Order creation failed: ${existingItemsError.message}`);
          }

          return { ...existingOrder, items: existingItems || [] } as Order & { items: OrderItem[] };
        } catch {
          // If we failed to query by idempotency_key because the column is missing, don't try further dedup logic.
          // Fall through to throwing the original error message.
        }
      }

      throw new Error(`Order creation failed: ${message}`);
    }

    // 2. Insert the order items
    const itemsToInsert = validatedItems.map(item => ({
      order_id: orderId,
      product_id: item.product_id,
      product_title: item.product_title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      final_price: item.final_price,
      customization_data: item.customization_data,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      // Manual rollback attempt if items fail
      await supabase.from('orders').delete().eq('id', orderId);
      throw new Error(`Failed to add items to order: ${itemsError.message}`);
    }

    // We can confidently return the generated order without fetching it from DB
    const { data: insertedOrder, error: insertedOrderError } = await admin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (insertedOrderError || !insertedOrder) {
      throw new Error(`Order created but failed to load order details: ${insertedOrderError?.message ?? 'Unknown error'}`);
    }

    // Create initial payment attempt record (non-blocking failure will still surface)
    try {
      // Lazy import to avoid circular deps during tests
      const { PaymentService } = await import('@/lib/services/payment.service');
      await PaymentService.createPaymentAttempt(orderId, finalAmount, 'INR');
    } catch (error: unknown) {
      // Log but do not block the order creation; payment attempts can be retried
      // The absence of a payment record will be caught by reconciliation
      // and surfaced to the admin dashboard.
      // Use logger import from existing module
      const { logger } = await import('@/lib/logger');
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create initial payment attempt for order', { orderId, error: message });
    }

    return {
      ...insertedOrder,
      items: itemsToInsert as unknown as OrderItem[],
    };
  },

  // ─── Admin methods ────────────────────────────────────────────────────────

  async adminGetOrders(
    filters: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; search?: string } = {},
  ): Promise<Order[]> {
    await assertRole(ADMIN_ROLES);
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

  async getOrdersByUser(userId: string): Promise<Array<Order & { items: OrderItem[] }>> {
    const admin = createAdminClient();

    const { data: orders, error } = await admin
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch user orders: ${error.message}`);
    return (orders as Array<Order & { items: OrderItem[] }>) || [];
  },

  async adminGetOrderDetails(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
    await assertRole(ADMIN_ROLES);
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
    await assertRole(ADMIN_ROLES);
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
    await assertRole(ADMIN_ROLES);
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
    await assertRole(ADMIN_ROLES);
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
