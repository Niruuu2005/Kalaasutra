// src/app/admin/layout.tsx
// Layout for all administration routing paths, enforcing dark theme and page bounds

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalaasutra Admin Portal',
  description: 'Administrative portal for Shubham Art (Kalaasutra) Online Store.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased">
      {children}
    </div>
  );
}
