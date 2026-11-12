import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import {
  BookOpen, Users, DollarSign, PlusCircle, ArrowUpRight,
  CreditCard, Tag, HelpCircle, BarChart3, Settings,
  TrendingUp, ShieldCheck, Activity, Globe, Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardOverview() {
  // Fetch live platform stats
  let stats = {
    totalCourses: 0,
    totalUsers: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activePromoCodes: 0,
    recentEnrollments: [] as any[],
    topCourses: [] as any[],
  };

  if (process.env.DATABASE_URL) {
    try {
      const [
        courses,
        users,
        enrollmentStats,
        revenueAgg,
        pendingCount,
        activeCodes,
        recentEnrollments,
      ] = await Promise.all([
        prisma.course.count({ where: { isDeleted: false } }),
        prisma.user.count(),
        prisma.enrollment.count(),
        prisma.enrollment.aggregate({
          _sum: { amountPaid: true },
          where: { paymentStatus: 'COMPLETED' },
        }),
        prisma.enrollment.count({ where: { paymentStatus: 'PENDING' } }),
        prisma.promoCode.count({ where: { isActive: true } }),
        prisma.enrollment.findMany({
          where: { paymentStatus: 'COMPLETED' },
          include: {
            user: { select: { name: true, email: true, avatar: true } },
            course: { select: { title: true, slug: true } },
          },
          orderBy: { enrolledAt: 'desc' },
          take: 8,
        }),
      ]);

      stats = {
        totalCourses: courses,
        totalUsers: users,
        totalEnrollments: enrollmentStats,
        totalRevenue: Number(revenueAgg._sum.amountPaid || 0),
        pendingPayments: pendingCount,
        activePromoCodes: activeCodes,
        recentEnrollments: recentEnrollments.map((enr: any) => ({
          ...enr,
          amountPaid: Number(enr.amountPaid || 0),
        })),
        topCourses: [],
      };
    } catch (e) {
      console.error('Admin overview stats error:', e);
    }
  }

  const quickLinks = [
    { href: '/admin/courses/new', icon: PlusCircle, label: 'Create Course', desc: 'Add new course to catalog', color: 'from-blue-600 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { href: '/admin/users', icon: Users, label: 'Manage Users', desc: 'View & update user roles', color: 'from-violet-600 to-purple-500', shadow: 'shadow-violet-500/20' },
    { href: '/admin/enrollments', icon: CreditCard, label: 'Enrollments', desc: 'Grant or revoke access', color: 'from-emerald-600 to-teal-500', shadow: 'shadow-emerald-500/20' },
    { href: '/admin/promo-codes', icon: Tag, label: 'Promo Codes', desc: 'Create discount codes', color: 'from-amber-600 to-orange-500', shadow: 'shadow-amber-500/20' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics', desc: 'Revenue & engagement data', color: 'from-rose-600 to-pink-500', shadow: 'shadow-rose-500/20' },
    { href: '/admin/settings', icon: Settings, label: 'Settings', desc: 'Platform configuration', color: 'from-slate-600 to-gray-500', shadow: 'shadow-slate-500/20' },
  ];

  return (
    <div className="space-y-8 font-sans">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
            <ShieldCheck size={14} />
            <span>EraySame Tech Academy — Super Admin Control Center</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Platform Overview
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Full A-to-Z control: courses, users, payments, quizzes, analytics & settings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <Activity size={12} className="animate-pulse" />
            Platform Live
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <Zap size={12} />
            {stats.pendingPayments} Pending
          </div>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 relative overflow-hidden group hover:border-blue-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Courses</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BookOpen size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white relative">{stats.totalCourses}</p>
          <Link href="/admin/courses" className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 relative hover:text-blue-300">
            <ArrowUpRight size={12} /> Manage courses
          </Link>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 relative overflow-hidden group hover:border-violet-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Users</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Users size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white relative">{stats.totalUsers.toLocaleString()}</p>
          <Link href="/admin/users" className="text-[11px] text-violet-400 font-semibold flex items-center gap-1 relative hover:text-violet-300">
            <ArrowUpRight size={12} /> Manage users
          </Link>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enrollments</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white relative">{stats.totalEnrollments.toLocaleString()}</p>
          <Link href="/admin/enrollments" className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 relative hover:text-emerald-300">
            <ArrowUpRight size={12} /> View sales
          </Link>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between relative">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform Revenue</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-400 relative">${stats.totalRevenue.toLocaleString()}</p>
          <Link href="/admin/analytics" className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 relative hover:text-amber-300">
            <TrendingUp size={12} /> View analytics
          </Link>
        </div>

      </div>

      {/* ── Quick Action Grid ── */}
      <div>
        <h2 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
          <Globe size={18} className="text-blue-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-5 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all group relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-[0.07] transition-opacity`} />
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${item.color} ${item.shadow} shadow-lg mb-3`}>
                <item.icon size={18} className="text-white" />
              </div>
              <p className="font-extrabold text-white text-sm">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Sales Activity ── */}
      {stats.recentEnrollments.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-400" /> Recent Sales
            </h2>
            <Link href="/admin/enrollments" className="text-xs font-bold text-emerald-400 hover:text-emerald-300">
              View All →
            </Link>
          </div>

          <div className="divide-y divide-white/5">
            {stats.recentEnrollments.map((enr: any) => (
              <div key={enr.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={enr.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${enr.user?.name}`}
                    alt={enr.user?.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{enr.user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{enr.course?.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-emerald-400">${Number(enr.amountPaid || 0)}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    PAID
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Platform Status ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
          <p className="text-xs text-gray-400 mb-1">Active Promo Codes</p>
          <p className="text-2xl font-black text-amber-400">{stats.activePromoCodes}</p>
          <Link href="/admin/promo-codes" className="text-[10px] text-amber-400 hover:underline">Manage →</Link>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
          <p className="text-xs text-gray-400 mb-1">Pending Payments</p>
          <p className="text-2xl font-black text-orange-400">{stats.pendingPayments}</p>
          <Link href="/admin/enrollments?status=PENDING" className="text-[10px] text-orange-400 hover:underline">Review →</Link>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
          <p className="text-xs text-gray-400 mb-1">Quizzes Hub</p>
          <p className="text-2xl font-black text-cyan-400">—</p>
          <Link href="/admin/quizzes" className="text-[10px] text-cyan-400 hover:underline">Setup →</Link>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] text-center">
          <p className="text-xs text-gray-400 mb-1">System Settings</p>
          <p className="text-2xl font-black text-slate-400">●</p>
          <Link href="/admin/settings" className="text-[10px] text-slate-400 hover:underline">Configure →</Link>
        </div>
      </div>

    </div>
  );
}
