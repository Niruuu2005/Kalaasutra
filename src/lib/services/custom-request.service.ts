// src/lib/services/custom-request.service.ts
// Custom requests service layer managing user commission requests and follow-ups

import { createClient as createServerClient } from '@/lib/supabase/server';
import { assertRole } from './auth-helper';
import { CustomRequest, CustomRequestStatus } from '@/types/database.types';

export interface CustomRequestInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  product_id?: string | null;
  request_type?: string | null; // e.g., 'pencil_sketch', 'color_portrait'
  description: string;
  reference_image_urls?: string[] | null;
  estimated_budget?: number | null;
}

export const CustomRequestService = {
  /**
   * Registers a new customer commission request/inquiry.
   * Public access permitted.
   */
  async createCustomRequest(input: CustomRequestInput): Promise<CustomRequest> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('custom_requests')
      .insert({
        customer_name: input.customer_name,
        customer_phone: input.customer_phone,
        customer_email: input.customer_email || null,
        product_id: input.product_id || null,
        request_type: input.request_type || null,
        description: input.description,
        reference_image_urls: input.reference_image_urls || null,
        estimated_budget: input.estimated_budget || null,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit custom request: ${error.message}`);
    }

    return data;
  },

  /**
   * Retrieves custom request inquiries.
   * Admin roles permitted.
   */
  async adminGetCustomRequests(status?: CustomRequestStatus): Promise<CustomRequest[]> {
    await assertRole(['owner', 'manager', 'order_staff', 'viewer']);
    const supabase = await createServerClient();

    let query = supabase.from('custom_requests').select('*').order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch custom requests: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Updates custom request status and logs administrative notes.
   * Admin roles (owner, manager, order_staff) permitted.
   */
  async adminUpdateCustomRequestStatus(id: string, status: CustomRequestStatus, adminNotes?: string): Promise<CustomRequest> {
    await assertRole(['owner', 'manager', 'order_staff']);
    const supabase = await createServerClient();

    const updatePayload: any = { status };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes;
    }

    const { data, error } = await supabase
      .from('custom_requests')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update custom request: ${error.message}`);
    }

    return data;
  },

  /**
   * Deletes a custom request inquiry.
   * Admin roles (owner) permitted.
   */
  async adminDeleteCustomRequest(id: string): Promise<void> {
    await assertRole(['owner']);
    const supabase = await createServerClient();

    const { error } = await supabase.from('custom_requests').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete custom request: ${error.message}`);
    }
  }
};
