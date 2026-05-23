'use client';

import { useState } from 'react';
import { Product, ProductMedia, Category } from '@/types/database.types';
import { ProductCard } from './ProductCard';

interface CatalogSectionProps {
  products: (Product & {
    media?: ProductMedia[];
    category?: { name: string } | null;
  })[];
  categories: Category[];
}

export function CatalogSection({ products, categories }: CatalogSectionProps) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter products by category and search term
  const filteredProducts = products.filter(product => {
    // 1. Category Filter
    const matchesCategory =
      selectedCategorySlug === 'all' ||
      product.category?.name.toLowerCase().replace(/\s+/g, '-') === selectedCategorySlug ||
      (categories.find(c => c.slug === selectedCategorySlug)?.id === product.category_id);

    // 2. Search Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      query === '' ||
      product.title.toLowerCase().includes(query) ||
      product.short_description?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.material?.toLowerCase().includes(query) ||
      product.color_theme?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="max-w-7xl w-full mx-auto px-4 py-16 sm:px-6 lg:px-8 font-sans" id="catalog-section">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-zinc-150 mb-3">
            Custom Catalog
          </h2>
          <p className="text-zinc-500 text-sm max-w-md">
            Click on any product to configure options like name engravings, sizing, LEDs, and materials before checkout.
          </p>
        </div>

        {/* Client Search Bar */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search keychains, nameplates..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl bg-zinc-900 border border-zinc-800 px-5 py-3.5 pl-12 text-sm text-zinc-100 placeholder-zinc-650 focus:border-brand-gold focus:outline-none"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="absolute left-4 top-4.5 w-4 h-4 text-zinc-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>
      </div>

      {/* Category Pills Bar (Horizontal scrollable) */}
      <div className="flex overflow-x-auto pb-4 mb-8 gap-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSelectedCategorySlug('all')}
          className={`px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
            selectedCategorySlug === 'all'
              ? 'bg-brand-gold text-zinc-950 shadow-md font-bold'
              : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
          }`}
        >
          All Artwork ({products.length})
        </button>
        {categories.map(cat => {
          const catProductCount = products.filter(p => p.category_id === cat.id).length;
          
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategorySlug(cat.slug)}
              className={`px-4.5 py-2.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all ${
                selectedCategorySlug === cat.slug
                  ? 'bg-brand-gold text-zinc-950 shadow-md font-bold'
                  : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.name} ({catProductCount})
            </button>
          );
        })}
      </div>

      {/* Catalog Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
            className="w-12 h-12 text-zinc-700 mx-auto mb-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h3 className="font-serif text-lg font-medium text-zinc-400 mb-1">No items found</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Try adjusting your search criteria or choose another category to discover our products.
          </p>
        </div>
      )}
    </section>
  );
}
