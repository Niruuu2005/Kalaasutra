// src/lib/services/category.service.ts
// Category service layer isolating DB interactions from pages

import { createClient as createServerClient } from '@/lib/supabase/server';
import { ADMIN_ROLES, assertRole } from './auth-helper';
import { Category } from '@/types/database.types';

export const CategoryService = {
  /**
   * Retrieves all active categories sorted by display order.
   * Public/Anonymous access permitted.
   */
  async getCategories(): Promise<Category[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Retrieves all categories including inactive ones for administrative management.
   * Admin roles (owner, manager, editor, order_staff, viewer) permitted.
   */
  async adminGetCategories(): Promise<Category[]> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch admin categories: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Creates a new category.
   * Admin roles (owner, manager, editor) permitted.
   */
  async adminCreateCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return data;
  },

  /**
   * Updates an existing category.
   * Admin roles (owner, manager, editor) permitted.
   */
  async adminUpdateCategory(id: string, category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Promise<Category> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update category: ${error.message}`);
    }

    return data;
  }
};
