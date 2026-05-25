'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AccountHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-zinc-300 text-sm hover:text-brand-gold transition-colors">
            Back to Store
          </Link>
          <h1 className="text-xl md:text-2xl font-serif text-zinc-100 mt-1">My Account</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/account/orders"
            className="text-sm px-3 py-2 rounded-lg border border-zinc-700 text-zinc-200 hover:border-brand-gold hover:text-brand-gold transition-colors"
          >
            Orders
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm px-3 py-2 rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
            type="button"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
