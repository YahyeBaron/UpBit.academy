'use client';

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Play, Star, ShieldCheck, Zap } from "lucide-react"
import InteractiveCodeCard from "./interactive-code-card"


/* ── Dynamic word: vertical slide + fade via Framer Motion ── */
const DYNAMIC_WORDS = ["Craft.", "Vision."]

function DynamicWord() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const id = setInterval(
            () => setIndex((i) => (i + 1) % DYNAMIC_WORDS.length),
            2500,
        )
        return () => clearInterval(id)
    }, [])

    return (
        <span
            className="inline-grid grid-cols-1 grid-rows-1 overflow-hidden align-baseline min-w-[160px] pb-1 ml-1"
            aria-live="polite"
            aria-atomic="true"
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={DYNAMIC_WORDS[index]}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="col-start-1 row-start-1 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent inline-block font-extrabold"
                >
                    {DYNAMIC_WORDS[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    )
}

function RevealText({
    text,
    delay = 0,
    isVisible,
}: {
    text: string
    delay?: number
    isVisible: boolean
}) {
    return (
        <span className="inline-block overflow-hidden pb-1">
            {text.split("").map((char, i) => (
                <span
                    key={i}
                    className={`inline-block transition-all duration-500 ${isVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-[110%] opacity-0"
                        }`}
                    style={{
                        transitionDelay: `${delay + i * 35}ms`,
                    }}
                >
                    {char === " " ? "\u00A0" : char}
                </span>
            ))}
        </span>
    )
}

export default function HeroContent() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(t)
    }, [])

    return (
        <div className="relative z-10 flex min-h-screen items-center pt-28 pb-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

                    {/* Left Column: Headline & Action */}
                    <div className="lg:col-span-7 max-w-2xl">
                        {/* Live Online Badge */}
                        <div
                            className={`mb-6 transition-all duration-700 delay-100 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                                }`}
                        >
                            <span className="inline-flex items-center gap-3 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-300 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                                </span>
                                <span>Production Curriculum &bull; Updated for 2026</span>
                            </span>
                        </div>

                        {/* Main Headline */}
                        <h1 className="mb-8 text-[clamp(2.25rem,4.5vw,3.75rem)] font-extrabold leading-[1.15] tracking-tight text-white">
                            {/* Line 1 — static */}
                            <span className="block mb-1">
                                <RevealText
                                    text="Master the Tech."
                                    delay={250}
                                    isVisible={isVisible}
                                />
                            </span>
                            {/* Line 2 — 'Unleash the' + animated dynamic word */}
                            <span className="inline-flex items-baseline flex-wrap gap-x-3">
                                <RevealText
                                    text="Unleash the"
                                    delay={350}
                                    isVisible={isVisible}
                                />
                                <DynamicWord />
                            </span>
                        </h1>

                        {/* Subtitle Quote with breathing room */}
                        <p
                            className={`mt-4 mb-12 max-w-xl text-base sm:text-lg italic leading-relaxed text-gray-300/90 transition-all duration-700 delay-400 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                                }`}
                        >
                            &ldquo;To cultivate useful knowledge (&#x2018;Ilm Nafi&#x2019;) and technical excellence (Ihsan), empowering learners to master technology, unleash their creativity, and build impactful solutions for the betterment of society.&rdquo;
                        </p>

                        {/* Action Buttons */}
                        <div
                            className={`mb-12 flex flex-wrap items-center gap-4 transition-all duration-700 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                                }`}
                        >
                            <a
                                href="#courses"
                                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-[0_0_35px_rgba(37,99,235,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(37,99,235,0.6)] active:scale-[0.98]"
                            >
                                <span className="relative z-10">Explore Masterclasses</span>
                                <ArrowRight size={18} className="relative z-10 transition-transform group-hover:translate-x-1.5" />
                                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                            </a>

                            <a
                                href="#courses"
                                className="group inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/5 px-6 py-4 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/30"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                    <Play size={14} className="ml-0.5 fill-blue-400" />
                                </div>
                                <span>Preview Curriculum</span>
                            </a>
                        </div>

                        {/* Social Proof & Metrics */}
                        <div
                            className={`flex flex-wrap items-center gap-8 pt-6 border-t border-white/10 transition-all duration-700 delay-600 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                                    <Star size={18} className="fill-amber-400 text-amber-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                        <span>Industry-Ready Curriculum</span>
                                    </div>
                                    <p className="text-xs text-gray-400">Project-based &bull; Production architectures</p>
                                </div>
                            </div>

                            <div className="hidden sm:block h-8 w-px bg-white/10" />

                            <div className="flex items-center gap-6 text-xs text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck size={16} className="text-blue-400" /> 14-Day Guarantee
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Zap size={16} className="text-blue-400" /> Lifetime Access
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Interactive Code Card Widget */}
                    <div
                        className={`lg:col-span-5 lg:pl-6 xl:pl-10 transition-all duration-1000 delay-300 ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"
                            }`}
                    >
                        <InteractiveCodeCard />
                    </div>

                </div>
            </div>
        </div>
    )
}
