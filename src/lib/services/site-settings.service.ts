// src/lib/services/site-settings.service.ts
// Site settings service layer managing website config, maintenance modes, and alerts

import { createClient as createServerClient } from '@/lib/supabase/server';
import { ADMIN_ROLES, assertRole } from './auth-helper';
import { SiteSetting } from '@/types/database.types';

export const SiteSettingsService = {
  /**
   * Retrieves public site configurations.
   * Public/Anonymous access permitted.
   */
  async getSettings(keys?: string[]): Promise<Record<string, any>> {
    const supabase = await createServerClient();
    let query = supabase.from('site_settings').select('key, value');

    // Only allow querying public settings keys to avoid exposing internal vars
    const publicKeys = [
      'site_status',
      'whatsapp_number',
      'homepage_banner',
      'active_theme',
      'delivery_message',
      'announcement_bar',
      'payment_instructions',
      'delivery_areas',
      'faq'
    ];

    if (keys && keys.length > 0) {
      const filteredKeys = keys.filter(k => publicKeys.includes(k));
      query = query.in('key', filteredKeys);
    } else {
      query = query.in('key', publicKeys);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch site settings: ${error.message}`);
    }

    const settingsRecord: Record<string, any> = {};
    data?.forEach(row => {
      settingsRecord[row.key] = row.value;
    });

    return settingsRecord;
  },

  /**
   * Retrieves all site settings records for administration tables.
   * Admin roles permitted.
   */
  async adminGetSettings(): Promise<SiteSetting[]> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch admin settings: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Updates or inserts a site setting record.
   * Trigger constraints enforce restrictions on key mutations based on user role.
   * Admin roles (owner, manager, editor) permitted.
   */
  async adminUpdateSetting(key: string, value: any): Promise<SiteSetting> {
    const { profile } = await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('site_settings')
      .upsert(
        {
          key,
          value,
          updated_by: profile.id
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update site setting ${key}: ${error.message}`);
    }

    return data;
  }
};
