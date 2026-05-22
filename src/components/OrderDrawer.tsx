'use client';

import { useState, useEffect } from 'react';
import { CartStore, CartItem } from '@/lib/cart';

export function OrderDrawer({ whatsappPhone = "918421949875" }: { whatsappPhone?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Checkout form details
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('kalaasutra_toggle_cart', handleToggle);

    const updateCart = () => {
      setCartItems(CartStore.getCart());
    };
    updateCart();
    const unsubscribe = CartStore.subscribe(updateCart);

    return () => {
      window.removeEventListener('kalaasutra_toggle_cart', handleToggle);
      unsubscribe();
    };
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = subtotal > 500 || subtotal === 0 ? 0 : 50;
  
  let discountAmount = 0;
  if (appliedPromo) {
    if (appliedPromo.offer.discount_type === 'percentage') {
      discountAmount = Math.round((appliedPromo.offer.discount_value / 100) * subtotal);
    } else if (appliedPromo.offer.discount_type === 'fixed_amount') {
      discountAmount = Math.min(appliedPromo.offer.discount_value, subtotal);
    }
  }

  const finalAmount = subtotal - discountAmount + shippingFee;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    if (!promoCode.trim()) return;

    try {
      const response = await fetch('/api/offers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, orderValue: subtotal })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Invalid promo code');
      }

      setAppliedPromo(result);
      setPromoError('');
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoError(err.message || 'Promo code validation failed');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (cartItems.length === 0) {
      setSubmitError('Your cart is empty.');
      return;
    }

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }

    // Basic Indian phone validation
    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customer_name: name,
        customer_phone: phone,
        customer_email: email || null,
        customer_address: address,
        notes: notes || null,
        promo_code: appliedPromo?.offer.code || null,
        source: 'website' as const
      };

      const items = cartItems.map(item => {
        // Collect variant ID overrides
        const sizeVar = item.selectedVariants.find(v => v.name.toLowerCase() === 'size');
        const frameVar = item.selectedVariants.find(v => v.name.toLowerCase() === 'frame');

        return {
          product_id: item.productId,
          quantity: item.quantity,
          customization_data: {
            ...item.customizationData,
            selected_variants_summary: item.selectedVariants.map(v => `${v.name}: ${v.option_name}`).join(', '),
            size_variant_name: sizeVar?.option_name || null,
            frame_variant_name: frameVar?.option_name || null,
          }
        };
      });

      const idempotencyKey = crypto.randomUUID();

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({ orderData, items })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit order');
      }

      const createdOrder = result.order;

      // Generate WhatsApp redirection URL
      // Format details invoice
      let itemsText = '';
      cartItems.forEach((item, index) => {
        itemsText += `\n*${index + 1}. ${item.title}* (Qty: ${item.quantity})`;
        if (item.selectedVariants.length > 0) {
          const variantsStr = item.selectedVariants.map(v => `${v.name}: ${v.option_name}`).join(', ');
          itemsText += `\n   _Variants: ${variantsStr}_`;
        }
        Object.entries(item.customizationData).forEach(([k, v]) => {
          itemsText += `\n   _${k}: ${v}_`;
        });
        itemsText += `\n   _Price: ₹${item.price * item.quantity}_`;
      });

      const promoText = appliedPromo ? `\n🎁 *Promo Applied:* ${appliedPromo.offer.code} (-₹${discountAmount})` : '';

      const rawMsg = `*NEW ORDER FROM KALAASUTRA WEBSITE* 🎨
      
*Order Number:* ${createdOrder.order_number}
*Customer Name:* ${name}
*Phone:* ${phone}
*Delivery Address:* ${address}
${notes ? `*Customer Notes:* ${notes}\n` : ''}
*Ordered Items:* ${itemsText}
${promoText}
*Subtotal:* ₹${subtotal}
*Shipping Fee:* ₹${shippingFee}
-----------------------------
💰 *Final Total Amount:* ₹${finalAmount}

*Payment Status:* Pending QR Code Share

Hi Shubham, I have placed an order on the website. Please review and share your UPI QR code to complete the payment!`;

      const encodedMsg = encodeURIComponent(rawMsg);
      const cleanPhone = whatsappPhone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      // Clear states
      CartStore.clearCart();
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setAppliedPromo(null);
      setPromoCode('');
      setIsOpen(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Container */}
      <div className="relative z-10 w-full max-w-md h-full bg-zinc-950 border-l border-zinc-800 text-zinc-300 flex flex-col shadow-2xl animate-slide-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <h2 className="font-serif text-lg font-semibold text-zinc-100">
              Shopping Cart ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 focus:outline-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-zinc-700 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <h3 className="text-zinc-300 font-medium font-serif text-lg mb-1">Your cart is empty</h3>
              <p className="text-xs text-zinc-500 max-w-xs">
                Explore our catalog of custom nameplates, gold keychains, and laser engraved gifts to get started!
              </p>
            </div>
          ) : (
            <>
              {/* Items List */}
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div
                    key={item.id}
                    className="flex p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 gap-3"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-950 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item details */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold text-zinc-200 truncate pr-2">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => CartStore.removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      </div>

                      {/* Variant and customization descriptions */}
                      {item.selectedVariants.length > 0 && (
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          {item.selectedVariants.map(v => `${v.name}: ${v.option_name}`).join(', ')}
                        </p>
                      )}
                      {Object.entries(item.customizationData).map(([k, v]) => (
                        <p key={k} className="text-[10px] text-zinc-500 italic truncate">
                          {k}: {v}
                        </p>
                      ))}

                      {/* Price and quantity controls */}
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center space-x-2 border border-zinc-800 rounded-lg bg-zinc-950 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => CartStore.updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xs font-semibold text-zinc-300 px-1">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => CartStore.updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm font-bold text-zinc-200 font-sans">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Coupon Form */}
              <div className="border-t border-zinc-850 pt-5">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                        Promo Applied
                      </span>
                      <span className="text-sm font-bold text-emerald-200 uppercase">
                        {appliedPromo.offer.code}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-emerald-400 font-sans">
                        -₹{discountAmount}
                      </span>
                      <button
                        onClick={handleRemovePromo}
                        className="p-1 text-emerald-500 hover:text-red-400 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo / Coupon Code"
                      value={promoCode}
                      onChange={e => setPromoCode(e.target.value)}
                      className="flex-grow rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs focus:border-brand-gold focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs hover:bg-brand-gold hover:text-zinc-950 font-bold transition-all"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[10px] text-red-400 mt-1.5">{promoError}</p>
                )}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="border-t border-zinc-850 pt-5 space-y-4">
                <h4 className="font-serif text-sm font-semibold text-zinc-200">
                  Customer Shipping Details
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Full Name <span className="text-brand-gold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs focus:border-brand-gold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                      WhatsApp Phone <span className="text-brand-gold">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. rahul@gmail.com"
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs focus:border-brand-gold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Full Delivery Address <span className="text-brand-gold">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Building name, Flat no, Street, Landmark, City, State, Pincode"
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs focus:border-brand-gold focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">
                    Special Instructions / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Specific font size, packaging requests, or timing notes..."
                    className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-3.5 py-2.5 text-xs focus:border-brand-gold focus:outline-none resize-none"
                  />
                </div>

                {/* Pricing Summary */}
                <div className="bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-xl space-y-2.5">
                  <div className="flex justify-between text-xs text-zinc-450">
                    <span>Cart Subtotal</span>
                    <span className="font-sans">₹{subtotal}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-450">
                      <span>Promo Discount</span>
                      <span className="font-sans font-medium">-₹{discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-zinc-450">
                    <span>Shipping Fee</span>
                    <span className="font-sans">
                      {shippingFee === 0 ? <span className="text-brand-gold font-bold">FREE</span> : `₹${shippingFee}`}
                    </span>
                  </div>
                  <div className="border-t border-zinc-800 my-1 pt-2 flex justify-between text-sm font-bold text-zinc-150">
                    <span>Final Amount</span>
                    <span className="text-brand-gold font-sans text-base">₹{finalAmount}</span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-red-400 text-center font-medium bg-red-950/20 border border-red-900/50 p-2.5 rounded-lg">
                    {submitError}
                  </p>
                )}

                {/* Place Order CTA Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-brand-gold text-zinc-950 font-bold hover:bg-brand-gold-light transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="text-sm">Creating order request...</span>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      <span className="text-sm">Place Order via WhatsApp</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                  Your order is registered securely. You will be redirected to WhatsApp to confirm and coordinate payment (UPI QR codes) and design previews.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
