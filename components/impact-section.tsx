'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    BookOpen,
    Monitor,
    Users,
    Headset,
    CreditCard,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Sparkles,
    Zap
} from 'lucide-react';

export default function ImpactSection() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const formatTime = (secs: number) => {
        if (isNaN(secs) || secs <= 0) return "00:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration || 0;
            setCurrentTime(current);
            if (total && total !== duration) setDuration(total);
            if (total > 0) setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration || 0);
        }
    };

    const points = [
        { icon: <BookOpen size={15} className="text-blue-400" />,    label: "Curated Course Library",       sub: "Next.js · Three.js · SaaS" },
        { icon: <Monitor size={15} className="text-cyan-400" />,     label: "Production Tech Stacks",       sub: "App Router · Prisma · TypeScript" },
        { icon: <Users size={15} className="text-purple-400" />,     label: "Lesson Q&A Threads",           sub: "Instructors & peers" },
        { icon: <Headset size={15} className="text-amber-400" />,    label: "Quizzes & Milestones",         sub: "Structured self-paced" },
        { icon: <CreditCard size={15} className="text-emerald-400" />, label: "14-Day Money-Back",          sub: "Risk-free enrollment" },
        { icon: <Zap size={15} className="text-rose-400" />,         label: "Instant Course Access",        sub: "Stream after purchase" },
    ];

    return (
        <section className="section section-lift">
            {/* Ambient glows */}
            <div className="glow-blob top-1/4 -left-40 w-[500px] h-[500px] bg-blue-600/15 animate-glow-pulse" />
            <div className="glow-blob bottom-10 right-0 w-[400px] h-[400px] bg-indigo-600/10 animate-glow-pulse" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center max-w-2xl mx-auto mb-14"
                >
                    <div className="section-badge">
                        <Sparkles size={11} /> Platform Features
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
                        Everything to{" "}
                        <span className="gradient-text">
                            Ship Production Code
                        </span>
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Practical, employer-ready training — from zero to full-stack.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

                    {/* Left: Compact feature grid */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {points.map((point, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -3, scale: 1.02 }}
                                    className="card group flex items-center gap-3 p-3.5 transition-all duration-300 cursor-default"
                                >
                                    <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/8 group-hover:border-current group-hover:scale-110 transition-all duration-300">
                                        {point.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-[13px] font-bold leading-tight truncate group-hover:text-blue-300 transition-colors">{point.label}</p>
                                        <p className="text-gray-500 text-[11px] mt-0.5 truncate">{point.sub}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <a href="#courses" className="btn-primary self-start">
                                Explore Masterclasses
                                <ArrowRight size={16} />
                            </a>
                        </motion.div>
                    </div>

                    {/* Right: Glass Video Showcase Player */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="lg:col-span-6 relative"
                    >
                        {/* Glow halo behind player */}
                        <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-3xl pointer-events-none animate-glow-pulse" />

                        <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-[#070B16] shadow-[0_25px_60px_rgba(0,0,0,0.7)] group transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_30px_70px_rgba(37,99,235,0.25)]">
                            
                            {/* Live Badge Bar */}
                            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-gray-200">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span>HD Course Preview</span>
                            </div>

                            {/* Video Element */}
                            <video
                                ref={videoRef}
                                autoPlay
                                muted={isMuted}
                                loop
                                playsInline
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                className="w-full aspect-video object-cover cursor-pointer"
                                onClick={togglePlay}
                            >
                                <source src="/assets/vidoe.mp4" type="video/mp4" />
                            </video>

                            {/* Overlay Controls Bar */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 flex flex-col gap-3 z-30 opacity-90 group-hover:opacity-100 transition-opacity">
                                {/* Progress Bar */}
                                <div
                                    className="relative h-1.5 w-full bg-white/20 rounded-full cursor-pointer overflow-hidden"
                                    onClick={(e) => {
                                        if (videoRef.current && videoRef.current.duration) {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const pos = (e.clientX - rect.left) / rect.width;
                                            videoRef.current.currentTime = pos * videoRef.current.duration;
                                        }
                                    }}
                                >
                                    <div
                                        className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                {/* Controls Buttons */}
                                <div className="flex items-center justify-between text-white/80">
                                    <div className="flex items-center gap-4">
                                        <button onClick={togglePlay} className="hover:text-white transition-colors" title="Play/Pause">
                                            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                        <button onClick={toggleMute} className="hover:text-white transition-colors" title="Mute/Unmute">
                                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                        </button>
                                        <span className="text-xs font-mono text-gray-400">
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                            HD 1080p
                                        </span>
                                        <button onClick={() => videoRef.current?.requestFullscreen()} className="hover:text-white transition-colors" title="Fullscreen">
                                            <Maximize size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
