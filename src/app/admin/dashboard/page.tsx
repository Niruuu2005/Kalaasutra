// src/app/admin/dashboard/page.tsx
// Server-guarded workspace landing page for administrators

import { redirect } from 'next/navigation';
import { adminGetCurrentUserAction } from '@/app/actions/admin';
import DashboardClient from '@/components/admin/DashboardClient';

export default async function DashboardPage() {
  const result = await adminGetCurrentUserAction();
  
  if (!result.success || !result.data) {
    redirect('/admin/login');
  }

  const profile = result.data;

  return <DashboardClient profile={profile} />;
}
