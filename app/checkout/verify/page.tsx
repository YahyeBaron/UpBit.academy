'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

export default function CheckoutVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020813] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

type VerifyState = 'loading' | 'success' | 'pending' | 'error';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const sid         = searchParams?.get('sid')        || '';
  const orderId     = searchParams?.get('order_id')   || searchParams?.get('orderId') || '';
  const courseSlug  = searchParams?.get('courseSlug') || searchParams?.get('course')  || '';
  const statusParam = (searchParams?.get('status')    || '').toLowerCase();
  const isCancelled = searchParams?.get('cancelled') === 'true' || statusParam === 'cancelled' || statusParam === 'failed' || statusParam === 'error';

  // Derive initial state synchronously — avoids a synchronous setState inside useEffect
  const initialError = isCancelled
    ? 'Payment was not completed or was cancelled. Your account has not been charged.'
    : (!sid && !orderId)
    ? 'Missing payment reference. Could not verify this transaction.'
    : '';

  const [state, setState] = useState<VerifyState>(initialError ? 'error' : 'loading');
  const [receipt, setReceipt] = useState<{
    sid: string;
    amount: string;
    paymentType: string;
    account: string;
    courseSlug: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState(initialError);

  // Explicit back-to-checkout destination preserving course state
  const backToCheckoutUrl = courseSlug
    ? `/checkout?course=${encodeURIComponent(courseSlug)}&cancelled=true`
    : '/courses';

  useEffect(() => {
    // Skip verification if we already know there's an error from initial state
    if (initialError) return;

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyPayment = async () => {
    setState('loading');
    try {
      // POST VERIFY action strictly validates the existing order on server
      const res = await fetch('/api/checkout/sifalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY',
          courseSlug: courseSlug,
          sid: sid || orderId,
          orderId: orderId,
        }),
      });

      const data = await res.json();

      if (data?.success) {
        setReceipt({
          sid: data.sid || sid || orderId,
          amount: String(data.amount || '—'),
          paymentType: data.channel || 'Sifalo Pay',
          account: data.account || '—',
          courseSlug: data.courseSlug || courseSlug,
        });
        setState('success');

        const destinationSlug = data.courseSlug || courseSlug;
        if (destinationSlug) {
          setTimeout(() => {
            router.push(`/courses/${destinationSlug}/learn`);
          }, 5000);
        }
      } else if (data?.status === 'pending') {
        setState('pending');
      } else {
        setState('error');
        setErrorMsg(data?.error || 'Payment was not approved or verification failed.');
      }
    } catch (err) {
      console.error('Verify page error:', err);
      setState('error');
      setErrorMsg('Network error while verifying payment. Please try refreshing the page or returning to checkout.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020813] text-white font-sans">
      <Navbar />

      <section className="flex items-center justify-center min-h-[85vh] px-4">

        {/* ── LOADING ── */}
        {state === 'loading' && (
          <div className="max-w-sm w-full text-center space-y-4 p-8 rounded-3xl border border-blue-500/20 bg-[#040e1a]">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 size={28} className="animate-spin text-blue-400" />
            </div>
            <h2 className="text-xl font-black text-white">Verifying Payment…</h2>
            <p className="text-xs text-gray-400">Please wait while we confirm your transaction with Sifalo Pay.</p>
            <div className="flex items-center justify-center gap-1.5">
              {['Order Reference:', sid || orderId].map((t, i) => (
                <span key={i} className={i === 0 ? 'text-xs text-gray-500' : 'text-xs font-mono text-cyan-300'}>{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {state === 'success' && receipt && (
          <div className="max-w-md w-full space-y-6 p-8 rounded-3xl border border-emerald-500/30 bg-[#030d10] text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                ✓ Payment Confirmed
              </span>
              <h2 className="text-2xl font-black text-white">You're Enrolled!</h2>
              <p className="text-sm text-gray-400">
                Your Sifalo Pay transaction was successful. You now have full lifetime access.
              </p>
            </div>

            {/* Receipt */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 font-mono text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Transaction ID:</span>
                <span className="text-cyan-300">{receipt.sid}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Payment Method:</span>
                <span className="text-white">{receipt.paymentType}</span>
              </div>
              {receipt.account !== '—' && (
                <div className="flex justify-between text-gray-400">
                  <span>Account:</span>
                  <span className="text-white">{receipt.account}</span>
                </div>
              )}
              {receipt.amount !== '—' && (
                <div className="flex justify-between text-gray-400 border-t border-white/10 pt-2">
                  <span>Amount Paid:</span>
                  <span className="text-emerald-400 font-bold">${receipt.amount} USD</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Redirecting you to the course in 5 seconds…
            </p>

            <div className="flex flex-col gap-3">
              {receipt.courseSlug && (
                <Link
                  href={`/courses/${receipt.courseSlug}/learn`}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-extrabold text-sm hover:opacity-90 transition-all shadow-xl shadow-emerald-500/30"
                >
                  Start Learning Now <ArrowRight size={18} />
                </Link>
              )}
              <Link href="/dashboard" className="flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                <LayoutDashboard size={13} /> My Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── PENDING ── */}
        {state === 'pending' && (
          <div className="max-w-sm w-full text-center space-y-5 p-8 rounded-3xl border border-amber-500/30 bg-[#0d0a02]">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Loader2 size={28} className="text-amber-400 animate-spin" />
            </div>
            <h2 className="text-xl font-black text-white">Payment Pending</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your payment is still being processed by Sifalo Pay. This can take a few minutes.
            </p>
            <p className="text-xs text-gray-500 font-mono">
              Reference: {sid || orderId || '—'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={verifyPayment}
                className="flex items-center justify-center gap-2 w-full py-3 px-6 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-bold hover:bg-amber-500/30 transition-colors"
              >
                <Loader2 size={16} className="animate-spin" /> Retry Verification
              </button>
              <Link href={backToCheckoutUrl} className="text-xs text-gray-500 hover:text-white transition-colors">
                ← Back to Checkout
              </Link>
              <Link href="/dashboard" className="text-xs text-gray-500 hover:text-white transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {state === 'error' && (
          <div className="max-w-sm w-full text-center space-y-5 p-8 rounded-3xl border border-red-500/30 bg-[#0d0203]">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-black text-white">Verification Failed</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{errorMsg}</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={verifyPayment}
                className="w-full py-3 px-6 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-bold hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
              <Link href={backToCheckoutUrl} className="text-xs text-gray-400 hover:text-white transition-colors">
                ← Back to Checkout
              </Link>
            </div>
          </div>
        )}

      </section>

      <Footer />
    </div>
  );
}
