'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from './logo';
import { ArrowUp, Sparkles } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="footer"
      className="relative text-white overflow-hidden border-t"
      style={{
        backgroundColor: '#000000',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* ── Top CTA Banner (Matching Homepage Architectural Style) ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-14">
        <div
          className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center border"
          style={{
            background: 'linear-gradient(135deg, rgba(13, 26, 58, 0.85) 0%, rgba(26, 13, 58, 0.85) 60%, rgba(10, 10, 26, 0.95) 100%)',
            borderColor: 'rgba(77, 101, 255, 0.25)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Ambient Corner Glows */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none blur-[100px]"
            style={{ background: 'rgba(178, 63, 224, 0.15)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none blur-[100px]"
            style={{ background: 'rgba(77, 101, 255, 0.2)' }}
          />

          <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#4d65ff]/30 bg-[#4d65ff]/10 text-xs font-bold uppercase tracking-widest text-[#4d65ff] mb-5">
              <Sparkles size={13} /> The Premier AI Engineering Academy
            </div>

            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold font-space-grotesk text-white mb-4 tracking-tight">
              Become One of the World&apos;s First{' '}
              <span className="bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] bg-clip-text text-transparent">
                Forward Deployed Engineers
              </span>
            </h3>

            <p className="text-gray-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
              The world is hiring and UpBit Academy prepares you for it. Build client-ready AI systems, solve real business problems, and earn industry certification.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login"
                className="button is-chamfer is-grad w-button"
                style={{
                  padding: '14px 38px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Apply Now --&gt;
              </Link>
              <Link
                href="/courses"
                className="button is-chamfer is-white2 w-button"
                style={{
                  padding: '14px 34px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Browse Curriculum
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer Columns ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block text-decoration-none">
              <Logo imageSize={42} />
            </Link>
            <p className="max-w-sm text-gray-400 text-sm leading-relaxed">
              UpBit Academy is the world&apos;s structured pathway training Forward Deployed Engineers (FDE) and Applied AI practitioners.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Admissions Open • Fall 2026 Cohort
            </div>
          </div>

          {/* Curriculum Links */}
          <div>
            <h4 className="font-space-grotesk font-bold text-sm uppercase tracking-wider text-white mb-4">
              Curriculum
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  All Courses
                </Link>
              </li>
              <li>
                <Link href="/roadmap" className="hover:text-white transition-colors">
                  32-Week Roadmap
                </Link>
              </li>
              <li>
                <Link href="/instructors" className="hover:text-white transition-colors">
                  Faculty &amp; Mentors
                </Link>
              </li>
              <li>
                <Link href="/#blog" className="hover:text-white transition-colors">
                  Blog &amp; Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div>
            <h4 className="font-space-grotesk font-bold text-sm uppercase tracking-wider text-white mb-4">
              Programs
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Forward Deployed Engineer
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Applied AI Solutions
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  IIT Certification Track
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Student Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Social / Connect */}
          <div>
            <h4 className="font-space-grotesk font-bold text-sm uppercase tracking-wider text-white mb-4">
              Connect
            </h4>
            <div className="flex flex-wrap gap-2.5">
              {[
                { name: 'GitHub', icon: '/assets/github-2.svg', href: 'https://github.com' },
                { name: 'Twitter', icon: '/assets/twitter.svg', href: 'https://twitter.com' },
                { name: 'LinkedIn', icon: '/assets/linkedin-2.svg', href: 'https://linkedin.com' },
                { name: 'YouTube', icon: '/assets/youtube.svg', href: 'https://youtube.com' },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:border-[#4d65ff] hover:bg-[#4d65ff]/10 transition-all p-2.5"
                  title={social.name}
                >
                  <img src={social.icon} alt={social.name} className="w-full h-full opacity-70 hover:opacity-100 invert" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* ── Bottom Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-gray-500 gap-4">
          <p>© 2026 UpBit Academy. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Terms of Service
            </Link>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={scrollToTop}
              className="group flex items-center gap-1.5 text-[#4d65ff] hover:text-[#b23fe0] font-bold ml-2 cursor-pointer transition-colors"
            >
              <span>Back to top</span>
              <ArrowUp size={14} className="group-hover:-translate-y-1 transition-transform duration-300" />
            </motion.button>
          </div>
        </div>

      </div>
    </footer>
  );
}
