import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { AccountHeader } from '@/components/account/AccountHeader';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AccountHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
