'use client';

// src/components/admin/OffersTab.tsx
// Management console for configure promotional coupons and active banners

import React, { useState, useEffect } from 'react';
import {
  adminGetOffersAction,
  adminCreateOfferAction,
  adminUpdateOfferAction,
  adminDeleteOfferAction
} from '@/app/actions/admin';
import { Offer, UserRole, DiscountType, AppliesToScope } from '@/types/database.types';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface OffersTabProps {
  profile: ProfileData;
}

export default function OffersTab({ profile }: OffersTabProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formOffer, setFormOffer] = useState<Partial<Offer>>({
    title: '',
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_order_value: 0,
    starts_at: null,
    ends_at: null,
    is_active: true,
    applies_to: 'all_products',
    banner_image_url: ''
  });

  const isOwnerOrManager = profile.role === 'owner' || profile.role === 'manager';
  const isReadOnly = !isOwnerOrManager; // Editors, staff, viewers have read-only access to offers

  const fetchOffers = async () => {
    setLoading(true);
    const result = await adminGetOffersAction();
    if (result.success) {
      setOffers(result.data);
    } else {
      alert(`Failed to load offers: ${result.error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenCreateModal = () => {
    if (isReadOnly) return;
    setModalMode('create');
    setSelectedOfferId(null);
    setFormOffer({
      title: '',
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      minimum_order_value: 0,
      starts_at: '',
      ends_at: '',
      is_active: true,
      applies_to: 'all_products',
      banner_image_url: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: Offer) => {
    setModalMode('edit');
    setSelectedOfferId(offer.id);
    
    // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
    const formatForInput = (isoString: string | null) => {
      if (!isoString) return '';
      try {
        const d = new Date(isoString);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      } catch {
        return '';
      }
    };

    setFormOffer({
      title: offer.title,
      code: offer.code || '',
      description: offer.description || '',
      discount_type: offer.discount_type,
      discount_value: Number(offer.discount_value),
      minimum_order_value: Number(offer.minimum_order_value),
      starts_at: formatForInput(offer.starts_at),
      ends_at: formatForInput(offer.ends_at),
      is_active: offer.is_active,
      applies_to: offer.applies_to,
      banner_image_url: offer.banner_image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteOffer = async (id: string, title: string) => {
    if (isReadOnly) return;
    if (!confirm(`Are you sure you want to delete the offer "${title}"?`)) return;

    const result = await adminDeleteOfferAction(id);
    if (result.success) {
      setOffers(offers.filter(o => o.id !== id));
    } else {
      alert(`Failed to delete offer: ${result.error}`);
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setSaving(true);

    const payload = {
      ...formOffer,
      code: formOffer.code ? formOffer.code.toUpperCase().trim() : null,
      starts_at: formOffer.starts_at ? new Date(formOffer.starts_at as string).toISOString() : null,
      ends_at: formOffer.ends_at ? new Date(formOffer.ends_at as string).toISOString() : null,
      discount_value: Number(formOffer.discount_value),
      minimum_order_value: Number(formOffer.minimum_order_value)
    };

    if (modalMode === 'create') {
      const result = await adminCreateOfferAction(payload as Omit<Offer, 'id' | 'created_at' | 'updated_at'>);
      if (result.success) {
        setIsModalOpen(false);
        fetchOffers();
      } else {
        alert(`Failed to create offer: ${result.error}`);
      }
    } else {
      if (!selectedOfferId) return;
      const result = await adminUpdateOfferAction(selectedOfferId, payload);
      if (result.success) {
        setIsModalOpen(false);
        fetchOffers();
      } else {
        alert(`Failed to update offer: ${result.error}`);
      }
    }
    setSaving(false);
  };

  const getOfferValidity = (offer: Offer) => {
    if (!offer.is_active) return <span className="text-zinc-500 font-bold">INACTIVE</span>;
    
    const now = new Date();
    const start = offer.starts_at ? new Date(offer.starts_at) : null;
    const end = offer.ends_at ? new Date(offer.ends_at) : null;

    if (start && now < start) {
      return <span className="text-blue-400 font-semibold text-[10px]">UPCOMING</span>;
    }
    if (end && now > end) {
      return <span className="text-zinc-600 font-semibold text-[10px]">EXPIRED</span>;
    }
    return <span className="text-emerald-400 font-semibold text-[10px]">ACTIVE</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-amber-100">Promotions & Coupons</h2>
          <p className="text-xs text-zinc-400 mt-1">Configure coupon promo codes, active checkout discount campaigns, and promo banner images.</p>
        </div>
        {isOwnerOrManager && (
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-bold text-zinc-950 rounded-xl cursor-pointer shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            Create Offer
          </button>
        )}
      </div>

      {/* Offers Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-zinc-400 font-sans">Syncing active promotions catalog...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 text-sm">
          No promotional offers or coupons configured yet. Click "Create Offer" to publish a discount.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {offers.map((offer) => {
            const isPercentage = offer.discount_type === 'percentage';
            return (
              <div
                key={offer.id}
                className="bg-zinc-900 border border-zinc-850 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold tracking-wider px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-amber-400 uppercase">
                      {offer.code || 'PASSIVE OFFER'}
                    </span>
                    <div className="flex items-center gap-2">
                      {getOfferValidity(offer)}
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-zinc-200 mt-1">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{offer.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4 bg-zinc-950 p-3.5 border border-zinc-850 rounded-xl">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Discount Value</span>
                      <span className="text-sm font-sans font-bold text-emerald-400">
                        {isPercentage ? `${offer.discount_value}% Off` : `₹${Number(offer.discount_value).toLocaleString('en-IN')} Off`}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">Min Order Req</span>
                      <span className="text-sm font-sans font-bold text-zinc-300">
                        ₹{Number(offer.minimum_order_value).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {offer.banner_image_url && (
                    <div className="mt-4 aspect-[21/9] w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                      <img src={offer.banner_image_url} alt="promo banner" className="object-cover w-full h-full" onError={(e) => { (e.target as any).src = 'https://placehold.co/400x150?text=Banner+Error'; }} />
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 mt-4 space-y-1">
                    {offer.starts_at && (
                      <div>Starts: {new Date(offer.starts_at).toLocaleString('en-IN')}</div>
                    )}
                    {offer.ends_at && (
                      <div>Ends: {new Date(offer.ends_at).toLocaleString('en-IN')}</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 mt-5 border-t border-zinc-850 pt-4">
                  <button
                    onClick={() => handleOpenEditModal(offer)}
                    className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-lg cursor-pointer transition-all"
                  >
                    {isReadOnly ? 'View Config' : 'Edit'}
                  </button>
                  {isOwnerOrManager && (
                    <button
                      onClick={() => handleDeleteOffer(offer.id, offer.title)}
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-red-900/40 text-xs font-semibold text-red-400 rounded-lg cursor-pointer transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Offer Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-zinc-950 border-b border-zinc-850">
              <div>
                <h3 className="text-lg font-serif text-amber-200">
                  {modalMode === 'create' ? 'Configure Discount Campaign' : 'Edit Promo Configuration'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Configure discounts percentage, check codes, banner image URLs, and validity periods</p>
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

            {/* Modal Form */}
            <form onSubmit={handleSaveOffer} className="p-6 overflow-y-auto space-y-5 flex-grow">
              {!isOwnerOrManager && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-lg">
                  <strong>Role Alert:</strong> Promotions and coupon editing is locked for content editors and order staff.
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Promotion Title *</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={formOffer.title}
                  onChange={(e) => setFormOffer({ ...formOffer, title: e.target.value })}
                  placeholder="e.g. Diwali Art Festival Celebration"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Coupon Promo Code (Optional)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={formOffer.code || ''}
                    onChange={(e) => setFormOffer({ ...formOffer, code: e.target.value })}
                    placeholder="e.g. DIWALI20"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none font-mono uppercase"
                  />
                  <span className="text-[9px] text-zinc-500 mt-1 block">Leave empty for automatic storewide active banners.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Discount Type</label>
                  <select
                    disabled={isReadOnly}
                    value={formOffer.discount_type}
                    onChange={(e) => setFormOffer({ ...formOffer, discount_type: e.target.value as DiscountType })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-zinc-350 outline-none"
                  >
                    <option value="percentage">Percentage ( % Off )</option>
                    <option value="fixed_amount">Fixed Amount ( Flat ₹ Off )</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Discount Value *</label>
                  <input
                    type="number"
                    required
                    disabled={isReadOnly}
                    value={formOffer.discount_value}
                    onChange={(e) => setFormOffer({ ...formOffer, discount_value: Number(e.target.value) })}
                    placeholder="e.g. 10 or 500"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Minimum Order Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    disabled={isReadOnly}
                    value={formOffer.minimum_order_value}
                    onChange={(e) => setFormOffer({ ...formOffer, minimum_order_value: Number(e.target.value) })}
                    placeholder="e.g. 999"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Starts At</label>
                  <input
                    type="datetime-local"
                    disabled={isReadOnly}
                    value={formOffer.starts_at || ''}
                    onChange={(e) => setFormOffer({ ...formOffer, starts_at: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Ends At</label>
                  <input
                    type="datetime-local"
                    disabled={isReadOnly}
                    value={formOffer.ends_at || ''}
                    onChange={(e) => setFormOffer({ ...formOffer, ends_at: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Promo Banner Image URL</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={formOffer.banner_image_url || ''}
                  onChange={(e) => setFormOffer({ ...formOffer, banner_image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/promo-banner"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Campaign Description</label>
                <textarea
                  disabled={isReadOnly}
                  rows={2}
                  value={formOffer.description || ''}
                  onChange={(e) => setFormOffer({ ...formOffer, description: e.target.value })}
                  placeholder="Diwali special flat 10% storewide offer on all acrylic custom nameplates."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none resize-none font-sans"
                />
              </div>

              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2.5 text-sm text-zinc-300 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={isReadOnly}
                    checked={formOffer.is_active}
                    onChange={(e) => setFormOffer({ ...formOffer, is_active: e.target.checked })}
                    className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                  />
                  Offer Status Active
                </label>
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer"
              >
                Close
              </button>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleSaveOffer}
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-bold text-zinc-950 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Promotion'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
