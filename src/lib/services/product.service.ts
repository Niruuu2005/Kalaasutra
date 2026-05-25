// src/lib/services/product.service.ts
// Product service layer handling products catalog retrieval and mutations

import { createClient as createServerClient } from '@/lib/supabase/server';
import { ADMIN_ROLES, assertRole } from './auth-helper';
import { Product, ProductDetailExtended, ProductMedia, ProductVariant, CustomOption } from '@/types/database.types';

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'featured';
}

export const ProductService = {
  /**
   * Retrieves active products matching the filters.
   * Public/Anonymous access permitted.
   */
  async getProducts(filters: ProductFilters = {}): Promise<(Product & { category: { name: string; slug: string } | null; media: ProductMedia[] })[]> {
    const supabase = await createServerClient();
    
    // Select products and their category and media relationships
    let query = supabase
      .from('products')
      .select('*, category:categories(name, slug), media:product_media(*)')
      .in('status', ['available', 'sold', 'custom_order']); // Exclude drafts/hidden products for public view

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }

    if (filters.isCustomizable !== undefined) {
      query = query.eq('is_customizable', filters.isCustomizable);
    }

    if (filters.priceMin !== undefined) {
      query = query.gte('base_price', filters.priceMin);
    }

    if (filters.priceMax !== undefined) {
      query = query.lte('base_price', filters.priceMax);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sortBy) {
      if (filters.sortBy === 'price_asc') {
        query = query.order('base_price', { ascending: true });
      } else if (filters.sortBy === 'price_desc') {
        query = query.order('base_price', { ascending: false });
      } else if (filters.sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sortBy === 'featured') {
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
      }
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    return (data as any) || [];
  },

  /**
   * Retrieves full product detail by slug, including media, variants, and customization fields.
   * Public/Anonymous access permitted.
   */
  async getProductBySlug(slug: string): Promise<ProductDetailExtended | null> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(name, slug), media:product_media(*), variants:product_variants(*), custom_options:custom_options(*)')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch product details: ${error.message}`);
    }

    return data as ProductDetailExtended;
  },

  /**
   * Retrieves all products (including drafts and hidden ones) for administration tables.
   * Admin roles permitted.
   */
  async adminGetProducts(filters: ProductFilters = {}): Promise<(Product & { category: { name: string } | null })[]> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();
    
    let query = supabase
      .from('products')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false });

    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch admin products: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Creates a new product catalog entry with media, variants, and custom customization fields.
   * Admin roles (owner, manager) permitted.
   */
  async adminCreateProduct(
    product: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    media: Omit<ProductMedia, 'id' | 'product_id' | 'created_at'>[] = [],
    variants: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[] = [],
    customOptions: Omit<CustomOption, 'id' | 'product_id'>[] = []
  ): Promise<ProductDetailExtended> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();

    // 1. Insert product row
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (productError || !newProduct) {
      throw new Error(`Failed to create product row: ${productError?.message}`);
    }

    const productId = newProduct.id;

    // 2. Insert associated media
    if (media.length > 0) {
      const mediaToInsert = media.map(m => ({ ...m, product_id: productId }));
      const { error: mediaError } = await supabase.from('product_media').insert(mediaToInsert);
      if (mediaError) {
        throw new Error(`Failed to create product media: ${mediaError.message}`);
      }
    }

    // 3. Insert associated variants
    if (variants.length > 0) {
      const variantsToInsert = variants.map(v => ({ ...v, product_id: productId }));
      const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert);
      if (variantsError) {
        throw new Error(`Failed to create product variants: ${variantsError.message}`);
      }
    }

    // 4. Insert customization options
    if (customOptions.length > 0) {
      const optionsToInsert = customOptions.map(o => ({ ...o, product_id: productId }));
      const { error: optionsError } = await supabase.from('custom_options').insert(optionsToInsert);
      if (optionsError) {
        throw new Error(`Failed to create customization options: ${optionsError.message}`);
      }
    }

    // Fetch and return the fully populated object
    const fullProduct = await this.getProductBySlug(newProduct.slug);
    if (!fullProduct) {
      throw new Error('Product created, but failed to fetch complete product object.');
    }

    return fullProduct;
  },

  /**
   * Updates an existing product catalog entry and syncs its media, variants, and customization options.
   * Admin roles (owner, manager, editor) permitted (triggers restrict price updates if editor).
   */
  async adminUpdateProduct(
    id: string,
    product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
    media?: Omit<ProductMedia, 'id' | 'product_id' | 'created_at'>[],
    variants?: Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[],
    customOptions?: Omit<CustomOption, 'id' | 'product_id'>[]
  ): Promise<ProductDetailExtended> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();

    // 1. Update product row
    const { data: updatedProduct, error: productError } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (productError || !updatedProduct) {
      throw new Error(`Failed to update product row: ${productError?.message}`);
    }

    // Syncing relationships: Simple delete-and-insert model to replace existing ones
    // 2. Sync product media if provided
    if (media !== undefined) {
      await supabase.from('product_media').delete().eq('product_id', id);
      if (media.length > 0) {
        const mediaToInsert = media.map(m => ({ ...m, product_id: id }));
        const { error: mediaError } = await supabase.from('product_media').insert(mediaToInsert);
        if (mediaError) {
          throw new Error(`Failed to update product media: ${mediaError.message}`);
        }
      }
    }

    // 3. Sync product variants if provided
    if (variants !== undefined) {
      // NOTE: Editors are prevented from price adjustments via policy triggers, but assertRole checks it too
      await supabase.from('product_variants').delete().eq('product_id', id);
      if (variants.length > 0) {
        const variantsToInsert = variants.map(v => ({ ...v, product_id: id }));
        const { error: variantsError } = await supabase.from('product_variants').insert(variantsToInsert);
        if (variantsError) {
          throw new Error(`Failed to update product variants: ${variantsError.message}`);
        }
      }
    }

    // 4. Sync custom options if provided
    if (customOptions !== undefined) {
      await supabase.from('custom_options').delete().eq('product_id', id);
      if (customOptions.length > 0) {
        const optionsToInsert = customOptions.map(o => ({ ...o, product_id: id }));
        const { error: optionsError } = await supabase.from('custom_options').insert(optionsToInsert);
        if (optionsError) {
          throw new Error(`Failed to update customization options: ${optionsError.message}`);
        }
      }
    }

    const fullProduct = await this.getProductBySlug(updatedProduct.slug);
    if (!fullProduct) {
      throw new Error('Product updated, but failed to fetch complete product object.');
    }

    return fullProduct;
  },

  /**
   * Deletes a product catalog entry.
   * Admin roles (owner, manager) permitted.
   */
  async adminDeleteProduct(id: string): Promise<void> {
    await assertRole(ADMIN_ROLES);
    const supabase = await createServerClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
};
