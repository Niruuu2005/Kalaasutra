// src/lib/services/test-compilation.ts
// Static compilation check to ensure all services compile and have correct TypeScript type signatures

import { CategoryService } from './category.service';
import { ProductService } from './product.service';
import { SiteSettingsService } from './site-settings.service';
import { OfferService } from './offer.service';
import { OrderService } from './order.service';
import { CustomRequestService } from './custom-request.service';

export function checkTypeSignatures() {
  // Assert existence of public methods
  const catFn: Function = CategoryService.getCategories;
  const prodFn: Function = ProductService.getProducts;
  const settingsFn: Function = SiteSettingsService.getSettings;
  const offerFn: Function = OfferService.getActiveOffers;
  const orderFn: Function = OrderService.createOrder;
  const customReqFn: Function = CustomRequestService.createCustomRequest;

  // Assert existence of admin methods
  const adminCatFn: Function = CategoryService.adminGetCategories;
  const adminProdFn: Function = ProductService.adminGetProducts;
  const adminSettingsFn: Function = SiteSettingsService.adminGetSettings;
  const adminOfferFn: Function = OfferService.adminGetOffers;
  const adminOrderFn: Function = OrderService.adminGetOrders;
  const adminCustomReqFn: Function = CustomRequestService.adminGetCustomRequests;
  const adminMetricsFn: Function = OrderService.adminGetDashboardMetrics;

  return {
    publicServices: {
      getCategories: typeof catFn === 'function',
      getProducts: typeof prodFn === 'function',
      getSettings: typeof settingsFn === 'function',
      getActiveOffers: typeof offerFn === 'function',
      createOrder: typeof orderFn === 'function',
      createCustomRequest: typeof customReqFn === 'function',
    },
    adminServices: {
      adminGetCategories: typeof adminCatFn === 'function',
      adminGetProducts: typeof adminProdFn === 'function',
      adminGetSettings: typeof adminSettingsFn === 'function',
      adminGetOffers: typeof adminOfferFn === 'function',
      adminGetOrders: typeof adminOrderFn === 'function',
      adminGetCustomRequests: typeof adminCustomReqFn === 'function',
      adminGetDashboardMetrics: typeof adminMetricsFn === 'function',
    }
  };
}
