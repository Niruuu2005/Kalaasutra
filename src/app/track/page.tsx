'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOrderData(null);
    setLoading(true);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phoneNumber }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Could not find an order with those details.');
      }

      setOrderData(result.data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['new', 'confirmed', 'in_progress', 'ready', 'shipped', 'delivered'];
    const index = steps.indexOf(status);
    return index >= 0 ? index : 0;
  };

  const currentStep = orderData ? getStatusStep(orderData.order_status) : 0;
  const isCancelled = orderData?.order_status === 'cancelled';

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif font-bold text-zinc-100 mb-4">Track Your Order</h1>
          <p className="text-zinc-400">Enter your order details below to see the current status of your customization.</p>
        </div>

        {!orderData ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
            <form onSubmit={handleTrack} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  Order Number
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. ORD-12345"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">
                  WhatsApp / Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Used during checkout"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-xs p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gold hover:bg-brand-gold-light text-zinc-950 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-in">
            {/* Status Timeline Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-zinc-800 pb-6 mb-8 gap-4">
                <div>
                  <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Order Details</h2>
                  <div className="text-2xl font-serif text-amber-400 mt-1">{orderData.order_number}</div>
                  <div className="text-zinc-400 text-sm mt-1">Placed on {new Date(orderData.created_at).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={() => setOrderData(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg transition-colors self-start md:self-auto"
                >
                  Track Another Order
                </button>
              </div>

              {isCancelled ? (
                <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 text-center">
                  <h3 className="text-red-400 font-bold text-lg mb-2">Order Cancelled</h3>
                  <p className="text-zinc-400 text-sm">This order has been cancelled. If you believe this is a mistake, please contact us on WhatsApp.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Tracker */}
                  <div className="flex justify-between items-center relative z-10">
                    {['Confirmed', 'Processing', 'Ready', 'Shipped', 'Delivered'].map((step, index) => {
                      // Map our backend statuses to simpler UI steps
                      const mappedStepIndex = index;
                      const isCompleted = currentStep > index;
                      const isCurrent = currentStep === index || (index === 0 && currentStep === 0);
                      
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${isCompleted ? 'bg-amber-400 border-amber-400 text-zinc-950' : isCurrent ? 'bg-zinc-900 border-amber-400 text-amber-400' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}`}>
                            {isCompleted ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              index + 1
                            )}
                          </div>
                          <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider text-center max-w-[60px] md:max-w-none ${isCompleted || isCurrent ? 'text-zinc-200' : 'text-zinc-600'}`}>
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Timeline Line background */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-800 -z-10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, (currentStep / 4) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Order Summary</h3>
              
              <div className="divide-y divide-zinc-800/50 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950/50">
                {orderData.items.map((item: any) => (
                  <div key={item.id} className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="font-semibold text-zinc-200">{item.product_title}</div>
                      <div className="text-xs text-zinc-500 mt-1">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-sans font-bold text-amber-300">
                      ₹{item.final_price}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-zinc-400">Payment Status</span>
                <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest ${
                  orderData.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 
                  orderData.payment_status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' : 
                  'bg-red-500/20 text-red-400'
                }`}>
                  {orderData.payment_status}
                </span>
              </div>

              <div className="flex justify-between items-center border-t border-zinc-800 pt-4">
                <span className="text-lg font-serif text-zinc-300">Total Amount</span>
                <span className="text-2xl font-sans font-bold text-amber-400">₹{orderData.final_amount}</span>
              </div>
            </div>

            <div className="text-center text-zinc-500 text-xs">
              If you have any questions about your order, please message us on WhatsApp with your Order Number.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
