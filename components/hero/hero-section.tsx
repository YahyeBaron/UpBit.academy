'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import './cathode.css';

const CathodeScene = dynamic(() => import('./cathode-scene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ backgroundColor: '#05080f' }}>
      <div className="w-10 h-10 rounded-full border border-blue-500/25 border-t-blue-400/70 animate-spin" />
    </div>
  )
});

const NAV_LINKS = [
  { label: 'Catalog',     href: '/courses' },
  { label: 'Roadmap',     href: '/roadmap' },
  { label: 'Instructors', href: '/instructors' },
];

export default function HeroSection() {
  const { isSignedIn, isLoaded } = useUser();

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="cathode-container" aria-label="EraySame Tech Academy">
      {/* WebGL CRT scene */}
      <CathodeScene />

      {/* ── Overlay ── */}
      <div className="cathode-ui">

        {/* ── Top bar ── */}
        <header className="cathode-bar">
          <Link href="/" className="cathode-brand" aria-label="EraySame home">
            <Image
              src="/assets/logo-eraysame-transparent.png"
              alt="EraySame logo"
              width={36}
              height={36}
              className="object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              priority
            />
            <div className="cathode-wordmark">
              <span className="cathode-wordmark-name">EraySame</span>
              <span className="cathode-wordmark-sub">Tech Academy</span>
            </div>
          </Link>

          <nav className="cathode-pill" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} className="cathode-pill-link">
                {label}
              </Link>
            ))}
          </nav>

          <div className="cathode-auth-row">
            {isLoaded && isSignedIn ? (
              <Link href="/dashboard" className="cathode-ghost-btn">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="cathode-ghost-btn">Sign in</Link>
                <Link href="/signup" className="cathode-join-btn">
                  Join free
                  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="cathode-btn-arrow">
                    <path d="M1.5 6h9M6.8 2.2 10.6 6l-3.8 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* ── Hero copy — RIGHT side, vertically centred ── */}
        <div className="cathode-copy">

          {/* Eyebrow */}
          <p className="cathode-eyebrow">
            <span className="cathode-eyebrow-dot" aria-hidden="true" />
            Production curriculum · 2026
          </p>

          {/* Headline — big, confident, single idea */}
          <h1 className="cathode-headline">
            <span className="cathode-headline-line1">Ship real code.</span>
            <span className="cathode-headline-line2">Get hired.</span>
          </h1>

          {/* One tight subline */}
          <p className="cathode-sub">
            Hands-on courses that take you from fundamentals to
            full-stack production — no filler, no fluff.
          </p>

          {/* Single primary CTA */}
          <a href="#courses" className="cathode-cta" onClick={(e) => scrollTo(e, 'courses')}>
            Browse courses
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true" className="cathode-btn-arrow">
              <path d="M1.5 6h9M6.8 2.2 10.6 6l-3.8 3.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          {/* Micro trust line */}
          <p className="cathode-footnote">14-day guarantee &nbsp;·&nbsp; Lifetime access &nbsp;·&nbsp; Real projects</p>
        </div>

        {/* Bottom hint */}
        <div className="cathode-foot">
          <span className="cathode-hint" />
        </div>
      </div>

      {/* Bottom gradient into page */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to top, #05080f 0%, transparent 100%)' }}
      />
    </section>
  );
}
