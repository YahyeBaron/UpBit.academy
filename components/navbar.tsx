'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';

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
      setScrolled(window.scrollY > 20);
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
      {/* Continuous Single Floating Pill Navbar */}
      <header
        role="banner"
        style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '1280px',
          zIndex: 99999,
          backgroundColor: scrolled ? 'rgba(11, 8, 18, 0.88)' : 'rgba(16, 12, 24, 0.76)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '9999px',
          boxShadow: scrolled
            ? '0 16px 40px -10px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08) inset'
            : '0 10px 30px -8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset',
          padding: '8px 12px 8px 24px',
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
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/images/logo-white.png"
            alt="UpBit Academy"
            style={{ height: '38px', width: 'auto', display: 'block', objectFit: 'contain' }}
          />
          <span
            className="font-space-grotesk"
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            UpBit Academy
          </span>
        </Link>

        {/* Desktop Navigation Links — Sitting directly on pill wrapper with no inner background blocks */}
        <nav
          role="navigation"
          className="hide-tablet"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            margin: '0 16px',
          }}
        >
          {navLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              style={{
                textDecoration: 'none',
                fontSize: '0.925rem',
                fontWeight: item.active ? 600 : 500,
                color: item.active ? '#ffffff' : '#d1d5db',
                padding: item.active ? '7px 18px' : '7px 10px',
                borderRadius: item.active ? '9999px' : '0',
                backgroundColor: item.active ? 'rgba(168, 85, 247, 0.22)' : 'transparent',
                border: item.active ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
                transition: 'color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!item.active) e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                if (!item.active) e.currentTarget.style.color = '#d1d5db';
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Buttons & Circular Phone Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          
          {/* Button 1: Download FDE Jobs Report (Black background #0D0D0D, 1px #444 border, 10px chamfered corners) */}
          <div
            className="hide-tablet"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px',
              backgroundColor: '#444444',
              clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              WebkitClipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#666666'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#444444'; }}
          >
            <a
              href={isHome ? '#modal-aim-report' : '/#header'}
              data-modal-trigger="modal-aim-report"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 20px',
                backgroundColor: '#0D0D0D',
                color: '#ffffff',
                fontSize: '0.875rem',
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

          {/* Button 2: Apply Now -> (Pink/Purple gradient background, bold white text, 10px chamfered corners) */}
          {isLoaded && isSignedIn ? (
            <div className="hide-tablet" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 22px',
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontSize: '0.875rem',
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
                        width: '38px',
                        height: '38px',
                        border: '2px solid rgba(168, 85, 247, 0.5)',
                        borderRadius: '50%',
                      },
                    },
                  }}
                />
              </ClerkLoaded>
              <ClerkLoading>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              </ClerkLoading>
            </div>
          ) : (
            <Link
              href="/login"
              className="hide-tablet"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                WebkitClipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
                cursor: 'pointer',
                transition: 'filter 0.2s ease, transform 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'brightness(1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Apply Now &rarr;
            </Link>
          )}

          {/* Button 3: Vibrant Pink Circular Phone Icon Button */}
          <a
            href="tel:+252634718722"
            data-modal-trigger="modal-contact"
            className="hide-tablet"
            aria-label="Call UpBit Academy"
            title="Call Us: +252 63 4718722"
            style={{
              width: '42px',
              minWidth: '42px',
              height: '42px',
              minHeight: '42px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 16px rgba(236, 72, 153, 0.45)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              textDecoration: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 6px 22px rgba(236, 72, 153, 0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(236, 72, 153, 0.45)';
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
              viewBox="0 0 21 21"
              fill="none"
              style={{ display: 'block' }}
            >
              <path
                d="M15.6382 12.6898L12.0836 13.3786C9.68261 12.1735 8.1995 10.7892 7.33637 8.63133L8.00094 5.0665L6.7447 1.72626L3.50715 1.72626C2.53392 1.72626 1.76754 2.53051 1.91289 3.49282C2.27576 5.8952 3.34569 10.251 6.47323 13.3786C9.75763 16.663 14.4881 18.0882 17.0915 18.6547C18.0969 18.8734 18.9887 18.0891 18.9887 17.0602L18.9887 13.9666L15.6382 12.6898Z"
                stroke="#ffffff"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'none',
            }}
            className="mobile-nav-toggle"
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
              top: '5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '1280px',
              zIndex: 99998,
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 21 21" fill="none">
                    <path
                      d="M15.6382 12.6898L12.0836 13.3786C9.68261 12.1735 8.1995 10.7892 7.33637 8.63133L8.00094 5.0665L6.7447 1.72626L3.50715 1.72626C2.53392 1.72626 1.76754 2.53051 1.91289 3.49282C2.27576 5.8952 3.34569 10.251 6.47323 13.3786C9.75763 16.663 14.4881 18.0882 17.0915 18.6547C18.0969 18.8734 18.9887 18.0891 18.9887 17.0602L18.9887 13.9666L15.6382 12.6898Z"
                      stroke="#ffffff"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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
