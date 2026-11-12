'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard, Search, Plus, Trash2, RefreshCw, Check, X,
  ChevronDown, Filter, Download
} from 'lucide-react';

interface Enrollment {
  id: string;
  enrolledAt: string;
  paymentStatus: string;
  amountPaid: number;
  provider: string | null;
  transactionRef: string | null;
  user: { id: string; name: string; email: string };
  course: { slug: string; title: string; price: number };
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  FAILED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [form, setForm] = useState({ studentEmail: '', courseSlug: '', paymentStatus: 'COMPLETED', amountPaid: '0', provider: 'MANUAL' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const cs = sp.get('courseSlug');
      if (cs) {
        setCourseFilter(cs);
      }
    }
  }, []);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (courseFilter) params.set('courseSlug', courseFilter);
      const res = await fetch(`/api/admin/enrollments?${params}`);
      const data = await res.json();
      setEnrollments(data.enrollments || []);
    } catch {
      showToast('Failed to load enrollments', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, courseFilter]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amountPaid: parseFloat(form.amountPaid) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Student enrolled successfully!', 'success');
      setShowManual(false);
      setForm({ studentEmail: '', courseSlug: '', paymentStatus: 'COMPLETED', amountPaid: '0', provider: 'MANUAL' });
      fetchEnrollments();
    } catch (e: any) {
      showToast(e.message || 'Enrollment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const revokeEnrollment = async (id: string) => {
    if (!confirm('Revoke this enrollment? The student will lose access to the course.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/enrollments?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
      showToast('Enrollment revoked', 'success');
    } catch {
      showToast('Failed to revoke enrollment', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = enrollments.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.user.name.toLowerCase().includes(q) || e.user.email.toLowerCase().includes(q) || e.course.title.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 font-sans">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-2xl border ${
          toast.type === 'success' ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300' : 'bg-rose-950 border-rose-500/30 text-rose-300'
        }`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard size={22} className="text-emerald-400" /> Sales & Enrollments
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {filtered.length} enrollments · Manually grant or revoke course access
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEnrollments}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowManual(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-400 transition-all"
          >
            <Plus size={14} /> Manual Enroll
          </button>
        </div>
      </div>

      {/* Active Course Filter Badge */}
      {courseFilter && (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold w-fit">
          <span>Filtering by course: <strong className="text-white font-mono">{courseFilter}</strong></span>
          <button
            onClick={() => {
              setCourseFilter('');
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/admin/enrollments');
              }
            }}
            className="text-blue-400 hover:text-white ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
            title="Clear course filter"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by student name, email, or course…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Manual Enroll Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">Manual Enrollment</h3>
              <button onClick={() => setShowManual(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleManualEnroll} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Student Email *</label>
                <input
                  type="email" required
                  value={form.studentEmail}
                  onChange={(e) => setForm((f) => ({ ...f, studentEmail: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="student@email.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Course Slug *</label>
                <input
                  type="text" required
                  value={form.courseSlug}
                  onChange={(e) => setForm((f) => ({ ...f, courseSlug: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. react-complete-guide"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Amount Paid ($)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.amountPaid}
                    onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Status</label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Payment Provider</label>
                <input
                  type="text"
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="MANUAL / ZAAD / STRIPE…"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowManual(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-sm font-bold hover:from-emerald-500 transition-all disabled:opacity-50">
                  {submitting ? 'Enrolling…' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading enrollments…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <CreditCard size={40} className="mb-3 opacity-30" />
            <p className="font-bold">No enrollments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-6 py-4">Student</th>
                  <th className="text-left px-4 py-4">Course</th>
                  <th className="text-center px-4 py-4">Status</th>
                  <th className="text-right px-4 py-4">Amount</th>
                  <th className="text-left px-4 py-4">Provider</th>
                  <th className="text-left px-4 py-4">Date</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((enr) => (
                  <tr key={enr.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-bold text-white">{enr.user.name}</p>
                      <p className="text-xs text-gray-400">{enr.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white font-medium text-xs truncate max-w-[180px]">{enr.course.title}</p>
                      <p className="text-xs text-gray-500 font-mono">{enr.course.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${STATUS_COLORS[enr.paymentStatus] || STATUS_COLORS.PENDING}`}>
                        {enr.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">${Number(enr.amountPaid || 0)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{enr.provider || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(enr.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => revokeEnrollment(enr.id)}
                        disabled={deletingId === enr.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all disabled:opacity-40 ml-auto"
                      >
                        <Trash2 size={12} /> {deletingId === enr.id ? '…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
