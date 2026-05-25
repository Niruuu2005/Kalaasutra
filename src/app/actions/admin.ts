'use server';

// src/app/actions/admin.ts
// Server actions layer for Admin Dashboard portal, enforcing role checks

import { ProductService, ProductFilters } from '@/lib/services/product.service';
import { OrderService } from '@/lib/services/order.service';
import { CustomRequestService } from '@/lib/services/custom-request.service';
import { OfferService } from '@/lib/services/offer.service';
import { SiteSettingsService } from '@/lib/services/site-settings.service';
import { CategoryService } from '@/lib/services/category.service';
import { ADMIN_ROLES, assertRole } from '@/lib/services/auth-helper';
import { revalidatePath } from 'next/cache';
import {
  Product,
  ProductMedia,
  ProductVariant,
  CustomOption,
  OrderStatus,
  PaymentStatus,
  CustomRequestStatus,
  Offer,
  ProductDetailExtended
} from '@/types/database.types';

// Helper helper to wrap server operations in try/catch and audit/validation responses
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function executeAction<T>(
  action: () => Promise<T>
): Promise<ActionResponse<T>> {
  try {
    const data = await action();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}

// -------------------------------------------------------------------------
// 1. DASHBOARD METRICS ACTIONS
// -------------------------------------------------------------------------

export async function getDashboardMetricsAction() {
  return executeAction(async () => {
    return await OrderService.adminGetDashboardMetrics();
  });
}

// -------------------------------------------------------------------------
// 2. PRODUCT ACTIONS
// -------------------------------------------------------------------------

export async function adminGetProductsAction(filters: ProductFilters = {}) {
  return executeAction(async () => {
    return await ProductService.adminGetProducts(filters);
  });
}

export async function adminGetProductDetailsAction(id: string) {
  return executeAction(async () => {
    await assertRole(ADMIN_ROLES);
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name, slug), media:product_media(*), variants:product_variants(*), custom_options:custom_options(*)')
      .eq('id', id)
      .single();
    if (error) {
      throw new Error(`Failed to fetch product details: ${error.message}`);
    }
    return data as ProductDetailExtended;
  });
}

export async function adminCreateProductAction(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
  media: Omit<ProductMedia, 'id' | 'product_id' | 'created_at'>[] = [],
  variants: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[] = [],
  customOptions: Omit<CustomOption, 'id' | 'product_id'>[] = []
) {
  return executeAction(async () => {
    const result = await ProductService.adminCreateProduct(
      product,
      media,
      variants,
      customOptions
    );
    revalidatePath('/');
    revalidatePath(`/products/${product.slug}`);
    return result;
  });
}

export async function adminUpdateProductAction(
  id: string,
  product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
  media?: Omit<ProductMedia, 'id' | 'product_id' | 'created_at'>[],
  variants?: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[],
  customOptions?: Omit<CustomOption, 'id' | 'product_id'>[]
) {
  return executeAction(async () => {
    const result = await ProductService.adminUpdateProduct(
      id,
      product,
      media,
      variants,
      customOptions
    );
    revalidatePath('/');
    if (product.slug) {
      revalidatePath(`/products/${product.slug}`);
    }
    return result;
  });
}

export async function adminDeleteProductAction(id: string) {
  return executeAction(async () => {
    await ProductService.adminDeleteProduct(id);
    revalidatePath('/');
    return { success: true };
  });
}

// -------------------------------------------------------------------------
// 3. ORDER ACTIONS
// -------------------------------------------------------------------------

export async function adminGetOrdersAction(filters: {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
} = {}) {
  return executeAction(async () => {
    return await OrderService.adminGetOrders(filters);
  });
}

export async function adminGetOrderDetailsAction(id: string) {
  return executeAction(async () => {
    return await OrderService.adminGetOrderDetails(id);
  });
}

export async function adminUpdateOrderStatusAction(id: string, status: OrderStatus) {
  return executeAction(async () => {
    const result = await OrderService.adminUpdateOrderStatus(id, status);
    revalidatePath('/admin/dashboard');
    return result;
  });
}

export async function adminUpdatePaymentStatusAction(id: string, status: PaymentStatus) {
  return executeAction(async () => {
    const result = await OrderService.adminUpdatePaymentStatus(id, status);
    revalidatePath('/admin/dashboard');
    return result;
  });
}

// -------------------------------------------------------------------------
// 4. CUSTOM INQUIRIES ACTIONS
// -------------------------------------------------------------------------

export async function adminGetCustomRequestsAction(status?: CustomRequestStatus) {
  return executeAction(async () => {
    return await CustomRequestService.adminGetCustomRequests(status);
  });
}

export async function adminUpdateCustomRequestStatusAction(
  id: string,
  status: CustomRequestStatus,
  adminNotes?: string
) {
  return executeAction(async () => {
    const result = await CustomRequestService.adminUpdateCustomRequestStatus(
      id,
      status,
      adminNotes
    );
    revalidatePath('/admin/dashboard');
    return result;
  });
}

export async function adminDeleteCustomRequestAction(id: string) {
  return executeAction(async () => {
    await CustomRequestService.adminDeleteCustomRequest(id);
    revalidatePath('/admin/dashboard');
    return { success: true };
  });
}

// -------------------------------------------------------------------------
// 5. OFFERS ACTIONS
// -------------------------------------------------------------------------

export async function adminGetOffersAction() {
  return executeAction(async () => {
    return await OfferService.adminGetOffers();
  });
}

export async function adminCreateOfferAction(
  offer: Omit<Offer, 'id' | 'created_at' | 'updated_at'>
) {
  return executeAction(async () => {
    const result = await OfferService.adminCreateOffer(offer);
    revalidatePath('/');
    return result;
  });
}

export async function adminUpdateOfferAction(
  id: string,
  offer: Partial<Omit<Offer, 'id' | 'created_at' | 'updated_at'>>
) {
  return executeAction(async () => {
    const result = await OfferService.adminUpdateOffer(id, offer);
    revalidatePath('/');
    return result;
  });
}

export async function adminDeleteOfferAction(id: string) {
  return executeAction(async () => {
    await OfferService.adminDeleteOffer(id);
    revalidatePath('/');
    return { success: true };
  });
}

// -------------------------------------------------------------------------
// 6. SITE SETTINGS ACTIONS
// -------------------------------------------------------------------------

export async function adminGetSettingsAction() {
  return executeAction(async () => {
    return await SiteSettingsService.adminGetSettings();
  });
}

export async function adminUpdateSettingAction(key: string, value: any) {
  return executeAction(async () => {
    const result = await SiteSettingsService.adminUpdateSetting(key, value);
    revalidatePath('/');
    return result;
  });
}

// -------------------------------------------------------------------------
// 7. CURRENT USER ACTION (ROLE CHECK)
// -------------------------------------------------------------------------

export async function adminGetCurrentUserAction() {
  try {
    const { user, profile } = await assertRole(ADMIN_ROLES);
    return {
      success: true as const,
      data: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        role: profile.role,
        is_active: profile.is_active
      }
    };
  } catch (error: any) {
    return {
      success: false as const,
      error: error.message || 'Unauthorized access.'
    };
  }
}

// -------------------------------------------------------------------------
// 8. CATEGORY ACTIONS
// -------------------------------------------------------------------------

export async function adminGetCategoriesAction() {
  return executeAction(async () => {
    return await CategoryService.adminGetCategories();
  });
}

