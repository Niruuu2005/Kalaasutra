'use client';

// src/components/admin/ProductsTab.tsx
// Management console for products catalog, media, variants, and customization options

import React, { useState, useEffect } from 'react';
import {
  adminGetProductsAction,
  adminGetProductDetailsAction,
  adminCreateProductAction,
  adminUpdateProductAction,
  adminDeleteProductAction,
  adminGetCategoriesAction
} from '@/app/actions/admin';
import { StorageService } from '@/lib/services/storage.service';
import {
  Product,
  ProductDetailExtended,
  ProductMedia,
  ProductVariant,
  CustomOption,
  Category,
  UserRole,
  ProductStatus,
  MediaType,
  CustomOptionInputType
} from '@/types/database.types';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface ProductsTabProps {
  profile: ProfileData;
}

type TabType = 'basic' | 'pricing' | 'media' | 'variants' | 'customization';

export default function ProductsTab({ profile }: ProductsTabProps) {
  const [products, setProducts] = useState<(Product & { category: { name: string } | null })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeFormTab, setActiveFormTab] = useState<TabType>('basic');
  const [saving, setSaving] = useState(false);
  
  // Editing Product states
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [formProduct, setFormProduct] = useState<Partial<Product>>({
    title: '',
    slug: '',
    short_description: '',
    description: '',
    category_id: '',
    base_price: 0,
    sale_price: null,
    status: 'draft',
    is_featured: false,
    is_customizable: false,
    estimated_delivery_days: 7,
    material: '',
    size: '',
    color_theme: '',
    seo_title: '',
    seo_description: '',
    currency: 'INR'
  });
  
  const [formMedia, setFormMedia] = useState<Omit<ProductMedia, 'id' | 'product_id' | 'created_at'>[]>([]);
  const [formVariants, setFormVariants] = useState<Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>[]>([]);
  const [formCustomOptions, setFormCustomOptions] = useState<Omit<CustomOption, 'id' | 'product_id'>[]>([]);

  // Permissions helper checks
  const isOwnerOrManager = profile.role === 'owner' || profile.role === 'manager';
  const isEditor = profile.role === 'editor';
  const isReadOnly = profile.role === 'viewer' || profile.role === 'order_staff';

  const fetchProducts = async () => {
    setLoading(true);
    const filters: any = {};
    if (categoryFilter !== 'all') filters.categoryId = categoryFilter;
    if (search.trim() !== '') filters.search = search.trim();

    const result = await adminGetProductsAction(filters);
    if (result.success) {
      setProducts(result.data);
    } else {
      alert(`Failed to load products: ${result.error}`);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const result = await adminGetCategoriesAction();
    if (result.success) {
      setCategories(result.data);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  // Generate URL slug from title
  const generateSlug = () => {
    if (!formProduct.title) return;
    const slug = formProduct.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormProduct({ ...formProduct, slug });
  };

  const handleOpenCreateModal = () => {
    if (isReadOnly || isEditor) return; // Only owner/manager can create
    setModalMode('create');
    setSelectedProductId(null);
    setActiveFormTab('basic');
    setFormProduct({
      title: '',
      slug: '',
      short_description: '',
      description: '',
      category_id: categories[0]?.id || '',
      base_price: 0,
      sale_price: null,
      status: 'draft',
      is_featured: false,
      is_customizable: false,
      estimated_delivery_days: 7,
      material: '',
      size: '',
      color_theme: '',
      seo_title: '',
      seo_description: '',
      currency: 'INR'
    });
    setFormMedia([]);
    setFormVariants([]);
    setFormCustomOptions([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (id: string) => {
    setSelectedProductId(id);
    setModalMode('edit');
    setActiveFormTab('basic');
    setSaving(true);
    
    const result = await adminGetProductDetailsAction(id);
    if (result.success) {
      const p = result.data;
      setFormProduct({
        title: p.title,
        slug: p.slug,
        short_description: p.short_description,
        description: p.description,
        category_id: p.category_id || '',
        base_price: Number(p.base_price),
        sale_price: p.sale_price ? Number(p.sale_price) : null,
        status: p.status,
        is_featured: p.is_featured,
        is_customizable: p.is_customizable,
        estimated_delivery_days: p.estimated_delivery_days,
        material: p.material,
        size: p.size,
        color_theme: p.color_theme,
        seo_title: p.seo_title,
        seo_description: p.seo_description,
        currency: p.currency
      });
      // Set sub structures
      setFormMedia(p.media.map((m: ProductMedia) => ({
        media_url: m.media_url,
        media_type: m.media_type,
        alt_text: m.alt_text,
        display_order: m.display_order,
        is_primary: m.is_primary
      })));
      setFormVariants(p.variants.map((v: ProductVariant) => ({
        name: v.name,
        option_name: v.option_name,
        price_adjustment: Number(v.price_adjustment),
        is_active: v.is_active
      })));
      setFormCustomOptions(p.custom_options.map((o: CustomOption) => ({
        category_id: o.category_id,
        label: o.label,
        input_type: o.input_type,
        required: o.required,
        options: o.options,
        display_order: o.display_order,
        is_active: o.is_active
      })));
      setIsModalOpen(true);
    } else {
      alert(`Failed to load product details: ${result.error}`);
    }
    setSaving(false);
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!isOwnerOrManager) return;
    if (!confirm(`Are you sure you want to delete "${title}"? This action is permanent.`)) return;
    
    const result = await adminDeleteProductAction(id);
    if (result.success) {
      setProducts(products.filter(p => p.id !== id));
    } else {
      alert(`Failed to delete product: ${result.error}`);
    }
  };

  // Media List Helpers
  const addMediaItem = () => {
    setFormMedia([
      ...formMedia,
      {
        media_url: '',
        media_type: 'image',
        alt_text: '',
        display_order: formMedia.length,
        is_primary: formMedia.length === 0
      }
    ]);
  };

  const updateMediaItem = (index: number, fields: Partial<Omit<ProductMedia, 'id' | 'product_id' | 'created_at'>>) => {
    const updated = [...formMedia];
    
    // If setting primary, unset others
    if (fields.is_primary) {
      updated.forEach((item, idx) => {
        item.is_primary = idx === index;
      });
    } else {
      updated[index] = { ...updated[index], ...fields };
    }
    
    setFormMedia(updated);
  };

  const removeMediaItem = (index: number) => {
    const itemToRemove = formMedia[index];
    let updated = formMedia.filter((_, idx) => idx !== index);
    
    // Re-assign primary if we deleted the primary one
    if (itemToRemove.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    setFormMedia(updated);
  };

  // Variants Helpers
  const addVariantItem = () => {
    setFormVariants([
      ...formVariants,
      {
        name: 'Size',
        option_name: '',
        price_adjustment: 0,
        is_active: true
      }
    ]);
  };

  const updateVariantItem = (index: number, fields: Partial<Omit<ProductVariant, 'id' | 'product_id' | 'created_at'>>) => {
    const updated = [...formVariants];
    updated[index] = { ...updated[index], ...fields };
    setFormVariants(updated);
  };

  const removeVariantItem = (index: number) => {
    setFormVariants(formVariants.filter((_, idx) => idx !== index));
  };

  // Custom Options Helpers
  const addCustomOptionItem = () => {
    setFormCustomOptions([
      ...formCustomOptions,
      {
        category_id: null,
        label: '',
        input_type: 'text',
        required: false,
        options: null,
        display_order: formCustomOptions.length,
        is_active: true
      }
    ]);
  };

  const updateCustomOptionItem = (index: number, fields: Partial<Omit<CustomOption, 'id' | 'product_id'>>) => {
    const updated = [...formCustomOptions];
    updated[index] = { ...updated[index], ...fields };
    setFormCustomOptions(updated);
  };

  const removeCustomOptionItem = (index: number) => {
    setFormCustomOptions(formCustomOptions.filter((_, idx) => idx !== index));
  };

  // Form Submit Action Handler
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSaving(true);

    // Validate prices
    const basePrice = Number(formProduct.base_price);
    const salePrice = formProduct.sale_price !== null ? Number(formProduct.sale_price) : null;
    
    if (salePrice !== null && salePrice > basePrice) {
      alert('Sale price cannot exceed the base price.');
      setSaving(false);
      return;
    }

    if (modalMode === 'create') {
      const result = await adminCreateProductAction(
        formProduct as Omit<Product, 'id' | 'created_at' | 'updated_at'>,
        formMedia,
        formVariants,
        formCustomOptions
      );
      if (result.success) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert(`Failed to create product: ${result.error}`);
      }
    } else {
      if (!selectedProductId) return;
      
      // Filter out prices updates if Editor (editor trigger blocks updates)
      const submitProduct = { ...formProduct };
      if (isEditor) {
        delete submitProduct.base_price;
        delete submitProduct.sale_price;
      }

      const result = await adminUpdateProductAction(
        selectedProductId,
        submitProduct as Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>,
        formMedia,
        isOwnerOrManager ? formVariants : undefined,
        isOwnerOrManager ? formCustomOptions : undefined
      );
      if (result.success) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert(`Failed to update product: ${result.error}`);
      }
    }
    setSaving(false);
  };

  const getStatusBadge = (status: ProductStatus) => {
    const styles: Record<ProductStatus, string> = {
      available: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      sold: 'bg-red-500/10 border-red-500/30 text-red-400',
      custom_order: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      hidden: 'bg-zinc-800 border-zinc-700 text-zinc-500',
      draft: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
    };
    return (
      <span className={`px-2 py-1 text-[10px] font-bold tracking-wide uppercase rounded-md border ${styles[status]}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-amber-100">Artwork Catalog</h2>
          <p className="text-xs text-zinc-400 mt-1">Manage Shubham Art paintings, customized nameplates, sketches, and pricing.</p>
        </div>
        {isOwnerOrManager && (
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-bold text-zinc-950 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Add New Artwork
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900 p-4 border border-zinc-850 rounded-2xl">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            placeholder="Search catalog by title, slug, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none pr-10"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </form>

      {/* Products list grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-zinc-400 font-sans">Fetching catalog data...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 text-sm">
          No artwork matches current filters. Click "Add New Artwork" to populate the database catalog.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-medium text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Product Details</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Price Point</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Attributes</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-850/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-200">{p.title}</div>
                      <div className="text-xs text-zinc-500 font-mono mt-0.5">{p.slug}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-300">
                      {p.category?.name || <span className="text-zinc-600 italic">None</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {p.sale_price ? (
                          <>
                            <span className="font-sans font-bold text-amber-300">₹{Number(p.sale_price).toLocaleString('en-IN')}</span>
                            <span className="font-sans text-xs text-zinc-500 line-through">₹{Number(p.base_price).toLocaleString('en-IN')}</span>
                          </>
                        ) : (
                          <span className="font-sans font-semibold text-zinc-300">₹{Number(p.base_price).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(p.status as ProductStatus)}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5">
                        {p.is_featured && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md">
                            Featured
                          </span>
                        )}
                        {p.is_customizable && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                            Customizable
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(p.id)}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 text-xs font-semibold text-amber-400 rounded-lg cursor-pointer transition-all"
                      >
                        Edit
                      </button>
                      {isOwnerOrManager && (
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.title)}
                          className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-red-900/40 hover:bg-zinc-900 text-xs font-semibold text-red-400 rounded-lg cursor-pointer transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Title */}
            <div className="flex items-center justify-between p-6 bg-zinc-950 border-b border-zinc-850">
              <div>
                <h3 className="text-lg font-serif text-amber-200">
                  {modalMode === 'create' ? 'Add Product to Catalog' : 'Edit Product Entry'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Define core details, variants pricing adjustments, media links, and customization options</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg cursor-pointer outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Inner Form Tabs Selector */}
            <div className="flex border-b border-zinc-850 bg-zinc-950/60 px-4 overflow-x-auto">
              {(['basic', 'pricing', 'media', 'variants', 'customization'] as const).map((tab) => {
                const isActive = activeFormTab === tab;
                const labels: Record<TabType, string> = {
                  basic: 'Basic Info',
                  pricing: 'Pricing & SEO',
                  media: 'Media Gallery',
                  variants: 'Price Variants',
                  customization: 'Custom Controls'
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFormTab(tab)}
                    className={`px-4 py-3 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveProduct} className="flex-grow overflow-y-auto p-6 space-y-6">
              {/* Tab 1: Basic Info */}
              {activeFormTab === 'basic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Artwork Title *</label>
                    <input
                      type="text"
                      required
                      disabled={isReadOnly}
                      value={formProduct.title}
                      onChange={(e) => setFormProduct({ ...formProduct, title: e.target.value })}
                      placeholder="e.g. Handmade Shree Ganesha Acrylic Canvas Painting"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">URL Slug *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        disabled={isReadOnly}
                        value={formProduct.slug}
                        onChange={(e) => setFormProduct({ ...formProduct, slug: e.target.value })}
                        placeholder="e.g. shree-ganesha-acrylic-canvas"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={generateSlug}
                        disabled={isReadOnly}
                        className="px-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-semibold text-zinc-400 cursor-pointer"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Category *</label>
                    <select
                      disabled={isReadOnly}
                      value={formProduct.category_id || ''}
                      onChange={(e) => setFormProduct({ ...formProduct, category_id: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none"
                    >
                      <option value="">No Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Listing Status</label>
                    <select
                      disabled={isReadOnly}
                      value={formProduct.status}
                      onChange={(e) => setFormProduct({ ...formProduct, status: e.target.value as ProductStatus })}
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none"
                    >
                      <option value="draft">Draft (Invisible)</option>
                      <option value="available">Available</option>
                      <option value="sold">Sold Out</option>
                      <option value="custom_order">Custom Order Only</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-6 mt-4 sm:col-span-1">
                    <label className="flex items-center gap-2.5 text-sm text-zinc-300 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={formProduct.is_featured}
                        onChange={(e) => setFormProduct({ ...formProduct, is_featured: e.target.checked })}
                        className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                      Feature on Home Screen
                    </label>
                    <label className="flex items-center gap-2.5 text-sm text-zinc-300 font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={formProduct.is_customizable}
                        onChange={(e) => setFormProduct({ ...formProduct, is_customizable: e.target.checked })}
                        className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                      Supports Custom Engraving
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Short Card Description (1-2 sentences)</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={formProduct.short_description || ''}
                      onChange={(e) => setFormProduct({ ...formProduct, short_description: e.target.value })}
                      placeholder="e.g. Spiritual abstract painting in vibrant metallic colors, perfect for pooja rooms."
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Detailed Description</label>
                    <textarea
                      disabled={isReadOnly}
                      rows={4}
                      value={formProduct.description || ''}
                      onChange={(e) => setFormProduct({ ...formProduct, description: e.target.value })}
                      placeholder="Write details about the artwork, creation technique, frame composition..."
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none resize-none font-sans"
                    />
                  </div>

                  <div className="border-t border-zinc-850 pt-5 sm:col-span-2">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-4">Artwork Dimensions & Material Metadata</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Material Composition</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={formProduct.material || ''}
                          onChange={(e) => setFormProduct({ ...formProduct, material: e.target.value })}
                          placeholder="e.g. Acrylic Canvas"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Base Dimensions</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={formProduct.size || ''}
                          onChange={(e) => setFormProduct({ ...formProduct, size: e.target.value })}
                          placeholder="e.g. 12 x 12 inches"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Color Palette</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={formProduct.color_theme || ''}
                          onChange={(e) => setFormProduct({ ...formProduct, color_theme: e.target.value })}
                          placeholder="e.g. Gold & Charcoal"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Est. Delivery (Days)</label>
                        <input
                          type="number"
                          disabled={isReadOnly}
                          value={formProduct.estimated_delivery_days || ''}
                          onChange={(e) => setFormProduct({ ...formProduct, estimated_delivery_days: e.target.value ? Number(e.target.value) : null })}
                          placeholder="e.g. 7"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Pricing & SEO */}
              {activeFormTab === 'pricing' && (
                <div className="space-y-6">
                  {isEditor && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-lg">
                      <strong>Role Alert:</strong> Pricing metadata configurations are locked for Editors. Updates made here will not submit.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Base Catalog Price (INR) *</label>
                      <input
                        type="number"
                        required
                        disabled={isReadOnly || isEditor}
                        value={formProduct.base_price}
                        onChange={(e) => setFormProduct({ ...formProduct, base_price: Number(e.target.value) })}
                        placeholder="e.g. 2499"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Discount Offer Price (INR, optional)</label>
                      <input
                        type="number"
                        disabled={isReadOnly || isEditor}
                        value={formProduct.sale_price === null ? '' : formProduct.sale_price}
                        onChange={(e) => setFormProduct({ ...formProduct, sale_price: e.target.value ? Number(e.target.value) : null })}
                        placeholder="e.g. 1999"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-850 pt-5 space-y-4">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Search Engine Optimization (SEO)</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Custom SEO Title</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={formProduct.seo_title || ''}
                          onChange={(e) => setFormProduct({ ...formProduct, seo_title: e.target.value })}
                          placeholder="e.g. Buy Ganesha Canvas Art Online | Shubham Art"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Custom SEO Description</label>
                        <textarea
                          disabled={isReadOnly}
                          rows={3}
                          value={formProduct.seo_description || ''}
                          onChange={(e) => setFormProduct({ ...formProduct, seo_description: e.target.value })}
                          placeholder="Short metadata preview description for google search card results..."
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none resize-none font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Media Gallery */}
              {activeFormTab === 'media' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Media Files ({formMedia.length})</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addMediaItem}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      >
                        + Add Image / Video URL
                      </button>
                    )}
                  </div>

                  {formMedia.length === 0 ? (
                    <div className="bg-zinc-950/40 border border-zinc-850 p-8 rounded-xl text-center text-xs text-zinc-500 italic">
                      No media links mapped. Create image entries to show artwork cards in the public storefront gallery.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formMedia.map((mediaItem, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl relative group">
                          {/* Thumbnail preview */}
                          <div className="sm:col-span-2 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden h-16 w-full">
                            {mediaItem.media_url ? (
                              mediaItem.media_type === 'image' ? (
                                <img src={mediaItem.media_url} alt="preview" className="object-cover w-full h-full" onError={(e) => { (e.target as any).src = 'https://placehold.co/100x100?text=Preview+Error'; }} />
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )
                            ) : (
                              <span className="text-[10px] text-zinc-600 italic">No URL</span>
                            )}
                          </div>

                          <div className="sm:col-span-5 space-y-2">
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/webp, image/gif"
                              disabled={isReadOnly}
                              onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                  try {
                                    const file = e.target.files[0];
                                    const url = await StorageService.uploadFile('product-media', file, 'products/');
                                    updateMediaItem(index, { media_url: url, media_type: 'image' });
                                  } catch (error) {
                                    alert('Failed to upload image. Max size is 5MB.');
                                  }
                                }
                              }}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700"
                            />
                            <input
                              type="text"
                              required
                              disabled={isReadOnly}
                              placeholder="Or paste Image / Video file URL link directly"
                              value={mediaItem.media_url}
                              onChange={(e) => updateMediaItem(index, { media_url: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                            <input
                              type="text"
                              disabled={isReadOnly}
                              placeholder="Alt descriptive text"
                              value={mediaItem.alt_text || ''}
                              onChange={(e) => updateMediaItem(index, { alt_text: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4 grid grid-cols-2 gap-2 self-center">
                            <div>
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Type</label>
                              <select
                                disabled={isReadOnly}
                                value={mediaItem.media_type}
                                onChange={(e) => updateMediaItem(index, { media_type: e.target.value as MediaType })}
                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-zinc-300 outline-none"
                              >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Order</label>
                              <input
                                type="number"
                                disabled={isReadOnly}
                                value={mediaItem.display_order}
                                onChange={(e) => updateMediaItem(index, { display_order: Number(e.target.value) })}
                                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-zinc-200 outline-none"
                              />
                            </div>
                            <div className="col-span-2 mt-1">
                              <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  disabled={isReadOnly}
                                  checked={mediaItem.is_primary}
                                  onChange={(e) => updateMediaItem(index, { is_primary: e.target.checked })}
                                  className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                                />
                                Primary display thumbnail
                              </label>
                            </div>
                          </div>

                          <div className="sm:col-span-1 self-center text-right">
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => removeMediaItem(index)}
                                className="p-1 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded-lg cursor-pointer outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Variants */}
              {activeFormTab === 'variants' && (
                <div className="space-y-4">
                  {!isOwnerOrManager && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-lg">
                      <strong>Role Alert:</strong> Price variant edits require Owner or Manager capabilities. Inputs are locked for content editors.
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Product Variants ({formVariants.length})</span>
                    {isOwnerOrManager && (
                      <button
                        type="button"
                        onClick={addVariantItem}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      >
                        + Add Custom Variant Adjustment
                      </button>
                    )}
                  </div>

                  {formVariants.length === 0 ? (
                    <div className="bg-zinc-950/40 border border-zinc-850 p-8 rounded-xl text-center text-xs text-zinc-500 italic">
                      No variants defined. Add options like 'Frame Finish' or 'Size Canvas A3' mapping price adjustments.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formVariants.map((variant, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl relative group">
                          <div className="sm:col-span-3">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Variant Name</label>
                            <input
                              type="text"
                              required
                              disabled={!isOwnerOrManager}
                              placeholder="e.g. Size, Frame"
                              value={variant.name}
                              onChange={(e) => updateVariantItem(index, { name: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Option Name Value</label>
                            <input
                              type="text"
                              required
                              disabled={!isOwnerOrManager}
                              placeholder="e.g. A3 Canvas, Matte Black Frame"
                              value={variant.option_name}
                              onChange={(e) => updateVariantItem(index, { option_name: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Price Adjust (INR, +/-)</label>
                            <input
                              type="number"
                              disabled={!isOwnerOrManager}
                              placeholder="e.g. +500 or -200"
                              value={variant.price_adjustment}
                              onChange={(e) => updateVariantItem(index, { price_adjustment: Number(e.target.value) })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1 self-center mt-4">
                            <label className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                disabled={!isOwnerOrManager}
                                checked={variant.is_active}
                                onChange={(e) => updateVariantItem(index, { is_active: e.target.checked })}
                                className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                              />
                              Active
                            </label>
                          </div>

                          <div className="sm:col-span-1 self-center text-right mt-4 sm:mt-0">
                            {isOwnerOrManager && (
                              <button
                                type="button"
                                onClick={() => removeVariantItem(index)}
                                className="p-1 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded-lg cursor-pointer outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Customization */}
              {activeFormTab === 'customization' && (
                <div className="space-y-4">
                  {!isOwnerOrManager && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-lg">
                      <strong>Role Alert:</strong> Configuration of custom options schema requires Owner or Manager capabilities. Inputs are locked for content editors.
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Custom Input Fields ({formCustomOptions.length})</span>
                    {isOwnerOrManager && (
                      <button
                        type="button"
                        onClick={addCustomOptionItem}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg cursor-pointer transition-all"
                      >
                        + Add Form Custom Field
                      </button>
                    )}
                  </div>

                  {formCustomOptions.length === 0 ? (
                    <div className="bg-zinc-950/40 border border-zinc-850 p-8 rounded-xl text-center text-xs text-zinc-500 italic">
                      No custom fields defined. Add options like text boxes for names, file uploads for custom references, or checkboxes for features.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formCustomOptions.map((opt, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-zinc-950 p-4 border border-zinc-850 rounded-xl relative group">
                          <div className="sm:col-span-3">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Field Label Name</label>
                            <input
                              type="text"
                              required
                              disabled={!isOwnerOrManager}
                              placeholder="e.g. Engraving Name, LED Light?"
                              value={opt.label}
                              onChange={(e) => updateCustomOptionItem(index, { label: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Input Field Type</label>
                            <select
                              disabled={!isOwnerOrManager}
                              value={opt.input_type}
                              onChange={(e) => updateCustomOptionItem(index, { input_type: e.target.value as CustomOptionInputType })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-zinc-300 outline-none"
                            >
                              <option value="text">Single Text Box</option>
                              <option value="checkbox">Checkbox (Yes/No)</option>
                              <option value="dropdown">Dropdown Options</option>
                              <option value="color">Color Selector</option>
                              <option value="size">Size Selector</option>
                              <option value="image_upload">Customer File Upload</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Dropdown options (Comma separated)</label>
                            <input
                              type="text"
                              disabled={!isOwnerOrManager || opt.input_type !== 'dropdown'}
                              placeholder="e.g. Black Frame, Gold Frame"
                              value={Array.isArray(opt.options) ? opt.options.join(', ') : (opt.options || '')}
                              onChange={(e) => updateCustomOptionItem(index, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-1.5 text-xs text-zinc-200 outline-none disabled:opacity-40"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="block text-[8px] font-bold text-zinc-500 uppercase mb-1">Order</label>
                            <input
                              type="number"
                              disabled={!isOwnerOrManager}
                              value={opt.display_order}
                              onChange={(e) => updateCustomOptionItem(index, { display_order: Number(e.target.value) })}
                              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-2 py-1.5 text-xs text-zinc-200 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2 flex flex-row gap-4 self-center mt-3 sm:mt-0 pl-2">
                            <label className="flex items-center gap-1 text-xs text-zinc-400 font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                disabled={!isOwnerOrManager}
                                checked={opt.required}
                                onChange={(e) => updateCustomOptionItem(index, { required: e.target.checked })}
                                className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                              />
                              Req.
                            </label>
                            <label className="flex items-center gap-1 text-xs text-zinc-400 font-semibold cursor-pointer select-none">
                              <input
                                type="checkbox"
                                disabled={!isOwnerOrManager}
                                checked={opt.is_active}
                                onChange={(e) => updateCustomOptionItem(index, { is_active: e.target.checked })}
                                className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                              />
                              Act.
                            </label>
                          </div>

                          <div className="sm:col-span-1 self-center text-right mt-4 sm:mt-0">
                            {isOwnerOrManager && (
                              <button
                                type="button"
                                onClick={() => removeCustomOptionItem(index)}
                                className="p-1 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-transparent hover:border-red-900/30 rounded-lg cursor-pointer outline-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-bold text-zinc-950 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
