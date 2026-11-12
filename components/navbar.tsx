'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { UserButton, useUser, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './logo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isSignedIn, isLoaded } = useUser();
  const pathname = usePathname();

  const isCatalogActive = pathname.startsWith('/courses');
  const isRoadmapActive = pathname.startsWith('/roadmap');
  const isInstructorsActive = pathname.startsWith('/instructors');
  const isDashboardActive = pathname.startsWith('/dashboard');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (height > 0) {
        setScrollProgress((winScroll / height) * 100);
      }
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = pathname === '/';

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isHome && !scrolled
          ? 'opacity-0 pointer-events-none -translate-y-4'
          : 'opacity-100 pointer-events-auto translate-y-0'
      }`}
      style={{
        borderColor: 'rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(5, 8, 15, 0.82)'
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-transform duration-300 hover:scale-105">
            <Logo />
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              <Link
                href="/courses"
                className={`text-sm font-medium transition-all duration-300 hover:text-white ${
                  isCatalogActive ? 'text-white font-semibold' : 'text-gray-300 hover:-translate-y-0.5'
                }`}
              >
                Catalog
              </Link>
              <Link
                href="/roadmap"
                className={`text-sm font-medium transition-all duration-300 hover:text-white ${
                  isRoadmapActive ? 'text-white font-semibold' : 'text-gray-300 hover:-translate-y-0.5'
                }`}
              >
                Roadmap
              </Link>
              <Link
                href="/instructors"
                className={`text-sm font-medium transition-all duration-300 hover:text-white ${
                  isInstructorsActive ? 'text-white font-semibold' : 'text-gray-300 hover:-translate-y-0.5'
                }`}
              >
                Instructors
              </Link>
              
              {isLoaded && isSignedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium transition-all duration-300 hover:text-white ${
                      isDashboardActive ? 'text-white font-semibold' : 'text-gray-300 hover:-translate-y-0.5'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <ClerkLoaded>
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: 'w-9 h-9 border border-blue-500/40 rounded-full transition-transform hover:scale-105',
                        },
                      }}
                    />
                  </ClerkLoaded>
                  <ClerkLoading>
                    <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse border border-white/10" />
                  </ClerkLoading>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 hover:-translate-y-0.5">Sign In</Link>
                  <Link href="/signup" className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white hover:from-blue-500 hover:to-cyan-400 transition-all duration-300 shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:shadow-[0_0_35px_rgba(37,99,235,0.7)] hover:-translate-y-0.5 active:translate-y-0">Join Now</Link>
                </>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center gap-4">
            {isLoaded && isSignedIn && (
              <>
                <ClerkLoaded>
                  <UserButton />
                </ClerkLoaded>
                <ClerkLoading>
                  <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse border border-white/10" />
                </ClerkLoading>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Scroll Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04] overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
          style={{
            width: `${scrollProgress}%`,
            transition: 'width 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      {/* Mobile Menu with smooth height animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden bg-black/95 border-b border-white/10 px-4 pt-4 pb-6 space-y-4 backdrop-blur-2xl"
          >
            <Link href="/courses" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-300 hover:text-white transition-colors">Catalog</Link>
            <Link href="/roadmap" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-300 hover:text-white transition-colors">Roadmap</Link>
            <Link href="/instructors" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-300 hover:text-white transition-colors">Instructors</Link>
            {isLoaded && isSignedIn ? (
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-300 hover:text-white transition-colors">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsOpen(false)} className="block text-base font-medium text-gray-300 hover:text-white transition-colors">Sign In</Link>
                <Link href="/signup" onClick={() => setIsOpen(false)} className="block rounded-full bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.4)]">Join Now</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
