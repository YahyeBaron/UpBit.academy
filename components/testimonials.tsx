'use client';

import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2, Sparkles } from "lucide-react";

interface Testimonial {
    name: string;
    role: string;
    track: string;
    avatar: string;
    content: string;
    rating: number;
    badge: string;
}

const testimonials: Testimonial[] = [
    {
        name: "Sarah C.",
        role: "Frontend Developer",
        track: "Next.js 15 Guide",
        avatar: "/assets/pri-next.jpg",
        content: "The Next.js 15 guide completely transformed my understanding of Server Components, caching lifecycles, and App Router architecture.",
        rating: 5,
        badge: "Course Graduate"
    },
    {
        name: "James W.",
        role: "Fullstack Builder",
        track: "SaaS Masterclass",
        avatar: "/assets/pri-js.jpg",
        content: "I went from zero payment integration experience to launching a complete fullstack application with authentication and webhooks.",
        rating: 5,
        badge: "SaaS Builder"
    },
    {
        name: "Elena R.",
        role: "Creative Developer",
        track: "3D & GSAP Track",
        avatar: "/assets/pri-gsap.jpg",
        content: "The GSAP and Three.js modules gave my portfolio the interactive polish and WebGL scene fidelity that stands out immediately.",
        rating: 5,
        badge: "Portfolio Showcase"
    },
    {
        name: "David K.",
        role: "Backend Engineer",
        track: "Prisma & SQL Guide",
        avatar: "/assets/pri-threejs.jpg",
        content: "The database design, Prisma ORM indexing, and concurrency management lessons provided exactly what was needed for production reliability.",
        rating: 5,
        badge: "Course Graduate"
    }
];

export default function Testimonials() {
    return (
        <section id="testimonials" className="section section-base">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header with reveal animation */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <div className="section-badge">
                        <Sparkles size={13} /> Curriculum Outcomes
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
                        Built for <span className="gradient-text">Ambitious Engineers</span>
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                        Explore how learners apply our project-based curriculum to master modern stacks, launch SaaS apps, and build standout portfolios.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                            className="card group relative p-8 transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_35px_rgba(37,99,235,0.15)] flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex gap-1 text-amber-400">
                                        {[...Array(t.rating)].map((_, idx) => (
                                            <Star key={idx} size={14} className="fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>

                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                                        <CheckCircle2 size={11} /> {t.badge}
                                    </span>
                                </div>

                                <Quote size={28} className="opacity-15 text-blue-400 mb-4 group-hover:opacity-40 group-hover:translate-x-1 transition-all duration-300" />

                                <p className="text-gray-300 text-sm leading-relaxed mb-8 italic">
                                    "{t.content}"
                                </p>
                            </div>

                            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                                <img
                                    src={t.avatar}
                                    alt={t.name}
                                    className="w-10 h-10 rounded-full object-cover border border-white/20 group-hover:border-blue-500/50 transition-colors"
                                />
                                <div>
                                    <h3 className="text-white font-bold text-sm tracking-tight group-hover:text-blue-200 transition-colors">{t.name}</h3>
                                    <p className="text-gray-400 text-xs font-medium">{t.role} &bull; <span className="text-blue-400 font-semibold">{t.track}</span></p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
