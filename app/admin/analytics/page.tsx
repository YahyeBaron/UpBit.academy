'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, BookOpen, RefreshCw, ArrowUpRight } from 'lucide-react';

interface AnalyticsData {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  recentEnrollments: any[];
}

interface ProviderData {
  provider: string | null;
  _sum: { amountPaid: number | null };
  _count: number;
}

const PROVIDER_COLORS: Record<string, string> = {
  ZAAD: 'from-emerald-500 to-teal-400',
  EDAHAB: 'from-blue-500 to-cyan-400',
  EVC_PLUS: 'from-violet-500 to-purple-400',
  STRIPE: 'from-indigo-500 to-blue-400',
  MANUAL: 'from-gray-500 to-slate-400',
  GOLIS_SAHAL: 'from-amber-500 to-orange-400',
};

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [overviewRes, providersRes] = await Promise.all([
        fetch('/api/admin/analytics?type=overview'),
        fetch('/api/admin/analytics?type=providers'),
      ]);
      const overviewData = await overviewRes.json();
      const providersData = await providersRes.json();
      setStats(overviewData);
      setProviders(providersData.providerBreakdown || []);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalProviderRevenue = providers.reduce((sum, p) => sum + (p._sum.amountPaid || 0), 0);

  return (
    <div className="space-y-8 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 size={22} className="text-rose-400" /> Analytics & Revenue
          </h1>
          <p className="text-sm text-gray-400 mt-1">Platform performance, revenue breakdown, and student insights</p>
        </div>
        <button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32 text-gray-400 text-sm">
          <RefreshCw size={16} className="animate-spin mr-2" /> Loading analytics…
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
              { label: 'Total Students', value: (stats?.totalStudents || 0).toLocaleString(), icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { label: 'Total Revenue', value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { label: 'Recent Sales', value: stats?.recentEnrollments?.length || 0, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                  <div className={`p-2 rounded-xl border ${bg}`}>
                    <Icon size={16} className={color} />
                  </div>
                </div>
                <p className={`text-3xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Payment Provider Breakdown */}
          {providers.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-extrabold text-white mb-5 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-400" /> Revenue by Payment Provider
              </h2>
              <div className="space-y-4">
                {providers
                  .sort((a, b) => (b._sum.amountPaid || 0) - (a._sum.amountPaid || 0))
                  .map((p) => {
                    const name = p.provider || 'Unknown';
                    const revenue = p._sum.amountPaid || 0;
                    const pct = totalProviderRevenue > 0 ? Math.round((revenue / totalProviderRevenue) * 100) : 0;
                    const gradient = PROVIDER_COLORS[name] || 'from-gray-500 to-slate-400';
                    return (
                      <div key={name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-bold text-white">{name}</span>
                          <div className="flex items-center gap-3 text-right">
                            <span className="text-gray-400 text-xs">{p._count} sales</span>
                            <span className="font-extrabold text-emerald-400">${revenue.toLocaleString()}</span>
                            <span className="text-gray-500 text-xs w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent Enrollments Table */}
          {stats?.recentEnrollments && stats.recentEnrollments.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-amber-400" /> Recent Completed Sales
                </h2>
                <a href="/admin/enrollments" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                  View All <ArrowUpRight size={12} />
                </a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="text-left pb-3">Student</th>
                      <th className="text-left pb-3">Course</th>
                      <th className="text-right pb-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.recentEnrollments.map((enr: any) => (
                      <tr key={enr.id} className="hover:bg-white/[0.02]">
                        <td className="py-3">
                          <p className="font-bold text-white">{enr.user?.name}</p>
                          <p className="text-xs text-gray-400">{enr.user?.email}</p>
                        </td>
                        <td className="py-3 text-gray-300 text-xs">{enr.course?.title}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">${enr.amountPaid || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
