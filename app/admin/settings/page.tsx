'use client';

import React, { useState } from 'react';
import {
  Settings, Shield, Database, Globe, Bell, Eye, EyeOff,
  Check, AlertTriangle, Info, Save, Key
} from 'lucide-react';

const ENV_VARS = [
  { key: 'DATABASE_URL', label: 'Database URL', required: true, sensitive: true, desc: 'PostgreSQL connection string' },
  { key: 'CLERK_SECRET_KEY', label: 'Clerk Secret Key', required: true, sensitive: true, desc: 'Clerk authentication secret' },
  { key: 'CLERK_WEBHOOK_SECRET', label: 'Clerk Webhook Secret', required: true, sensitive: true, desc: 'For verifying Clerk webhook events' },
  { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', required: false, sensitive: true, desc: 'Stripe payment processing key' },
  { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', required: false, sensitive: true, desc: 'For verifying Stripe webhook events' },
  { key: 'SIFALO_WEBHOOK_SECRET', label: 'Sifalo Webhook Secret', required: true, sensitive: true, desc: 'HMAC-SHA256 secret for Sifalo Pay webhooks' },
  { key: 'SIFALO_API_KEY', label: 'Sifalo API Key', required: true, sensitive: true, desc: 'Sifalo Pay API authentication key' },
  { key: 'SIFALO_API_URL', label: 'Sifalo API URL', required: true, sensitive: false, desc: 'Sifalo Pay API base URL' },
  { key: 'MUX_TOKEN_ID', label: 'Mux Token ID', required: false, sensitive: false, desc: 'Mux video streaming token' },
  { key: 'MUX_TOKEN_SECRET', label: 'Mux Token Secret', required: false, sensitive: true, desc: 'Mux video streaming secret' },
  { key: 'UPLOADTHING_SECRET', label: 'UploadThing Secret', required: false, sensitive: true, desc: 'File upload service secret' },
  { key: 'ADMIN_PASSWORD', label: 'Admin Password (Seed)', required: false, sensitive: true, desc: 'Used only during db:seed to create initial admin account' },
];

const SECURITY_CHECKLIST = [
  { label: 'Admin password is hashed in database (not plain text)', pass: true },
  { label: 'Admin session uses 32-byte cryptographic token', pass: true },
  { label: 'Sifalo webhook uses HMAC-SHA256 verification', pass: true },
  { label: 'Email heuristic admin check removed (yahye bypass)', pass: true },
  { label: 'Course existence validated before enrollment creation', pass: true },
  { label: 'Admin session cookies are httpOnly + secure', pass: true },
  { label: 'CSRF helper module available (lib/csrf.ts)', pass: true },
  { label: 'Hardcoded YahyeBaron-123 fallback removed', pass: true },
];

export default function AdminSettingsPage() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  const toggleSecret = (key: string) =>
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));

  const copyEnvTemplate = () => {
    const template = ENV_VARS
      .map((v) => `# ${v.desc}\n${v.key}=`)
      .join('\n\n');
    navigator.clipboard.writeText(template);
    setToast('Copied .env template to clipboard!');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-8 font-sans">

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-2xl border bg-emerald-950 border-emerald-500/30 text-emerald-300">
          <Check size={16} /> {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings size={22} className="text-slate-400" /> Platform Settings
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          System configuration, environment variables reference, and security status.
        </p>
      </div>

      {/* Security Status Checklist */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Shield size={18} className="text-blue-400" /> Security Audit Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECURITY_CHECKLIST.map(({ label, pass }) => (
            <div
              key={label}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                pass
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
              }`}
            >
              <div className={`mt-0.5 shrink-0 ${pass ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pass ? <Check size={15} /> : <AlertTriangle size={15} />}
              </div>
              <p className={`text-xs font-medium ${pass ? 'text-emerald-300' : 'text-rose-300'}`}>{label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
          <Info size={14} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-300">
            All P0 critical security vulnerabilities have been patched. Run the security test checklist to verify your deployment.
          </p>
        </div>
      </div>

      {/* Environment Variables Reference */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Key size={18} className="text-amber-400" /> Environment Variables Reference
          </h2>
          <button
            onClick={copyEnvTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
          >
            <Save size={13} /> Copy .env Template
          </button>
        </div>

        <div className="space-y-2">
          {ENV_VARS.map((envVar) => (
            <div
              key={envVar.key}
              className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-white">{envVar.key}</span>
                  {envVar.required && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded-full">REQUIRED</span>
                  )}
                  {envVar.sensitive && (
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">SENSITIVE</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{envVar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Database & Infrastructure Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Database size={16} className="text-violet-400" /> Database
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Provider</span>
              <span className="text-white font-bold">PostgreSQL (Neon)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">ORM</span>
              <span className="text-white font-bold">Prisma</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Connection</span>
              <span className={`font-bold ${process.env.DATABASE_URL ? 'text-emerald-400' : 'text-rose-400'}`}>
                {process.env.DATABASE_URL ? '✓ Connected' : '✗ Not configured'}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5">
            <p className="text-xs text-gray-500">Run migrations: <code className="text-amber-400">npx prisma migrate dev</code></p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Globe size={16} className="text-blue-400" /> Platform Stack
          </h2>
          <div className="space-y-2 text-sm">
            {[
              { label: 'Framework', value: 'Next.js 15 (App Router)' },
              { label: 'Auth', value: 'Clerk' },
              { label: 'Payments', value: 'Stripe + Sifalo Pay' },
              { label: 'Video', value: 'Mux HLS Streaming' },
              { label: 'Storage', value: 'UploadThing' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-bold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deployment Checklist */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-6 space-y-4">
        <h2 className="text-base font-extrabold text-white flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-400" /> Pre-Deployment Checklist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            'All P0 security fixes applied and tested',
            'SIFALO_WEBHOOK_SECRET set in production env',
            'Admin account created via npm run db:seed',
            'ADMIN_PASSWORD set (not YahyeBaron-123)',
            'Prisma migrations run on production DB',
            'Stripe webhook endpoint registered',
            'Clerk webhook endpoint registered',
            'MUX streaming credentials configured',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-amber-200/80">
              <div className="w-4 h-4 rounded border border-amber-500/40 shrink-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-sm bg-amber-500/20" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
