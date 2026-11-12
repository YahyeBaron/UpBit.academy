'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";

interface FAQItem {
    id: number;
    category: 'general' | 'billing' | 'certificates';
    question: string;
    answer: string;
}

const faqData: FAQItem[] = [
    {
        id: 1,
        category: 'general',
        question: "Is EraySame Tech Academy suitable for beginners?",
        answer: "Yes! We provide structured paths starting from foundational JavaScript & React up to advanced Next.js 15, 3D WebGL, and SaaS architecture."
    },
    {
        id: 2,
        category: 'certificates',
        question: "Do I get a certificate of completion?",
        answer: "Yes! Upon finishing all lessons and knowledge checks in any course track, you receive a verifiable digital certificate with a unique verification code that can be shared on LinkedIn and verified online."
    },
    {
        id: 3,
        category: 'general',
        question: "Can I access course materials offline?",
        answer: "All video lectures are streamable on-demand in high-definition (HD 1080p), and all project starter repositories, code templates, and reference notes are downloadable for offline development."
    },
    {
        id: 4,
        category: 'general',
        question: "How does the student community and Q&A work?",
        answer: "Every lesson includes built-in discussion threads where you can ask questions, share your code implementations, and collaborate with instructors and fellow developers directly within the platform."
    },
    {
        id: 5,
        category: 'billing',
        question: "What is your 14-day refund policy?",
        answer: "We offer a 100% money-back guarantee within 14 days of enrollment if a course does not meet your expectations. Just reach out to our support team."
    },
    {
        id: 6,
        category: 'billing',
        question: "Do I get lifetime access to enrolled courses?",
        answer: "Yes! Each course enrollment provides lifetime access to all current lessons, future curriculum updates, starter code repositories, and downloadable resources."
    }
];

export default function FAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'general' | 'billing' | 'certificates'>('all');

    const filteredFaq = faqData.filter((item) => {
        const matchesTab = activeTab === 'all' || item.category === activeTab;
        const matchesQuery = item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesQuery;
    });

    return (
        <section id="faq" className="section section-lift">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {/* Header with scroll reveal */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-14"
                >
                    <div className="section-badge">
                        <Sparkles size={13} /> Support &amp; Assistance
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Have questions before joining? Find instant answers below.
                    </p>
                </motion.div>

                {/* Search Bar & Category Filters */}
                <div className="mb-10 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search questions (e.g. refund, certificate, Next.js)..."
                            className="w-full rounded-2xl border border-white/8 py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500/50 transition-colors"
                            style={{backgroundColor:'var(--bg-card)'}}
                        />
                    </div>

                    <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {[
                            { id: 'all', label: 'All Questions' },
                            { id: 'general', label: 'General & Learning' },
                            { id: 'billing', label: 'Billing & Refunds' },
                            { id: 'certificates', label: 'Certificates' },
                        ].map((tab) => {
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`relative px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer z-10 ${
                                        isSelected
                                            ? 'text-white'
                                            : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                                    }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="activeFaqTab"
                                            className="absolute inset-0 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.45)] -z-10"
                                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* FAQ Accordion List */}
                <div className="space-y-4">
                    {filteredFaq.length > 0 ? (
                        filteredFaq.map((item, i) => {
                            const isOpen = openIndex === i;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-40px" }}
                                    transition={{ duration: 0.45, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                                        isOpen
                                            ? 'border-blue-500/40 bg-[#0A0E1A] shadow-[0_0_30px_rgba(37,99,235,0.15)]'
                                            : 'border-white/10 bg-[#0A0E1A]/80 hover:border-blue-500/30'
                                    } backdrop-blur-md`}
                                >
                                    <button
                                        className="flex w-full items-center justify-between p-6 text-left cursor-pointer transition-colors"
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                    >
                                        <div className="flex items-center gap-4 pr-4">
                                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                                                isOpen
                                                    ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                                                    : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                                            }`}>
                                                <HelpCircle size={17} />
                                            </div>
                                            <span className={`text-base font-bold transition-colors md:text-lg ${isOpen ? 'text-white' : 'text-gray-200 hover:text-white'}`}>
                                                {item.question}
                                            </span>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: isOpen ? 180 : 0 }}
                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className="flex-shrink-0"
                                        >
                                            <ChevronDown size={20} className={isOpen ? "text-blue-400" : "text-gray-500"} />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                key="answer"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-3 text-gray-300 leading-relaxed text-sm md:ml-13 border-t border-white/5">
                                                    {item.answer}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    ) : (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            No questions found matching your search term.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
