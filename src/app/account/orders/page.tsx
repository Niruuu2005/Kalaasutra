import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { OrderService } from '@/lib/services/order.service';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export default async function AccountOrdersPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const orders = await OrderService.getOrdersByUser(user.id);

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif text-zinc-100">Order history</h2>
          <p className="mt-1 text-sm text-zinc-400">Track your previous and active orders.</p>
        </div>
        <Link
          href="/"
          className="text-sm px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 hover:border-brand-gold hover:text-brand-gold transition-colors"
        >
          Continue shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-zinc-300">No orders yet.</p>
          <p className="mt-2 text-sm text-zinc-500">Once you place an order, it will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-zinc-400">{order.order_number}</p>
                  <p className="text-xs text-zinc-500 mt-1">Placed on {formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-zinc-300">Order: {order.order_status.replace('_', ' ')}</p>
                  <p className="text-sm text-zinc-300">Payment: {order.payment_status.replace('_', ' ')}</p>
                  <p className="text-base font-semibold text-brand-gold mt-1">{formatCurrency(order.final_amount)}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-800 pt-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Items</p>
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm text-zinc-300">
                      <span>
                        {item.product_title} <span className="text-zinc-500">× {item.quantity}</span>
                      </span>
                      <span>{formatCurrency(item.final_price)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
