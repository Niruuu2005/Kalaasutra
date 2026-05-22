'use client';

// src/components/admin/OverviewTab.tsx
// Renders dashboard overview analytics cards and workspace action buttons

import React, { useState, useEffect } from 'react';
import { getDashboardMetricsAction } from '@/app/actions/admin';
import { UserRole } from '@/types/database.types';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface OverviewTabProps {
  profile: ProfileData;
  setActiveTab: (tab: any) => void;
}

interface Metrics {
  totalProducts: number;
  activeProducts: number;
  ordersThisMonth: number;
  revenueThisMonth: number;
  pendingPaymentsCount: number;
  newCustomRequestsCount: number;
  activeOffersCount: number;
}

export default function OverviewTab({ profile, setActiveTab }: OverviewTabProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setErrorMsg(null);
    const result = await getDashboardMetricsAction();
    if (result.success) {
      setMetrics(result.data);
    } else {
      setErrorMsg(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-zinc-400 font-sans tracking-wide">Syncing workshop metrics...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-900/30 rounded-2xl flex flex-col items-start gap-4">
        <p className="text-sm text-red-300">Failed to load overview data: {errorMsg}</p>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-xs font-semibold rounded-xl text-red-200 cursor-pointer"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Sales (This Month)',
      value: `₹${metrics?.revenueThisMonth.toLocaleString('en-IN')}`,
      description: 'Total revenue from paid orders this calendar month.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGlow: 'from-emerald-500/10 to-transparent'
    },
    {
      title: 'Orders (This Month)',
      value: metrics?.ordersThisMonth ?? 0,
      description: 'Count of new checkout submissions registered.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      bgGlow: 'from-amber-500/10 to-transparent'
    },
    {
      title: 'Pending Payments',
      value: metrics?.pendingPaymentsCount ?? 0,
      description: 'Orders awaiting verification on WhatsApp.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgGlow: 'from-yellow-500/10 to-transparent'
    },
    {
      title: 'New Commissions',
      value: metrics?.newCustomRequestsCount ?? 0,
      description: 'New off-catalog custom sketches and requests.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      bgGlow: 'from-blue-500/10 to-transparent'
    },
    {
      title: 'Catalog Size',
      value: `${metrics?.activeProducts} / ${metrics?.totalProducts}`,
      description: 'Active products listed vs total inventory base.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      ),
      bgGlow: 'from-purple-500/10 to-transparent'
    },
    {
      title: 'Campaign Offers',
      value: metrics?.activeOffersCount ?? 0,
      description: 'Promo codes and banner ads active currently.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
        </svg>
      ),
      bgGlow: 'from-pink-500/10 to-transparent'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-900 border border-zinc-800/80 rounded-2xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.06),transparent_70%)] pointer-events-none" />
        <div className="relative max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-serif text-amber-100">
            Namaste, {profile.full_name}!
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            Welcome to the Kalaasutra workspace dashboard. Here is a snapshot of your art store performance and action queues for today.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="group relative overflow-hidden bg-zinc-900 border border-zinc-850 hover:border-zinc-700 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg"
          >
            {/* Background glowing indicator */}
            <div className={`absolute -bottom-4 right-0 w-24 h-24 bg-gradient-to-tr ${kpi.bgGlow} filter blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`} />

            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                {kpi.icon}
              </div>
            </div>

            <div className="text-3xl font-bold tracking-tight text-zinc-100 font-sans group-hover:text-amber-300 transition-colors">
              {kpi.value}
            </div>

            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {kpi.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Links section */}
      <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">
          Quick Workflow Shortcuts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className="flex flex-col items-center gap-3 p-4 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 hover:bg-zinc-850 rounded-xl transition-all duration-200 cursor-pointer text-center group"
          >
            <span className="p-2.5 bg-zinc-950 border border-zinc-800 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Process Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className="flex flex-col items-center gap-3 p-4 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 hover:bg-zinc-850 rounded-xl transition-all duration-200 cursor-pointer text-center group"
          >
            <span className="p-2.5 bg-zinc-950 border border-zinc-800 text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Add Artwork</span>
          </button>

          <button
            onClick={() => setActiveTab('custom_requests')}
            className="flex flex-col items-center gap-3 p-4 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 hover:bg-zinc-850 rounded-xl transition-all duration-200 cursor-pointer text-center group"
          >
            <span className="p-2.5 bg-zinc-950 border border-zinc-800 text-blue-400 rounded-lg group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Custom Inquiries</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className="flex flex-col items-center gap-3 p-4 bg-zinc-900 border border-zinc-850 hover:border-amber-500/30 hover:bg-zinc-850 rounded-xl transition-all duration-200 cursor-pointer text-center group"
          >
            <span className="p-2.5 bg-zinc-950 border border-zinc-800 text-pink-400 rounded-lg group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-zinc-300">Manage Banners</span>
          </button>
        </div>
      </div>
    </div>
  );
}
