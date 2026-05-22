// src/lib/services/offer.service.ts
// Offer and discount service layer managing campaigns, coupon validations, and admin tools

import { createClient as createServerClient } from '@/lib/supabase/server';
import { assertRole } from './auth-helper';
import { Offer } from '@/types/database.types';

export const OfferService = {
  /**
   * Retrieves currently active promotions.
   * Public/Anonymous access permitted.
   */
  async getActiveOffers(): Promise<Offer[]> {
    const supabase = await createServerClient();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`);

    if (error) {
      throw new Error(`Failed to fetch active offers: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Validates a promotional discount code and computes the discount amount.
   * Public/Anonymous access permitted.
   */
  async validatePromoCode(code: string, orderValue: number): Promise<{ offer: Offer; discountAmount: number }> {
    const supabase = await createServerClient();
    const now = new Date().toISOString();

    const { data: offer, error } = await supabase
      .from('offers')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .maybeSingle();

    if (error) {
      throw new Error(`Error validation: ${error.message}`);
    }

    if (!offer) {
      throw new Error('Invalid or expired coupon code.');
    }

    if (orderValue < offer.minimum_order_value) {
      throw new Error(`Coupon code requires a minimum purchase of ₹${offer.minimum_order_value}.`);
    }

    let discountAmount = 0;
    if (offer.discount_type === 'percentage') {
      discountAmount = Math.round((offer.discount_value / 100) * orderValue * 100) / 100;
    } else if (offer.discount_type === 'fixed_amount') {
      discountAmount = Number(offer.discount_value);
    }

    // Guard to ensure discount doesn't exceed order value
    if (discountAmount > orderValue) {
      discountAmount = orderValue;
    }

    return { offer, discountAmount };
  },

  /**
   * Retrieves all offers records for administration tables.
   * Admin roles permitted.
   */
  async adminGetOffers(): Promise<Offer[]> {
    await assertRole(['owner', 'manager', 'editor', 'order_staff', 'viewer']);
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch admin offers: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Creates a new offer campaign.
   * Admin roles (owner, manager) permitted.
   */
  async adminCreateOffer(offer: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer> {
    await assertRole(['owner', 'manager']);
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('offers')
      .insert(offer)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create offer: ${error.message}`);
    }

    return data;
  },

  /**
   * Updates an existing offer campaign.
   * Admin roles (owner, manager) permitted.
   */
  async adminUpdateOffer(id: string, offer: Partial<Omit<Offer, 'id' | 'created_at' | 'updated_at'>>): Promise<Offer> {
    await assertRole(['owner', 'manager']);
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('offers')
      .update(offer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update offer: ${error.message}`);
    }

    return data;
  },

  /**
   * Deletes an offer campaign.
   * Admin roles (owner, manager) permitted.
   */
  async adminDeleteOffer(id: string): Promise<void> {
    await assertRole(['owner', 'manager']);
    const supabase = await createServerClient();
    
    const { error } = await supabase.from('offers').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete offer: ${error.message}`);
    }
  }
};
