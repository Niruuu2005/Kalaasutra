'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Product, ProductMedia } from '@/types/database.types';

interface ProductCardProps {
  product: Product & {
    media?: ProductMedia[];
    category?: { name: string } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);

  // Determine media URLs
  const primaryMedia = product.media?.find(m => m.is_primary) || product.media?.[0];
  const secondaryMedia = product.media?.find(m => !m.is_primary) || product.media?.[1] || primaryMedia;

  const formatUrl = (url?: string) => {
    if (!url) return '/placeholder.jpg';
    return url.startsWith('http') || url.startsWith('/') ? url : `/${url}`;
  };

  const currentImageUrl = hovered && secondaryMedia ? formatUrl(secondaryMedia.media_url) : formatUrl(primaryMedia?.media_url);

  // Compute status labels
  const isCustomizable = product.is_customizable;
  const showSaleBadge = product.sale_price !== null && product.sale_price < product.base_price;
  const isSoldOut = product.status === 'sold';

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-card-dark border border-zinc-800/60 transition-all duration-300 hover:border-brand-gold/30 hover:shadow-xl hover:shadow-brand-gold/[0.02]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Product Image Showcase */}
      <div className="relative aspect-square w-full overflow-hidden bg-bg-dark">
        <Link href={`/products/${product.slug}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt={product.title}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Status badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {showSaleBadge && !isSoldOut && (
            <span className="inline-flex items-center rounded-md bg-red-950/80 px-2.5 py-1 text-xs font-semibold text-red-200 border border-red-800/40 backdrop-blur-sm">
              Sale Offer
            </span>
          )}
          {isCustomizable && !isSoldOut && (
            <span className="inline-flex items-center rounded-md bg-brand-gold/90 px-2.5 py-1 text-xs font-bold text-zinc-950 shadow-sm">
              Customizable
            </span>
          )}
          {isSoldOut && (
            <span className="inline-flex items-center rounded-md bg-bg-dark/95 px-2.5 py-1 text-xs font-semibold text-zinc-400 border border-zinc-800">
              Sold Out
            </span>
          )}
          {product.status === 'custom_order' && !isSoldOut && (
            <span className="inline-flex items-center rounded-md bg-blue-950/80 px-2.5 py-1 text-xs font-semibold text-blue-200 border border-blue-800/40 backdrop-blur-sm">
              Commission Only
            </span>
          )}
        </div>
      </div>

      {/* Product Summary Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          {/* Category Subtext */}
          {product.category && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
              {product.category.name}
            </p>
          )}
          
          {/* Title */}
          <h3 className="font-serif text-lg font-semibold leading-snug text-zinc-100 group-hover:text-brand-gold transition-colors duration-200 mb-2">
            <Link href={`/products/${product.slug}`}>
              <span aria-hidden="true" className="absolute inset-0 z-0" />
              {product.title}
            </Link>
          </h3>

          {/* Attributes tags if any */}
          <div className="flex flex-wrap gap-1 mb-4 text-[10px] text-zinc-400">
            {product.material && (
              <span className="bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-800">
                {product.material}
              </span>
            )}
            {product.size && (
              <span className="bg-zinc-800/40 px-2 py-0.5 rounded border border-zinc-800">
                {product.size}
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-zinc-800/60 z-10 relative">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
              Starting from
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              {showSaleBadge ? (
                <>
                  <span className="text-lg font-bold text-brand-gold font-sans">
                    ₹{product.sale_price}
                  </span>
                  <span className="text-xs text-zinc-500 line-through font-sans">
                    ₹{product.base_price}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-zinc-200 font-sans">
                  ₹{product.base_price}
                </span>
              )}
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="flex items-center justify-center p-2 rounded-xl bg-zinc-800 hover:bg-brand-gold text-zinc-300 hover:text-zinc-950 transition-all duration-200"
            aria-label={`Customize ${product.title}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
