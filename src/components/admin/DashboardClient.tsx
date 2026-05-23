'use client';

// src/components/admin/DashboardClient.tsx
// Core client container orchestrating admin workspace views

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/database.types';

// Tab Sub-Components
import OverviewTab from './OverviewTab';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductsTab';
import CustomRequestsTab from './CustomRequestsTab';
import OffersTab from './OffersTab';
import SettingsTab from './SettingsTab';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface DashboardClientProps {
  profile: ProfileData;
}

type TabType = 'overview' | 'orders' | 'products' | 'custom_requests' | 'offers' | 'settings';

export default function DashboardClient({ profile }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md">Owner</span>;
      case 'admin':
        return <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-yellow-600/10 border border-yellow-600/30 text-yellow-500 rounded-md">Admin</span>;
      case 'user':
        return <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-md">User</span>;
      default:
        return null;
    }
  };

  const menuItems = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      id: 'orders' as const,
      label: 'Orders',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'products' as const,
      label: 'Products Catalog',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
    {
      id: 'custom_requests' as const,
      label: 'Custom Requests',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'offers' as const,
      label: 'Offers & Coupons',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      )
    },
    {
      id: 'settings' as const,
      label: 'Site Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab profile={profile} setActiveTab={setActiveTab} />;
      case 'orders':
        return <OrdersTab profile={profile} />;
      case 'products':
        return <ProductsTab profile={profile} />;
      case 'custom_requests':
        return <CustomRequestsTab profile={profile} />;
      case 'offers':
        return <OffersTab profile={profile} />;
      case 'settings':
        return <SettingsTab profile={profile} />;
      default:
        return <OverviewTab profile={profile} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-zinc-400 hover:text-zinc-100 outline-none p-1 rounded-lg focus:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
          <span className="font-serif text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
            KALAASUTRA
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getRoleBadge(profile.role)}
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } fixed md:static inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out md:h-screen sticky top-0`}
      >
        <div className="flex flex-col p-6 overflow-y-auto grow">
          <div className="hidden md:flex flex-col items-start mb-8">
            <span className="font-serif text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
              KALAASUTRA
            </span>
            <span className="text-[10px] text-zinc-500 font-sans tracking-widest uppercase mt-0.5">
              Admin Workspace
            </span>
          </div>

          <nav className="space-y-1.5 grow">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/5 text-amber-400 border-l-2 border-amber-500 pl-[14px]'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <span className={isActive ? 'text-amber-400' : 'text-zinc-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-600/20 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 font-sans">
              {profile.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-200 truncate">{profile.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {getRoleBadge(profile.role)}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-zinc-950 border border-zinc-800/80 hover:border-red-900/30 hover:bg-red-950/20 hover:text-red-400 text-zinc-400 py-2.5 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout Workspace
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-grow p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full md:h-screen">
        {renderActiveTab()}
      </main>

      {/* Sidebar overlay background for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </div>
  );
}
