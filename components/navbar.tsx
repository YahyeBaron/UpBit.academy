'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/logo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useUser();

  const isHome = pathname === '/';
  const isCourses = pathname.startsWith('/courses');
  const isRoadmap = pathname.startsWith('/roadmap');
  const isBlog = pathname.startsWith('/blog') || pathname.includes('#blog');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: isHome ? '#header' : '/', label: 'Home', active: isHome },
    { href: isHome ? '#courses' : '/courses', label: 'Category', active: isCourses },
    { href: isHome ? '#roadmap' : '/roadmap', label: 'Roadmap', active: isRoadmap },
    { href: isHome ? '#blog' : '/#blog', label: 'Blog & Insights', active: isBlog },
  ];

  return (
    <>
      {/* ============================================================
          Single Continuous Floating Sticky Pill Navbar
          Fixed at top: 1rem, centered, 90% width (max 1280px),
          pill border-radius, dark semi-transparent glassmorphic blur.
          ============================================================ */}
      <header
        role="banner"
        className="site-floating-nav"
        style={{
          backgroundColor: scrolled ? 'rgba(12, 9, 20, 0.94)' : 'rgba(16, 12, 24, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          boxShadow: scrolled
            ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
            : '0 10px 32px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          padding: '7px 12px 7px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          aria-label="UpBit Academy Home"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Logo imageSize={32} />
        </Link>

        {/* Navigation Links - Visible on desktop (lg+), transparent background, active purple badge */}
        <nav
          role="navigation"
          aria-label="Primary"
          className="hidden lg:flex items-center gap-3.5 mx-4 bg-transparent border-0 p-0"
        >
          {navLinks.map((item) => {
            if (item.active) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: 'rgba(88, 28, 92, 0.55)',
                    border: '1px solid rgba(168, 85, 247, 0.22)',
                    borderRadius: '9999px',
                    padding: '6px 18px',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.72)',
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  padding: '6px 12px',
                  transition: 'color 0.2s ease',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.2,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.72)';
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons & Circular Phone Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

          {/* Button 1: Download FDE Jobs Report (Black #0D0D0D, 1px #444 border, 10px chamfered corners, desktop xl+) */}
          <div
            className="hidden xl:inline-flex items-center justify-center p-[1px] bg-[#444444] transition-colors hover:bg-[#666666]"
            style={{
              position: 'relative',
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              WebkitClipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
            }}
          >
            <a
              href={isHome ? '#modal-aim-report' : '/#header'}
              data-modal-trigger="modal-aim-report"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '9px 18px',
                backgroundColor: '#0D0D0D',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                clipPath: 'polygon(9.5px 0, 100% 0, 100% calc(100% - 9.5px), calc(100% - 9.5px) 100%, 0 100%, 0 9.5px)',
                WebkitClipPath: 'polygon(9.5px 0, 100% 0, 100% calc(100% - 9.5px), calc(100% - 9.5px) 100%, 0 100%, 0 9.5px)',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#181818'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0D0D0D'; }}
            >
              Download FDE Jobs Report
            </a>
          </div>

          {/* Button 2: Apply Now -> (Pink/Purple gradient background, bold white text, 10px chamfered corners, visible sm+) */}
          {isLoaded && isSignedIn ? (
            <div className="hidden sm:inline-flex items-center gap-2.5">
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '9px 20px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                  WebkitClipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                }}
              >
                Dashboard
              </Link>
              <ClerkLoaded>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: '36px',
                        height: '36px',
                        border: '2px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '50%',
                      },
                    },
                  }}
                />
              </ClerkLoaded>
              <ClerkLoading>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              </ClerkLoading>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center cursor-pointer transition-all hover:brightness-110 active:translate-y-0"
              style={{
                padding: '9px 22px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                WebkitClipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              }}
            >
              Apply Now &rarr;
            </Link>
          )}

          {/* Button 3: Vibrant Pink Circular Phone Icon Button (Always visible on all screens) */}
          <a
            href="tel:+252634718722"
            data-modal-trigger="modal-contact"
            aria-label="Call UpBit Academy"
            title="Call Us: +252 63 4718722"
            className="inline-flex items-center justify-center cursor-pointer flex-shrink-0 transition-transform duration-200 hover:scale-105"
            style={{
              width: '40px',
              minWidth: '40px',
              height: '40px',
              minHeight: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.45)',
              textDecoration: 'none',
              border: 'none',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: 'block' }}
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>

          {/* Mobile Hamburger Button (Visible on screens < lg) */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex lg:hidden items-center justify-center p-2 rounded-full text-white hover:bg-white/10 transition-colors border-0 bg-transparent cursor-pointer"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isOpen}
          >
            <img
              src={isOpen ? '/assets/images/6adafc8ee717813214025d60_Cross.svg' : '/assets/images/6adafc8e60841bdf28c2d4f4_Icon.svg'}
              alt=""
              style={{ width: '24px', height: '24px', display: 'block' }}
            />
          </button>

        </div>
      </header>

      {/* Mobile Dropdown Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '5.2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '1280px',
              zIndex: 999,
              backgroundColor: 'rgba(12, 9, 20, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {navLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    color: item.active ? '#ffffff' : '#9ca3af',
                    textDecoration: 'none',
                    fontSize: '1.05rem',
                    fontFamily: 'Space Grotesk, sans-serif',
                    fontWeight: item.active ? 700 : 500,
                  }}
                >
                  <span>{item.label}</span>
                  {item.active && (
                    <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '9999px', background: 'rgba(168,85,247,0.3)', color: '#fff' }}>
                      Current
                    </span>
                  )}
                </Link>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <a
                  href={isHome ? '#modal-aim-report' : '/#header'}
                  data-modal-trigger="modal-aim-report"
                  onClick={() => setIsOpen(false)}
                  style={{
                    textAlign: 'center',
                    textDecoration: 'none',
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#0D0D0D',
                    border: '1px solid #444',
                    color: '#ffffff',
                    fontWeight: 600,
                    clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                  }}
                >
                  Download FDE Jobs Report
                </a>

                {isLoaded && isSignedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    style={{
                      textAlign: 'center',
                      textDecoration: 'none',
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      fontWeight: 700,
                      clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                    }}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    style={{
                      textAlign: 'center',
                      textDecoration: 'none',
                      width: '100%',
                      padding: '12px',
                      background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                    }}
                  >
                    Apply Now &rarr;
                  </Link>
                )}

                <a
                  href="tel:+252634718722"
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: 'Space Grotesk, sans-serif',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>Call Us (+252 63 4718722)</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
