'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, ChefHat, UserCheck } from 'lucide-react';

export default function StaffLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState<string>('manager@smartmenu.com');
  const [password, setPassword] = useState<string>('password123');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.login(email, password);

      if (data.staff.role === 'KITCHEN') {
        router.push('/kitchen');
      } else {
        router.push('/manager');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-radial from-[#181b24] to-[#0f1117] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#181b24]/90 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Staff Operations Login</h1>
          <p className="text-xs text-gray-400">
            Sign in to access live table matrix, order approvals, and kitchen KDS.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300">Staff Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@smartmenu.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-hidden focus:border-amber-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-gray-700 text-gray-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Autofill */}
        <div className="pt-4 border-t border-gray-800/80 space-y-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center">
            One-Click Demo Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPreset('manager@smartmenu.com')}
              className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-left text-xs transition"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Manager</span>
              </div>
              <div className="text-[10px] text-gray-500 truncate">manager@smartmenu.com</div>
            </button>

            <button
              type="button"
              onClick={() => setPreset('kitchen@smartmenu.com')}
              className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-left text-xs transition"
            >
              <div className="font-bold text-white flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-orange-400" />
                <span>Kitchen Head</span>
              </div>
              <div className="text-[10px] text-gray-500 truncate">kitchen@smartmenu.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
