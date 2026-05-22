'use client';

import { useState, useEffect } from 'react';
import { ProductVariant, CustomOption } from '@/types/database.types';

interface ConfiguratorFormProps {
  variants: ProductVariant[];
  customOptions: CustomOption[];
  onChange: (data: {
    selectedVariants: ProductVariant[];
    customizationData: Record<string, string>;
    priceAdjustment: number;
  }) => void;
}

export function ConfiguratorForm({ variants, customOptions, onChange }: ConfiguratorFormProps) {
  // Group variants by name (e.g., "Size", "Frame Finish")
  const variantGroups = variants.reduce((acc, current) => {
    if (!current.is_active) return acc;
    if (!acc[current.name]) {
      acc[current.name] = [];
    }
    acc[current.name].push(current);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  // Initialize selected variants with the first option of each group
  const [selectedVariants, setSelectedVariants] = useState<Record<string, ProductVariant>>({});
  // Initialize custom inputs state
  const [customizationData, setCustomizationData] = useState<Record<string, string>>({});

  useEffect(() => {
    // Set default selections for variant groups
    const defaults: Record<string, ProductVariant> = {};
    Object.entries(variantGroups).forEach(([groupName, options]) => {
      // Find the option with 0 price adjustment, or the first option
      const defaultOpt = options.find(o => o.price_adjustment === 0) || options[0];
      if (defaultOpt) {
        defaults[groupName] = defaultOpt;
      }
    });
    setSelectedVariants(defaults);

    // Initialize custom options default text
    const defaultCustoms: Record<string, string> = {};
    customOptions.forEach(opt => {
      if (opt.is_active) {
        defaultCustoms[opt.label] = opt.options && opt.options.length > 0 ? opt.options[0] : '';
      }
    });
    setCustomizationData(defaultCustoms);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, customOptions]);

  // Handle updates and trigger onChange
  useEffect(() => {
    const activeVariants = Object.values(selectedVariants);
    const priceAdjustment = activeVariants.reduce((sum, v) => sum + v.price_adjustment, 0);

    onChange({
      selectedVariants: activeVariants,
      customizationData,
      priceAdjustment
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariants, customizationData]);

  const handleVariantSelect = (groupName: string, option: ProductVariant) => {
    setSelectedVariants(prev => ({
      ...prev,
      [groupName]: option
    }));
  };

  const handleCustomOptionChange = (label: string, value: string) => {
    setCustomizationData(prev => ({
      ...prev,
      [label]: value
    }));
  };

  return (
    <div className="space-y-6 text-zinc-300 font-sans">
      {/* 1. Sizing / Sizing Variants */}
      {Object.entries(variantGroups).map(([groupName, options]) => (
        <div key={groupName} className="space-y-3">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Select {groupName}
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {options.map(option => {
              const isSelected = selectedVariants[groupName]?.id === option.id;
              const adj = option.price_adjustment;
              const adjText = adj === 0 ? '' : adj > 0 ? ` (+₹${adj})` : ` (-₹${Math.abs(adj)})`;
              
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleVariantSelect(groupName, option)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/5 text-brand-gold shadow-sm font-semibold'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-sm">{option.option_name}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{adjText || 'Base price'}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 2. Custom Configurator Fields (Dynamic options from database) */}
      {customOptions.filter(opt => opt.is_active).length > 0 && (
        <div className="border-t border-zinc-850 pt-6 space-y-6">
          <h4 className="font-serif text-base font-medium text-zinc-200 mb-4">
            Personalize Your Art
          </h4>
          
          {customOptions
            .filter(opt => opt.is_active)
            .map(opt => {
              const value = customizationData[opt.label] || '';
              
              return (
                <div key={opt.id} className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      {opt.label} {opt.required && <span className="text-brand-gold">*</span>}
                    </label>
                    {opt.input_type === 'text' && (
                      <span className="text-[10px] text-zinc-500">
                        {value.length} chars
                      </span>
                    )}
                  </div>

                  {/* Render based on field input type */}
                  {opt.input_type === 'dropdown' && opt.options && (
                    <select
                      value={value}
                      onChange={e => handleCustomOptionChange(opt.label, e.target.value)}
                      required={opt.required}
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    >
                      {opt.options.map(o => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  )}

                  {opt.input_type === 'text' && (
                    <input
                      type="text"
                      value={value}
                      onChange={e => handleCustomOptionChange(opt.label, e.target.value)}
                      placeholder={`Enter custom details...`}
                      required={opt.required}
                      maxLength={100}
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    />
                  )}

                  {opt.input_type === 'color' && opt.options && (
                    <div className="flex flex-wrap gap-2.5">
                      {opt.options.map(colorName => {
                        const isSelected = value === colorName;
                        // Map standard color words to visual colors
                        const colorMap: Record<string, string> = {
                          'Warm White': 'bg-orange-100 text-zinc-950',
                          'Cool White': 'bg-slate-50 text-zinc-950',
                          'Blue': 'bg-blue-600 text-white',
                          'Golden': 'bg-amber-400 text-zinc-950',
                          'Red': 'bg-red-600 text-white',
                          'Pink': 'bg-pink-500 text-white',
                          'Green': 'bg-emerald-600 text-white',
                          'Multi-Color': 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white',
                          'Stainless Steel': 'bg-zinc-300 text-zinc-950',
                          'Rose Gold': 'bg-orange-300 text-zinc-950',
                          'Gold': 'bg-yellow-500 text-zinc-950',
                          'Silver': 'bg-zinc-400 text-zinc-950',
                          'Black': 'bg-zinc-800 text-white border border-zinc-700'
                        };
                        
                        const colorClass = colorMap[colorName] || 'bg-zinc-700 text-white';
                        
                        return (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => handleCustomOptionChange(opt.label, colorName)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${colorClass} ${
                              isSelected
                                ? 'ring-2 ring-brand-gold ring-offset-2 ring-offset-zinc-950 scale-105 font-bold shadow-md'
                                : 'opacity-60 hover:opacity-100'
                            }`}
                          >
                            {colorName}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {opt.input_type === 'checkbox' && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={opt.id}
                        checked={value === 'true'}
                        onChange={e => handleCustomOptionChange(opt.label, e.target.checked ? 'true' : 'false')}
                        className="h-4.5 w-4.5 rounded border-zinc-850 bg-zinc-900 text-brand-gold focus:ring-brand-gold"
                      />
                      <label htmlFor={opt.id} className="ml-2.5 text-sm text-zinc-400 hover:text-zinc-300 cursor-pointer">
                        Apply {opt.label} option
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
