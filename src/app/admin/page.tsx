// src/app/admin/page.tsx
// Main admin entry point, checking authorization and redirecting

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/admin/dashboard');
  } else {
    redirect('/admin/login');
  }
}
