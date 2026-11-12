'use client';

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const ICON_CARDS = [
    { icon: "/assets/js.svg",       color: "from-[#FBBF24]/10 to-[#B45309]/5",   border: "border-[#FBBF24]/40",  rotation: "-14deg" },
    { icon: "/assets/next.svg",     color: "from-gray-400/10 to-white/5",          border: "border-white/20",       rotation: "-5deg"  },
    { icon: "/assets/react.svg",    color: "from-[#61DAFB]/10 to-[#1e40af]/10",   border: "border-[#61DAFB]/30",  rotation: "0deg"   },
    { icon: "/assets/three-js.svg", color: "from-cyan-400/10 to-blue-500/10",      border: "border-cyan-500/30",   rotation: "5deg"   },
    { icon: "/assets/gsap.svg",     color: "from-green-400/10 to-green-600/10",    border: "border-green-500/30",  rotation: "14deg"  },
];

const TIERS = [
    {
        id: "core",
        label: "Core Tracks",
        price: 29,
        description: "Foundational to intermediate courses — hands-on projects, source code & verified certificate.",
        highlight: false,
    },
    {
        id: "advanced",
        label: "Advanced Tracks",
        price: 49,
        description: "Production-grade architectures — Fullstack SaaS, WebGL 3D, auth & real-world payment flows.",
        highlight: true,
    },
];

export default function PricingSection() {
    const [activeId, setActiveId] = useState("core");
    const containerRef = useRef<HTMLDivElement>(null);

    const active = TIERS.find((t) => t.id === activeId) ?? TIERS[0];

    useEffect(() => {
        let ctx: any;
        let isMounted = true;

        Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
            ([gsapModule, stModule]) => {
                if (!isMounted || !containerRef.current) return;
                const gsap = gsapModule.gsap ?? gsapModule.default;
                const ScrollTrigger = stModule.ScrollTrigger ?? stModule.default;
                gsap.registerPlugin(ScrollTrigger);

                ctx = gsap.context(() => {
                    const tl = gsap.timeline({
                        scrollTrigger: { trigger: containerRef.current, start: "top 82%", once: true },
                    });
                    tl.fromTo(".fanned-card",
                        { y: 30, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: "power3.out" }
                    ).fromTo(".pricing-card",
                        { y: 40, opacity: 0 },
                        { y: 0, opacity: 1, duration: 1, ease: "power4.out" },
                        "-=0.5"
                    );
                }, containerRef);
            }
        );

        return () => { isMounted = false; if (ctx) ctx.revert(); };
    }, []);

    return (
        <section
            id="pricing"
            ref={containerRef}
            className="section section-base font-sans"
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/10 blur-[130px] rounded-full animate-glow-pulse" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="section-badge">
                        <Sparkles size={11} /> Per-Course Pricing
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                        One Price. Lifetime Access.
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                        Pay once per course — no subscriptions, no recurring fees.
                    </p>
                </div>

                {/* Fanned icon cards — smaller with spring kinematics */}
                <div className="flex justify-center -mb-8 relative z-20">
                    {ICON_CARDS.map((card, i) => (
                        <div
                            key={i}
                            className={`fanned-card relative w-14 h-20 sm:w-18 sm:h-26 rounded-xl border ${card.border} bg-gradient-to-br ${card.color} backdrop-blur-2xl flex items-center justify-center -ml-4 first:ml-0 shadow-[0_12px_30px_rgba(0,0,0,0.4)] group overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-4 hover:scale-110 hover:z-50 hover:shadow-[0_20px_40px_rgba(37,99,235,0.4)] cursor-pointer`}
                            style={{ transform: `rotate(${card.rotation})` }}
                        >
                            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                            <img
                                src={card.icon}
                                alt="Tech"
                                className="w-7 h-7 sm:w-9 sm:h-9 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-115"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                        </div>
                    ))}
                </div>

                {/* Main card */}
                <div className="pricing-card group relative rounded-3xl border border-white/8 overflow-hidden transition-all duration-500 hover:border-blue-500/30 hover:shadow-[0_25px_70px_rgba(37,99,235,0.2)] shadow-[0_20px_60px_rgba(0,0,0,0.6)]" style={{backgroundColor:'var(--bg-card)'}}>
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.015] to-transparent pointer-events-none" />

                    <div className="relative z-10 p-8 sm:p-10">

                        {/* Tier selector pills with sliding indicator */}
                        <div className="flex items-center gap-2 justify-center mb-8 p-1 rounded-2xl bg-white/5 border border-white/8 w-fit mx-auto">
                            {TIERS.map((tier) => {
                                const isSelected = activeId === tier.id;
                                return (
                                    <button
                                        key={tier.id}
                                        onClick={() => setActiveId(tier.id)}
                                        className={`relative px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-300 cursor-pointer z-10 ${
                                            isSelected
                                                ? "text-white"
                                                : "text-gray-500 hover:text-gray-300"
                                        }`}
                                    >
                                        {isSelected && (
                                            <motion.div
                                                layoutId="activePricingTier"
                                                className="absolute inset-0 rounded-xl bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)] -z-10"
                                                transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                            />
                                        )}
                                        <span className="relative z-10">{tier.label}</span>
                                        {tier.highlight && !isSelected && (
                                            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-blue-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Price display with smooth morph */}
                        <div className="text-center mb-6 min-h-[120px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={active.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    <div className="flex items-end justify-center gap-1.5 mb-2">
                                        <span className="text-sm text-gray-500 font-semibold mb-2">from</span>
                                        <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter leading-none">
                                            ${active.price}
                                        </span>
                                        <div className="flex flex-col items-start gap-0.5 mb-1.5">
                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">one-time</span>
                                            <span className="text-[10px] text-gray-500 font-medium">per course</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                                        {active.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Feature row */}
                        <div className="flex items-center justify-center flex-wrap gap-x-5 gap-y-2 mb-7 text-xs text-gray-400 font-medium">
                            {["Lifetime access", "Verifiable certificate", "Source code included", "Promo codes accepted"].map((f) => (
                                <span key={f} className="flex items-center gap-1.5">
                                    <Check size={12} className="text-emerald-400 shrink-0" strokeWidth={3} />
                                    {f}
                                </span>
                            ))}
                        </div>

                        {/* CTA */}
                        <a
                            href="/courses"
                            className="group/btn relative flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-black uppercase tracking-wide overflow-hidden transition-all duration-300 hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            <span className="relative z-10">Browse Courses & Enroll</span>
                            <ArrowRight size={15} className="relative z-10 transition-transform group-hover/btn:translate-x-1" />
                        </a>

                        <p className="text-center text-gray-600 text-[11px] mt-3">
                            14-day money-back guarantee &bull; Instant access after enrollment
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
