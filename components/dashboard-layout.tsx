'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Award,
  User as UserIcon,
  Flame,
  Zap,
  LogOut,
  Compass,
} from 'lucide-react';
import { UserButton, useUser, SignOutButton, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { MOCK_STUDENT } from '@/lib/data';
import Image from 'next/image';

import Logo from '@/components/logo';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const navItems = [
    { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/my-courses', label: 'My Courses', icon: BookOpen },
    { href: '/roadmap', label: 'Learning Path', icon: Compass },
    { href: '/dashboard/achievements', label: 'Achievements', icon: Award },
    { href: '/dashboard/profile', label: 'Profile Settings', icon: UserIcon },
  ];

  const displayName = isLoaded && user ? user.fullName || user.firstName || MOCK_STUDENT.name : MOCK_STUDENT.name;
  const avatarUrl = isLoaded && user ? user.imageUrl : MOCK_STUDENT.avatar;

  return (
    <div className="min-h-screen bg-[#020814] text-white flex flex-col font-sans">
      {/* Dashboard Topbar */}
      <header className="h-16 border-b border-white/10 bg-black/60 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo imageSize={36} />
          </Link>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
            Student Portal
          </span>
        </div>

        {/* Right Stats & Profile */}
        <div className="flex items-center gap-6">
          {/* Streak Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
            <Flame size={16} className="fill-orange-400" />
            <span>{MOCK_STUDENT.streak} Day Streak!</span>
          </div>

          {/* XP Points */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
            <Zap size={16} className="fill-cyan-400" />
            <span>{MOCK_STUDENT.totalPoints} XP</span>
          </div>

          {/* User Avatar / Clerk UserButton */}
          <div className="flex items-center gap-3">
            {isLoaded && user ? (
              <>
                <ClerkLoaded>
                  <UserButton />
                </ClerkLoaded>
                <ClerkLoading>
                  <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse border border-blue-500/40" />
                </ClerkLoading>
              </>
            ) : (
              <div className="relative w-9 h-9 rounded-full overflow-hidden border border-blue-500/40">
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-white">{displayName}</p>
              <p className="text-[10px] text-gray-400">{MOCK_STUDENT.level}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-black/40 p-6 flex flex-col justify-between hidden md:flex shrink-0">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-3">
              Navigation
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Bottom actions */}
          <div className="pt-6 border-t border-white/10">
            <SignOutButton>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={18} />
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </aside>

        {/* Dashboard Body */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
