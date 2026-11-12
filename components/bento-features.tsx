'use client';

import { motion } from 'framer-motion';
import { Zap, Users, Trophy, Code2, Sparkles, ArrowRight, CheckCircle2, Globe2, ShieldCheck } from 'lucide-react';

export default function BentoFeatures() {
  return (
    <section id="features" className="section section-lift">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[170px] rounded-full pointer-events-none animate-glow-pulse" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="section-badge">
            <Sparkles size={13} /> Platform Advantages
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Designed for <span className="gradient-text">Developer Excellence</span>
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            We provide structured roadmaps, production starter kits, and direct mentorship to accelerate your engineering career.
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
          
          {/* Tile 1: Fast-Track Learning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
            className="md:col-span-6 lg:col-span-8 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0E1A]/80 backdrop-blur-xl p-8 sm:p-10 transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(37,99,235,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 group-hover:scale-110 group-hover:bg-blue-600/20 transition-all duration-300">
                <Zap size={26} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 group-hover:text-blue-200 transition-colors">
                Fast-Track Structured Curriculum
              </h3>
              <p className="max-w-xl text-gray-400 text-base leading-relaxed mb-8">
                No fluff or outdated tutorials. Our modules are designed with zero filler, taking you directly into modern Next.js 15, Three.js shaders, and fullstack architecture.
              </p>

              {/* Interactive Learning Steps Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs text-gray-300">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  <CheckCircle2 size={15} className="text-blue-400" />
                  <span>1. Foundations</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  <CheckCircle2 size={15} className="text-purple-400" />
                  <span>2. Architecture</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>3. Production</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 text-blue-400 font-bold text-sm group-hover:text-blue-300 group-hover:translate-x-1.5 transition-all duration-300 cursor-pointer">
              <span>Explore Learning Paths</span>
              <ArrowRight size={16} />
            </div>
          </motion.div>

          {/* Tile 2: Global Community */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
            className="md:col-span-3 lg:col-span-4 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0E1A]/80 backdrop-blur-xl p-8 transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_35px_rgba(6,182,212,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-600/20 transition-all duration-300">
                <Users size={26} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-200 transition-colors">Community & Peer Collaboration</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Collaborate with ambitious developers building SaaS apps, sharing architectural solutions, and leveling up.
              </p>
            </div>

            {/* Avatar Cloud */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
              <div className="flex -space-x-2">
                <img src="/assets/pri-next.jpg" alt="Member" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                <img src="/assets/pri-js.jpg" alt="Member" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                <img src="/assets/pri-gsap.jpg" alt="Member" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
                <img src="/assets/pri-threejs.jpg" alt="Member" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-full border border-cyan-500/20">
                Global Learners
              </span>
            </div>
          </motion.div>

          {/* Tile 3: Expert Guidance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
            className="md:col-span-3 lg:col-span-4 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0E1A]/80 backdrop-blur-xl p-8 transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_35px_rgba(168,85,247,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 group-hover:bg-purple-600/20 transition-all duration-300">
                <Trophy size={26} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-200 transition-colors">Direct Q&A & Support</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Ask questions inside any lesson, receive structured feedback on your code, and clarify complex architectural patterns.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">Lesson Discussion Threads</span>
            </div>
          </motion.div>

          {/* Tile 4: Real-World Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
            className="md:col-span-6 lg:col-span-8 group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A0E1A]/80 backdrop-blur-xl p-8 sm:p-10 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_35px_rgba(99,102,241,0.18)] flex flex-col justify-between"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600/20 transition-all duration-300">
                  <Code2 size={26} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 group-hover:text-indigo-200 transition-colors">
                  Production-Grade Portfolio Projects
                </h3>
                <p className="text-gray-400 text-base leading-relaxed">
                  Build full-stack applications featuring authentication, payments, 3D WebGL scenes, and serverless databases that impress hiring managers.
                </p>
              </div>

              {/* Mini Code Preview Badge */}
              <div className="w-full sm:w-auto p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-blue-300 shadow-inner">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>deploy.config.ts</span>
                </div>
                <code className="text-gray-300">
                  <span className="text-purple-400">await</span> deployToVercel({'{'}
                  <br />
                  &nbsp;&nbsp;environment: <span className="text-emerald-400">"production"</span>
                  <br />
                  {'}'});
                </code>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
