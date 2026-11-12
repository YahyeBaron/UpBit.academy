import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import AdminLogoutBtn from '@/components/admin/admin-logout-btn';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  ShieldCheck,
  ArrowLeft,
  Users,
  CreditCard,
  Tag,
  HelpCircle,
  BarChart3,
  Settings,
  GraduationCap,
} from 'lucide-react';

import Logo from '@/components/logo';
import DbKeepAlive from '@/components/admin/db-keep-alive';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let activeAdminName = 'Admin';
  let isAuthenticatedAdmin = false;

  // Enforce dedicated database admin_session token (from /admin/login)
  const admin = await getAdminSession();
  if (admin && admin.isActive) {
    isAuthenticatedAdmin = true;
    activeAdminName = admin.username || admin.email || 'Admin';
  }

  // 🛡️ Redirect unauthorized access to dedicated Admin Login page
  if (!isAuthenticatedAdmin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#4d65ff] selection:text-white">
      <DbKeepAlive />
      
      {/* ── Admin Top Navigation Bar ── */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Logo imageSize={32} />
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#4d65ff]/15 border border-[#4d65ff]/30 text-[#a5b4fc] px-2.5 py-1 rounded-full font-space-grotesk">
              <ShieldCheck size={11} /> Admin Control Panel
            </span>
          </div>
        </div>

        {/* Quick Actions & Dedicated Admin Logout */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
          >
            <PlusCircle size={14} /> Create Course
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <AdminLogoutBtn adminName={activeAdminName} />
        </div>
      </header>

      {/* ── Sub Navigation Bar (Super Admin Control Panel) ── */}
      <div className="border-b border-white/10 bg-white/[0.02] px-4 sm:px-8 flex items-center gap-1 overflow-x-auto scrollbar-hide text-xs font-bold text-gray-400">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <LayoutDashboard size={14} /> Overview
        </Link>
        <Link
          href="/admin/courses"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <BookOpen size={14} /> Courses & Studio
        </Link>
        <Link
          href="/admin/instructors"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-cyan-500 transition-all whitespace-nowrap"
        >
          <GraduationCap size={14} /> Faculty & Instructors
        </Link>
        <Link
          href="/admin/users"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <Users size={14} /> User Management
        </Link>
        <Link
          href="/admin/enrollments"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <CreditCard size={14} /> Sales & Enrollments
        </Link>
        <Link
          href="/admin/promo-codes"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <Tag size={14} /> Promo Codes
        </Link>
        <Link
          href="/admin/quizzes"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <HelpCircle size={14} /> Quizzes Hub
        </Link>
        <Link
          href="/admin/analytics"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <BarChart3 size={14} /> Analytics
        </Link>
        <Link
          href="/admin/settings"
          className="flex items-center gap-1.5 py-3 px-3 border-b-2 border-transparent hover:text-white hover:border-blue-500 transition-all whitespace-nowrap"
        >
          <Settings size={14} /> Settings
        </Link>
      </div>

      {/* ── Main Content Area ── */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
