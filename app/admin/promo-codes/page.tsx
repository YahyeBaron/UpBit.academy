'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Trash2, RefreshCw, Check, X, ToggleLeft, ToggleRight, Copy, DollarSign, Percent } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountAmount: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  applicableCourses: string[];
  description: string | null;
  expiresAt: string;
  maxUses: number | null;
  usedCount: number;
  maxPerUser: number;
  isActive: boolean;
  createdAt: string;
  _count: { usage: number };
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discount: '20',
    discountAmount: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    expiresAt: '',
    maxUses: '',
    maxPerUser: '1',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes');
      const data = await res.json();
      setCodes(data.promoCodes || []);
    } catch {
      showToast('Failed to load promo codes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const discountVal = form.discountType === 'PERCENTAGE'
        ? parseInt(form.discount || '20')
        : (form.discountAmount ? parseFloat(form.discountAmount) : 0);

      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discount: parseInt(form.discount || '20'),
          discountValue: discountVal,
          discountAmount: form.discountAmount ? parseFloat(form.discountAmount) : undefined,
          minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
          maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : undefined,
          expiresAt: form.expiresAt,
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          maxPerUser: parseInt(form.maxPerUser || '1'),
          description: form.description || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.details?.[0]?.message || data.error || 'Failed to create promo code';
        throw new Error(errorMsg);
      }
      showToast('Promo code created!', 'success');
      setShowCreate(false);
      setForm({
        code: '',
        discountType: 'PERCENTAGE',
        discount: '20',
        discountAmount: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        expiresAt: '',
        maxUses: '',
        maxPerUser: '1',
        description: '',
      });
      fetchCodes();
    } catch (e: any) {
      showToast(e.message || 'Failed to create promo code', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentState }),
      });
      if (!res.ok) throw new Error();
      setCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !currentState } : c));
      showToast(`Code ${!currentState ? 'activated' : 'deactivated'}`, 'success');
    } catch {
      showToast('Failed to update code status', 'error');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Copied: ${code}`, 'success');
  };

  const defaultExpiry = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

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
            <Tag size={22} className="text-amber-400" /> Promo Codes & Discounts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {codes.filter((c) => c.isActive).length} active codes · Create and manage discount codes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCodes} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => { setShowCreate(true); setForm((f) => ({ ...f, expiresAt: defaultExpiry() })); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 hover:from-amber-500 transition-all"
          >
            <Plus size={14} /> Create Code
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black text-white">Create Promo Code</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Code *</label>
                <input
                  type="text" required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-amber-500/50 uppercase"
                  placeholder="SUMMER25"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as any }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#161b22] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Dollar ($)</option>
                  </select>
                </div>

                <div>
                  {form.discountType === 'PERCENTAGE' ? (
                    <>
                      <label className="text-xs font-bold text-gray-400 mb-1.5 block">Percentage (%)</label>
                      <input
                        type="number" min="1" max="100" required
                        value={form.discount}
                        onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </>
                  ) : (
                    <>
                      <label className="text-xs font-bold text-gray-400 mb-1.5 block">Fixed Amount ($)</label>
                      <input
                        type="number" min="1" step="0.01" required
                        value={form.discountAmount}
                        onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                        placeholder="10.00"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Min Order ($ optional)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    placeholder="None"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Max Discount Cap ($ optional)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    placeholder="None"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Expires On *</label>
                  <input
                    type="date" required
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-1.5 block">Max Uses Total</label>
                  <input
                    type="number" min="1"
                    value={form.maxUses}
                    onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 mb-1.5 block">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  placeholder="Summer 2026 promotion"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-sm font-bold hover:bg-white/5 transition-all">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 text-white text-sm font-bold hover:from-amber-500 transition-all disabled:opacity-50">
                  {submitting ? 'Creating…' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          <RefreshCw size={16} className="animate-spin mr-2" /> Loading promo codes…
        </div>
      ) : codes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Tag size={40} className="mb-3 opacity-30" />
          <p className="font-bold">No promo codes yet</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-amber-400 hover:underline">Create your first code →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {codes.map((code) => {
            const isExpired = new Date(code.expiresAt) < new Date();
            const usagePercent = code.maxUses ? Math.min(100, Math.round((code._count.usage / code.maxUses) * 100)) : 0;
            const displayDiscount = code.discountType === 'FIXED_AMOUNT' ? `$${code.discountAmount ?? code.discount}` : `${code.discount}%`;

            return (
              <div key={code.id} className={`p-5 rounded-2xl border bg-white/[0.02] space-y-4 transition-all ${code.isActive && !isExpired ? 'border-amber-500/20' : 'border-white/5 opacity-60'}`}>
                {/* Code header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-white tracking-widest">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-gray-500 hover:text-amber-400 transition-colors">
                        <Copy size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{code.description || 'No description'}</p>
                  </div>
                  <div className="text-2xl font-black text-amber-400">{displayDiscount}</div>
                </div>

                {/* Additional constraints badge */}
                {(code.minOrderAmount || code.maxDiscountAmount) && (
                  <div className="flex flex-wrap gap-1 text-[11px] text-gray-400">
                    {code.minOrderAmount && <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Min order: ${code.minOrderAmount}</span>}
                    {code.maxDiscountAmount && <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">Max cap: ${code.maxDiscountAmount}</span>}
                  </div>
                )}

                {/* Usage bar */}
                {code.maxUses && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{code._count.usage} used</span>
                      <span>{code.maxUses} max</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full" style={{ width: `${usagePercent}%` }} />
                    </div>
                  </div>
                )}
                {!code.maxUses && (
                  <p className="text-xs text-gray-400">{code._count.usage} uses · Unlimited</p>
                )}

                {/* Expiry & status */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500">Expires</p>
                    <p className={`text-xs font-bold ${isExpired ? 'text-rose-400' : 'text-gray-300'}`}>
                      {new Date(code.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {isExpired && ' (Expired)'}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActive(code.id, code.isActive)}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      code.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {code.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {code.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
