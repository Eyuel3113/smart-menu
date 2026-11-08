'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import {
  LayoutGrid,
  Zap,
  BookOpen,
  Receipt,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react';

interface ManagerNavProps {
  onRefresh?: () => void;
  title?: string;
}

export default function ManagerNav({ onRefresh }: ManagerNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    api.auth.logout();
    router.push('/login');
  };

  const navLinks = [
    { href: '/manager', label: 'Live Ops', icon: Zap },
    { href: '/manager/tables', label: 'Tables & Zones', icon: LayoutGrid },
    { href: '/manager/menu', label: 'Menu Catalog', icon: BookOpen },
    { href: '/manager/transactions', label: 'Payments', icon: Receipt },
    { href: '/kitchen', label: 'Kitchen KDS', icon: UtensilsCrossed },
    { href: '/manager/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/manager/settings', label: 'CMS Branding', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-[#090e24]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-blue-900/30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 transition-colors duration-200 shadow-xs dark:shadow-none">
      {/* Brand & Left Navigation */}
      <div className="flex items-center gap-6">
        <Link href="/manager" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-gray-950 font-black text-sm shadow-[0_0_12px_rgba(251,191,36,0.4)] group-hover:scale-105 transition">
            M
          </div>
          <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">SmartMenu</span>
        </Link>

        {/* Subtle Vertical Divider */}
        <div className="h-5 w-px bg-slate-200 dark:bg-blue-900/50 hidden md:block" />

        {/* Nav Links */}
        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 dark:shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    : 'text-slate-600 dark:text-blue-200/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-900/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Side: Theme Toggle, Bell & Profile Avatar */}
      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111936] dark:hover:bg-blue-900/30 border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            title="Refresh View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111936] dark:hover:bg-blue-900/30 border border-slate-200 dark:border-blue-900/40 text-slate-700 dark:text-amber-300 transition cursor-pointer"
          title={`Switch to ${isDark ? 'Light Mode' : 'Dark Mode'}`}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111936] dark:hover:bg-blue-900/30 border border-slate-200 dark:border-blue-900/40 text-slate-600 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-[#111936] dark:hover:bg-blue-900/30 border border-slate-200 dark:border-blue-900/40 text-slate-800 dark:text-white transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-400/40 flex items-center justify-center font-bold text-xs text-blue-700 dark:text-blue-200">
              D
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-blue-300" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0f1738] border border-slate-200 dark:border-blue-800/40 p-2 shadow-2xl z-50 animate-in fade-in space-y-1">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-blue-900/40">
                <p className="text-xs font-bold text-slate-900 dark:text-white">Manager Station</p>
                <p className="text-[10px] text-slate-500 dark:text-blue-300/70">Taste of Addis Lounge</p>
              </div>
              <Link
                href="/manager/settings"
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-900/30 flex items-center gap-2 transition"
                onClick={() => setProfileOpen(false)}
              >
                <Settings className="w-3.5 h-3.5 text-blue-500" />
                <span>CMS Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
