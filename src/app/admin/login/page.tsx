'use client';

// src/app/admin/login/page.tsx
// Secure admin authentication panel

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      // Successful login, redirect to dashboard
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate.');
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-zinc-950 text-zinc-100">
      {/* Background radial gold glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.04),transparent_50%)] pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-8 backdrop-blur-md overflow-hidden">
        {/* Decorative gold accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-serif tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400">
            KALAASUTRA
          </h1>
          <p className="text-sm text-zinc-400 font-sans tracking-widest uppercase mt-1">
            Admin Workspace
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800/80 text-red-200 text-xs rounded-lg flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
              placeholder="admin@kalaasutra.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full relative mt-4 overflow-hidden group rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 py-3 text-sm font-semibold tracking-wider transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Credentials...
              </span>
            ) : (
              'Sign In to Workspace'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Kalaasutra Admin Portal</p>
          <p className="mt-1 text-[10px] text-zinc-600">Restricted system. Unauthorized access is prohibited.</p>
        </div>
      </div>
    </div>
  );
}
