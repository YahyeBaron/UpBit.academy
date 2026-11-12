'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './logo';
import { Mail, CheckCircle2, ArrowUp, ShieldCheck, Sparkles, Send, Loader2, AlertCircle } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(data.message || "You're subscribed! Check your inbox for your free starter kit.");
      setEmail('');
    } catch (err) {
      console.error('Subscription error:', err);
      setStatus('error');
      setMessage('Failed to send request. Please check your internet connection.');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="text-white relative border-t overflow-hidden" style={{backgroundColor:'var(--bg-base)', borderColor:'rgba(255,255,255,0.07)'}}>
      {/* Newsletter Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-950/30 via-[#070B16] to-[#040711] p-10 md:p-16 text-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
        >
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none animate-glow-pulse" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-bold uppercase tracking-widest text-blue-400 mb-6">
              <Sparkles size={13} /> Weekly Developer Dispatch
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Get Free Code Tutorials & Architectural Insights
            </h3>
            
            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              Join our developer community getting weekly deep dives into Next.js 15, Three.js shaders, and SaaS architecture patterns.
            </p>

            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== 'idle' && status !== 'loading') {
                      setStatus('idle');
                      setMessage('');
                    }
                  }}
                  placeholder="Enter your work email"
                  required
                  disabled={status === 'loading'}
                  className="w-full rounded-full border border-white/15 bg-white/5 py-3.5 pl-11 pr-5 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  aria-label="Email address for subscription"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 font-bold text-sm text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Subscribing...</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={15} />
                  </>
                )}
              </button>
            </form>

            <div aria-live="polite">
              <AnimatePresence mode="wait">
                {status === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 shadow-sm"
                  >
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{message}</span>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20 shadow-sm"
                  >
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              No spam ever. Unsubscribe anytime with 1-click.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          
          <div className="md:col-span-2">
            <Logo className="mb-6" />
            <p className="max-w-sm text-gray-400 text-sm leading-relaxed mb-6">
              Teaching the next generation of engineers the skills required to build production-grade web applications.
            </p>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational (v4.0.0)
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-5">Curriculum</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#courses" className="hover:text-blue-400 transition-colors">Next.js 15 Guide</a></li>
              <li><a href="#courses" className="hover:text-blue-400 transition-colors">Three.js WebGL</a></li>
              <li><a href="#courses" className="hover:text-blue-400 transition-colors">SaaS Masterclass</a></li>
              <li><a href="#courses" className="hover:text-blue-400 transition-colors">GSAP Animations</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-5">Platform</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Bento Features</a></li>
              <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Pricing Plans</a></li>
              <li><a href="#faq" className="hover:text-blue-400 transition-colors">Student FAQ</a></li>
              <li><a href="#testimonials" className="hover:text-blue-400 transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-white mb-5">Connect</h4>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: "/assets/github-2.svg", name: 'GitHub' },
                { icon: "/assets/youtube.svg", name: 'YouTube' },
                { icon: "/assets/twitter.svg", name: 'Twitter' },
                { icon: "/assets/linkedin-2.svg", name: 'LinkedIn' },
              ].map((social, i) => (
                <a
                  key={i}
                  href="#"
                  className="h-9 w-9 flex items-center justify-center rounded-xl border border-white/10 hover:border-blue-500 transition-all p-2 bg-white/5 hover:bg-blue-500/10"
                  title={social.name}
                >
                  <img src={social.icon} alt={social.name} className="w-full h-full opacity-70 hover:opacity-100 invert" />
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-gray-500 gap-4">
          <p>© 2026 EraySame Tech Academy. All rights reserved.</p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              onClick={scrollToTop}
              className="group flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold ml-4 cursor-pointer transition-colors"
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
