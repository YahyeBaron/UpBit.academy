'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { COURSES, Course } from '@/lib/data';
import {
  ShieldCheck,
  Lock,
  Check,
  Loader2,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star,
  BookOpen,
  Clock,
  ExternalLink,
  User,
  UserCheck,
  Sparkles,
} from 'lucide-react';

// ─── Root page (Suspense wrapper) ─────────────────────────────────────────────
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020813] flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 size={16} className="animate-spin text-blue-400" />
          Loading checkout...
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

// ─── Main Checkout Content ────────────────────────────────────────────────────
function CheckoutContent() {
  const searchParams = useSearchParams();
  const courseSlugParam = searchParams?.get('course') || searchParams?.get('courseSlug');
  const isCancelled = searchParams?.get('cancelled') === 'true';

  // Strict initial course resolution: NEVER unconditionally default to COURSES[0]!
  const initialCourse = courseSlugParam
    ? COURSES.find((c) => c.slug === courseSlugParam) || null
    : null;

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(initialCourse);
  const [courseNotFound, setCourseNotFound] = useState(false);
  const [priceLoading, setPriceLoading] = useState(Boolean(courseSlugParam));

  // Fetch fresh database course & price
  useEffect(() => {
    if (!courseSlugParam) {
      setPriceLoading(false);
      return;
    }

    let alive = true;
    setPriceLoading(true);

    fetch(`/api/courses/${encodeURIComponent(courseSlugParam)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d?.course) {
          setSelectedCourse(d.course);
          setCourseNotFound(false);
        } else {
          const staticMatch = COURSES.find((c) => c.slug === courseSlugParam);
          if (staticMatch) {
            setSelectedCourse(staticMatch);
            setCourseNotFound(false);
          } else {
            setCourseNotFound(true);
          }
        }
      })
      .catch(() => {
        if (!alive) return;
        const staticMatch = COURSES.find((c) => c.slug === courseSlugParam);
        if (staticMatch) {
          setSelectedCourse(staticMatch);
          setCourseNotFound(false);
        } else {
          setCourseNotFound(true);
        }
      })
      .finally(() => {
        if (alive) setPriceLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [courseSlugParam]);

  // Already-enrolled guard: ONLY check for the requested course once it has safely loaded
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  useEffect(() => {
    if (!selectedCourse?.slug) return;
    // Guard against race conditions: verify selected course matches the target slug
    if (courseSlugParam && selectedCourse.slug !== courseSlugParam) return;

    fetch(`/api/enroll?courseId=${encodeURIComponent(selectedCourse.slug)}`)
      .then((r) => r.json())
      .then((d) => {
        // d.isEnrolled is now strict (does not grant enrolled status to un-enrolled admins)
        if (d?.isEnrolled) setIsAlreadyEnrolled(true);
      })
      .catch(() => {});
  }, [selectedCourse?.slug, courseSlugParam]);

  // Coupon
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCouponInfo, setAppliedCouponInfo] = useState('');

  const finalPrice = Math.max(0, (selectedCourse?.price ?? 0) - discount);

  const applyCoupon = async () => {
    if (!selectedCourse) return;
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    setCouponError('');

    try {
      const res = await fetch('/api/checkout/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          courseSlug: selectedCourse.slug,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.isValid) {
        setCouponError(data.error || 'Invalid or expired coupon code.');
        setCouponApplied(false);
        setDiscount(0);
        setAppliedCouponInfo('');
      } else {
        setDiscount(data.calculatedDiscount ?? 0);
        setCouponApplied(true);
        setCouponError('');
        const infoText = data.discountType === 'PERCENTAGE'
          ? `${data.discountValue}% discount applied`
          : `$${data.calculatedDiscount.toFixed(2)} discount applied`;
        setAppliedCouponInfo(infoText);
      }
    } catch {
      setCouponError('Error validating promo code. Please try again.');
      setCouponApplied(false);
      setDiscount(0);
      setAppliedCouponInfo('');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();

  // Checkout
  const [isLoading, setIsLoading] = useState(false);

  const handleOrder = async () => {
    if (!selectedCourse) return;

    // If user is loaded and not signed in, smoothly redirect to login with return URL preserved
    if (isLoaded && !isSignedIn) {
      const returnUrl = typeof window !== 'undefined'
        ? window.location.pathname + window.location.search
        : `/checkout?course=${selectedCourse.slug}`;
      router.push(`/login?redirect_url=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setIsLoading(true);

    // Free course enrollment (price is $0 or 100% discount applied)
    // Server-authoritative quote handles zero-value orders safely
    if (finalPrice === 0) {
      try {
        const res = await fetch('/api/checkout/sifalo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'DIRECT_PAY',
            courseSlug: selectedCourse.slug,
            promoCode: coupon.trim() || undefined,
            channel: 'PROMO_FREE',
          }),
        });
        const data = await res.json();
        if (data?.success && data?.redirectUrl) {
          router.push(data.redirectUrl);
          return;
        } else if (data?.success) {
          router.push(`/courses/${selectedCourse.slug}/learn`);
          return;
        } else {
          alert(data?.error || 'Could not complete free enrollment.');
        }
      } catch {
        alert('Network error completing free enrollment. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/checkout/sifalo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'HOSTED_CHECKOUT',
          courseSlug: selectedCourse.slug,
          promoCode: coupon.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data?.success && data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(data?.error || 'Could not start checkout. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── No Course Selected / Course Not Found State ─────────────────────────────
  if (!courseSlugParam || (courseNotFound && !selectedCourse && !priceLoading)) {
    return (
      <div className="min-h-screen bg-[#020813] text-white font-sans">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto">
              <BookOpen size={28} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">No Course Selected</h2>
              <p className="text-sm text-gray-400 mt-2">
                {courseNotFound
                  ? `The requested course "${courseSlugParam}" could not be found.`
                  : 'Please select a course from our catalog to proceed with checkout.'}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-black font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-blue-500/30"
              >
                Browse Course Catalog <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Loading Skeleton ────────────────────────────────────────────────────────
  if (priceLoading && !selectedCourse) {
    return (
      <div className="min-h-screen bg-[#020813] text-white font-sans">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <Loader2 size={20} className="animate-spin text-blue-400" />
            Loading course details...
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── Already enrolled ──────────────────────────────────────────────────────
  if (isAlreadyEnrolled && selectedCourse) {
    return (
      <div className="min-h-screen bg-[#020813] text-white font-sans">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Already Enrolled!</h2>
              <p className="text-sm text-gray-400 mt-2">
                You already have full access to <strong className="text-white">{selectedCourse.title}</strong>. No need to pay again.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href={`/courses/${selectedCourse.slug}/learn`}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-black text-sm hover:opacity-90 transition-all shadow-xl shadow-emerald-500/30"
              >
                <PlayCircle size={18} /> Continue Learning
              </Link>
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!selectedCourse) return null;

  // ─── Main checkout ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-[#4d65ff] selection:text-white">
      <Navbar />

      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030d20] via-[#020813] to-[#020813]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.12),transparent_70%)]" />

        <div className="relative max-w-lg mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="text-center mb-7">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-400 font-bold mb-4">
              <Lock size={10} /> SSL 256-Bit Encrypted Checkout
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Complete Your Enrollment
            </h1>
            <p className="text-xs text-gray-400 mt-1.5">Review your order, then proceed to finalize enrollment.</p>
          </div>

          {/* Cancellation Alert Callout */}
          {isCancelled && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
              <AlertCircle size={18} className="text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Payment Not Completed</p>
                <p className="text-[11px] text-amber-200/80">Your previous transaction was cancelled or not completed. You can retry below.</p>
              </div>
            </div>
          )}

          {/* Sign In Required Callout */}
          {isLoaded && !isSignedIn && (
            <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-blue-200">
                <User size={18} className="text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Sign in required to enroll</p>
                  <p className="text-[11px] text-gray-300">Your course progress and certificates will be saved to your account.</p>
                </div>
              </div>
              <Link
                href={`/login?redirect_url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/checkout?course=${selectedCourse.slug}`)}`}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] hover:opacity-90 text-white font-bold text-xs text-center shrink-0 transition-all shadow-md shadow-[#4d65ff]/20"
              >
                Sign In / Sign Up
              </Link>
            </div>
          )}

          {/* Authenticated User Account Indicator */}
          {isLoaded && isSignedIn && (
            <div className="mb-6 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <UserCheck size={14} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Enrolling As</span>
                  <span className="font-semibold text-white truncate block">
                    {user?.primaryEmailAddress?.emailAddress || user?.fullName || 'Active Learner'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                Authenticated
              </span>
            </div>
          )}

          {/* Order Summary Card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">

            {/* Course thumbnail + info */}
            <div className="relative">
              <div className="relative w-full h-32 overflow-hidden">
                <Image
                  src={selectedCourse.image || '/assets/w-rc.jpg'}
                  alt={selectedCourse.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020813] via-[#020813]/60 to-transparent" />
                {/* Category badge */}
                <span className="absolute top-4 left-4 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-blue-300 border border-white/10 uppercase tracking-wider">
                  {selectedCourse.category}
                </span>
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/10 backdrop-blur-md text-gray-200 border border-white/10">
                  {selectedCourse.level}
                </span>
              </div>

              {/* Overlapping course details */}
              <div className="px-5 pt-3 pb-1">
                <h2 className="text-base font-black text-white leading-tight">{selectedCourse.title}</h2>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{selectedCourse.tagline}</p>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <Star size={12} className="fill-amber-400" /> {selectedCourse.rating} ({selectedCourse.reviews} reviews)
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> {selectedCourse.totalLessons} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {selectedCourse.duration}
                  </span>
                </div>

                {/* Includes pills */}
                {selectedCourse.includes && selectedCourse.includes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedCourse.includes.slice(0, 3).map((inc) => (
                      <span key={inc} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-300 font-medium">
                        <Check size={9} /> {inc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 space-y-4 mt-1">

              {/* Coupon */}
              <div className="pt-4 border-t border-white/8">
                <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                  Have a coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-blue-500/50 transition-colors"
                    disabled={couponApplied}
                  />
                  {couponApplied ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponApplied(false);
                        setDiscount(0);
                        setCoupon('');
                        setAppliedCouponInfo('');
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={validatingCoupon || !coupon.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-[#4d65ff]/20"
                    >
                      {validatingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                    </button>
                  )}
                </div>
                {couponError && (
                  <p className="text-[11px] text-red-400 mt-1.5 flex items-center gap-1">
                    <span>✕</span> {couponError}
                  </p>
                )}
                {couponApplied && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                    <Sparkles size={11} /> {appliedCouponInfo}
                  </p>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-2 pt-3 border-t border-white/8 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Course Price</span>
                  <span className="text-white font-medium">
                    {priceLoading ? (
                      <span className="inline-block w-12 h-3.5 bg-white/10 rounded animate-pulse" />
                    ) : (
                      `$${selectedCourse.price}`
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-medium">
                    <span>Discount Applied</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Processing Fee</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-white pt-2.5 border-t border-white/10">
                  <span>Total Amount</span>
                  <span className="text-lg text-emerald-400 font-extrabold font-mono">
                    {priceLoading ? (
                      <span className="inline-block w-14 h-5 bg-white/10 rounded animate-pulse" />
                    ) : (
                      `$${finalPrice.toFixed(2)} USD`
                    )}
                  </span>
                </div>
              </div>

              {/* Payment Method Notice */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sifalo Pay (ZAAD / Sahal / EVC Plus)</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Instant Access
                </span>
              </div>

              {/* Submit CTA */}
              <button
                type="button"
                id="checkout-order-btn"
                onClick={handleOrder}
                disabled={isLoading || priceLoading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-black font-extrabold text-sm transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Connecting to Payment Gateway…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    {finalPrice === 0 ? 'Enroll for Free Now' : `Pay $${finalPrice.toFixed(2)} & Start Learning`}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Security badges */}
              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 pt-1">
                <span className="flex items-center gap-1"><ShieldCheck size={11} /> 30-Day Guarantee</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Lock size={11} /> 256-Bit Encryption</span>
                <span>•</span>
                <span>Lifetime Access</span>
              </div>

            </div>
          </div>

          {/* Guarantee card */}
          <div className="mt-5 p-4 rounded-2xl border border-white/6 bg-white/[0.02] flex items-center gap-3 text-xs text-gray-400">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-blue-400" />
            </div>
            <div>
              <span className="font-semibold text-white block">100% Risk-Free Guarantee</span>
              <span className="text-[11px] text-gray-400">Not satisfied? Get a full refund within 30 days. No questions asked.</span>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
