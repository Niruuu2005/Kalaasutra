'use client';

// src/components/admin/OrdersTab.tsx
// Management console for listing and updating checkout orders

import React, { useState, useEffect } from 'react';
import {
  adminGetOrdersAction,
  adminGetOrderDetailsAction,
  adminUpdateOrderStatusAction,
  adminUpdatePaymentStatusAction
} from '@/app/actions/admin';
import { Order, OrderItem, OrderStatus, PaymentStatus, UserRole } from '@/types/database.types';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface OrdersTabProps {
  profile: ProfileData;
}

export default function OrdersTab({ profile }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReadOnly = profile.role === 'user';

  const fetchOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    const filters: any = {};
    if (orderFilter !== 'all') filters.orderStatus = orderFilter;
    if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter;
    if (search.trim() !== '') filters.search = search.trim();

    const result = await adminGetOrdersAction(filters);
    if (result.success) {
      setOrders(result.data);
    } else {
      setErrorMsg(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [orderFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleViewDetails = async (id: string) => {
    setSelectedOrderId(id);
    setDetailsLoading(true);
    setSelectedOrder(null);
    const result = await adminGetOrderDetailsAction(id);
    if (result.success) {
      setSelectedOrder(result.data);
    } else {
      alert(`Failed to load order details: ${result.error}`);
      setSelectedOrderId(null);
    }
    setDetailsLoading(false);
  };

  const handleUpdateOrderStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    const result = await adminUpdateOrderStatusAction(selectedOrder.id, status);
    if (result.success) {
      setSelectedOrder({ ...selectedOrder, order_status: status });
      // Update in listing list too
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, order_status: status } : o));
    } else {
      alert(`Failed to update status: ${result.error}`);
    }
    setUpdatingStatus(false);
  };

  const handleUpdatePaymentStatus = async (status: PaymentStatus) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    const result = await adminUpdatePaymentStatusAction(selectedOrder.id, status);
    if (result.success) {
      setSelectedOrder({ ...selectedOrder, payment_status: status });
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, payment_status: status } : o));
    } else {
      alert(`Failed to update payment status: ${result.error}`);
    }
    setUpdatingStatus(false);
  };

  const formatCustomization = (customData: any) => {
    if (!customData || typeof customData !== 'object') return null;
    
    return (
      <div className="text-xs space-y-1 text-zinc-400 mt-2 bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
        {Object.entries(customData).map(([key, val]: [string, any]) => {
          if (!val) return null;
          // Filter out internal variant IDs for clean reading
          if (key.includes('_id')) return null;
          
          // Beautify keys
          const cleanKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
            
          return (
            <div key={key} className="flex flex-col sm:flex-row sm:gap-2">
              <span className="font-semibold text-zinc-500 min-w-[120px]">{cleanKey}:</span>
              <span className="text-zinc-300 break-words">{String(val)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const getOrderStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      new: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      confirmed: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      in_progress: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
      ready: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      shipped: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
      delivered: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      cancelled: 'bg-zinc-800 border-zinc-700 text-zinc-500'
    };
    return (
      <span className={`px-2 py-1 text-[11px] font-semibold rounded-md border ${styles[status]}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const styles: Record<PaymentStatus, string> = {
      pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
      paid: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      failed: 'bg-red-500/10 border-red-500/30 text-red-400',
      refunded: 'bg-zinc-800 border-zinc-700 text-zinc-500'
    };
    return (
      <span className={`px-2 py-1 text-[11px] font-semibold rounded-md border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-amber-100">Checkout Orders</h2>
          <p className="text-xs text-zinc-400 mt-1">Review website checkouts, track customization data, and update order statuses.</p>
        </div>
      </div>

      {/* Search & Filters */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-900 p-4 border border-zinc-850 rounded-2xl">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            placeholder="Search Order #, customer name, phone..."
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
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none"
          >
            <option value="all">All Order Statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="ready">Ready for Pickup/Shipping</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-zinc-300 outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </form>

      {/* Orders Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-zinc-400 font-sans">Fetching order records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 text-sm">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-medium text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Order Number</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Final Amount</th>
                  <th className="py-4 px-6">Payment</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-850/30 transition-colors">
                    <td className="py-4 px-6 font-mono text-zinc-200 font-semibold">{order.order_number}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-300">{order.customer_name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{order.customer_phone}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-amber-300 font-semibold font-sans">
                      ₹{Number(order.final_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">{getPaymentStatusBadge(order.payment_status as PaymentStatus)}</td>
                    <td className="py-4 px-6">{getOrderStatusBadge(order.order_status as OrderStatus)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleViewDetails(order.id)}
                        className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 text-xs font-semibold text-amber-400 rounded-lg cursor-pointer transition-all"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-zinc-950 border-b border-zinc-850">
              <div>
                <h3 className="text-lg font-serif text-amber-200 flex items-center gap-3">
                  Order Details
                  {selectedOrder && (
                    <span className="font-mono text-sm text-zinc-400 font-sans">({selectedOrder.order_number})</span>
                  )}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Audit log records & processing parameters</p>
              </div>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg cursor-pointer outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              {detailsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-xs text-zinc-400">Loading order items...</p>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* Status Configuration Controllers (Only shown if authorized) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Order Processing Status
                      </label>
                      <select
                        disabled={isReadOnly || updatingStatus}
                        value={selectedOrder.order_status}
                        onChange={(e) => handleUpdateOrderStatus(e.target.value as OrderStatus)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500 disabled:opacity-50"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready for Pickup/Delivery</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Payment Transaction Status
                      </label>
                      <select
                        disabled={isReadOnly || updatingStatus}
                        value={selectedOrder.payment_status}
                        onChange={(e) => handleUpdatePaymentStatus(e.target.value as PaymentStatus)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500 disabled:opacity-50"
                      >
                        <option value="pending">Pending Verification</option>
                        <option value="paid">Paid (Verified)</option>
                        <option value="failed">Failed / Cancelled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Customer Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-850 rounded-xl text-sm">
                      <div>
                        <div className="text-zinc-500 text-xs">Customer Name</div>
                        <div className="font-semibold text-zinc-200 mt-1">{selectedOrder.customer_name}</div>
                      </div>
                      <div>
                        <div className="text-zinc-500 text-xs">WhatsApp / Phone Line</div>
                        <div className="font-semibold text-zinc-200 mt-1">
                          <a
                            href={`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline flex items-center gap-1.5"
                          >
                            {selectedOrder.customer_phone}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="text-zinc-500 text-xs">Shipping Address</div>
                        <div className="font-semibold text-zinc-200 mt-1 leading-relaxed">
                          {selectedOrder.customer_address || <span className="italic text-zinc-600">No address provided.</span>}
                        </div>
                      </div>
                      {selectedOrder.notes && (
                        <div className="sm:col-span-2">
                          <div className="text-zinc-500 text-xs">Customer Notes</div>
                          <div className="text-zinc-300 mt-1 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-900 leading-relaxed">
                            {selectedOrder.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ordered Items</h4>
                    <div className="border border-zinc-800 rounded-xl overflow-hidden">
                      <div className="bg-zinc-950 border-b border-zinc-850 px-4 py-2 flex text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span className="grow">Product details</span>
                        <span className="w-20 text-center">Qty</span>
                        <span className="w-24 text-right">Price</span>
                      </div>
                      <div className="divide-y divide-zinc-850 bg-zinc-900/20">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="p-4 flex flex-col sm:flex-row gap-4">
                            <div className="grow">
                              <h5 className="font-semibold text-sm text-zinc-200">{item.product_title}</h5>
                              {formatCustomization(item.customization_data)}
                            </div>
                            <div className="w-20 text-center text-sm font-semibold text-zinc-300 self-center">
                              x{item.quantity}
                            </div>
                            <div className="w-24 text-right text-sm font-semibold text-amber-300 font-sans self-center">
                              ₹{Number(item.final_price).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Invoice Summary */}
                      <div className="bg-zinc-950 p-4 border-t border-zinc-800 text-sm space-y-2">
                        <div className="flex justify-between text-zinc-400 text-xs">
                          <span>Subtotal</span>
                          <span>₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}</span>
                        </div>
                        {Number(selectedOrder.discount_amount) > 0 && (
                          <div className="flex justify-between text-emerald-400 text-xs">
                            <span>Promo Discount</span>
                            <span>-₹{Number(selectedOrder.discount_amount).toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-zinc-100 border-t border-zinc-850 pt-2 text-base">
                          <span>Total Amount</span>
                          <span className="text-amber-400">₹{Number(selectedOrder.final_amount).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex justify-end gap-3">
              <button
                onClick={() => setSelectedOrderId(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
