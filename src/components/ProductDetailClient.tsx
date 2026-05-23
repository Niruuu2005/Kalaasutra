'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProductDetailExtended } from '@/types/database.types';
import { ConfiguratorForm } from './ConfiguratorForm';
import { CartStore } from '@/lib/cart';

interface ProductDetailClientProps {
  product: ProductDetailExtended;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Sort media to place primary first
  const sortedMedia = [...product.media].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  });

  const formatUrl = (url?: string) => {
    if (!url) return '/placeholder.jpg';
    return url.startsWith('http') || url.startsWith('/') ? url : `/${url}`;
  };

  const [activeImage, setActiveImage] = useState(
    formatUrl(sortedMedia[0]?.media_url)
  );

  const [quantity, setQuantity] = useState(1);
  const [config, setConfig] = useState<{
    selectedVariants: any[];
    customizationData: Record<string, string>;
    priceAdjustment: number;
  }>({
    selectedVariants: [],
    customizationData: {},
    priceAdjustment: 0
  });

  const baseProductPrice = Number(product.sale_price !== null ? product.sale_price : product.base_price);
  const currentUnitPrice = baseProductPrice + config.priceAdjustment;
  const totalPrice = currentUnitPrice * quantity;

  const handleConfigChange = (updatedConfig: any) => {
    setConfig(updatedConfig);
  };

  const handleAddToCart = () => {
    // Validate required options before adding
    const missingFields: string[] = [];
    product.custom_options.forEach(opt => {
      if (opt.is_active && opt.required) {
        const val = config.customizationData[opt.label];
        if (!val || val.trim() === '') {
          missingFields.push(opt.label);
        }
      }
    });

    if (missingFields.length > 0) {
      alert(`Please fill in the following personalization details: ${missingFields.join(', ')}`);
      return;
    }

    const itemToAdd = {
      productId: product.id,
      title: product.title,
      imageUrl: formatUrl(sortedMedia[0]?.media_url),
      basePrice: product.base_price,
      salePrice: product.sale_price,
      price: currentUnitPrice,
      quantity: quantity,
      selectedVariants: config.selectedVariants.map(v => ({
        name: v.name,
        option_name: v.option_name,
        price_adjustment: v.price_adjustment
      })),
      customizationData: config.customizationData
    };

    CartStore.addToCart(itemToAdd);
    
    // Toggle cart drawer open
    window.dispatchEvent(new CustomEvent('kalaasutra_toggle_cart'));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 font-sans select-none text-zinc-350">
      
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-500 hover:text-brand-gold transition-colors duration-150 mb-10 uppercase tracking-widest"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        <span>Back to Store</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Images Grid/Carousel (col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-850 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />

            {/* Live Preview Overlay */}
            {product.custom_options?.filter(opt => opt.input_type === 'text').map(opt => {
              const textValue = config.customizationData[opt.label];
              if (!textValue) return null;
              return (
                <div key={opt.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <span className="text-4xl md:text-5xl font-serif text-brand-gold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] bg-zinc-950/40 px-6 py-3 rounded-2xl backdrop-blur-sm transform -rotate-3 transition-all duration-300">
                    {textValue}
                  </span>
                </div>
              );
            })}
          </div>

          {sortedMedia.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {sortedMedia.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => setActiveImage(formatUrl(m.media_url))}
                  className={`aspect-square w-full rounded-xl overflow-hidden border bg-zinc-950 transition-all ${
                    activeImage === formatUrl(m.media_url)
                      ? 'border-brand-gold ring-1 ring-brand-gold shadow-md'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formatUrl(m.media_url)}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details & Form (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            
            {/* Badges / Category */}
            <div className="space-y-2">
              {product.category && (
                <span className="text-xs font-bold text-brand-gold uppercase tracking-widest block">
                  {product.category.name}
                </span>
              )}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Price section */}
            <div className="flex items-baseline space-x-3 py-3 border-y border-zinc-900">
              <span className="text-3xl font-bold text-brand-gold font-sans">
                ₹{currentUnitPrice}
              </span>
              {product.sale_price !== null && (
                <span className="text-sm text-zinc-550 line-through font-sans">
                  ₹{product.base_price + config.priceAdjustment}
                </span>
              )}
              {config.priceAdjustment !== 0 && (
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                  (Includes variant adjustment)
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-sm leading-relaxed text-zinc-400 font-light">
                {product.short_description}
              </p>
            )}

            {/* Dynamic Configurator Form */}
            <ConfiguratorForm
              variants={product.variants}
              customOptions={product.custom_options}
              onChange={handleConfigChange}
            />

            {/* Product description content */}
            {product.description && (
              <div className="border-t border-zinc-900 pt-6 space-y-2.5">
                <h4 className="font-serif text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  Product Details
                </h4>
                <p className="text-xs leading-relaxed text-zinc-500 max-w-lg font-light whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Tech specifications grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-6 border-t border-zinc-900 text-xs">
              {product.material && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900/60">
                  <span className="text-zinc-500">Material</span>
                  <span className="font-semibold text-zinc-300">{product.material}</span>
                </div>
              )}
              {product.size && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900/60">
                  <span className="text-zinc-500">Size</span>
                  <span className="font-semibold text-zinc-300">{product.size}</span>
                </div>
              )}
              {product.color_theme && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900/60">
                  <span className="text-zinc-500">Color/Finish</span>
                  <span className="font-semibold text-zinc-300">{product.color_theme}</span>
                </div>
              )}
              {product.estimated_delivery_days && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900/60">
                  <span className="text-zinc-500">Delivery Lead</span>
                  <span className="font-semibold text-zinc-300">{product.estimated_delivery_days} days</span>
                </div>
              )}
            </div>

          </div>

          {/* Add to Cart checkout control bar */}
          <div className="pt-6 border-t border-zinc-900 flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start gap-4 bg-zinc-950/30 p-4 rounded-2xl border border-zinc-850">
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Total Price</span>
              <span className="text-2xl font-bold text-zinc-150 font-sans">₹{totalPrice}</span>
            </div>

            <div className="flex items-center space-x-2 border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="px-3 py-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                -
              </button>
              <span className="text-sm font-semibold text-zinc-300 w-6 text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-3 py-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.status === 'sold'}
              className="w-full sm:flex-grow flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-brand-gold text-zinc-950 font-bold hover:bg-brand-gold-light hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-brand-gold/10 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4.5 h-4.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              <span className="text-xs uppercase tracking-wider">
                {product.status === 'sold' ? 'Sold Out' : 'Configure & Add'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
