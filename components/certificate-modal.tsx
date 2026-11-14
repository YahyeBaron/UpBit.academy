'use client';

import React, { useRef, useState } from 'react';
import { Award, Download, Printer, X, Check, ShieldCheck, Sparkles } from 'lucide-react';

import Image from 'next/image';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  courseTitle?: string;
  instructorName?: string;
  completionDate?: string;
  certificateId?: string;
}

export default function CertificateModal({
  isOpen,
  onClose,
  studentName = 'Alex Mercer',
  courseTitle = 'Full-Stack Next.js 15 & React 19 Masterclass',
  instructorName = 'Sarah Lin & Yahye Baron',
  completionDate = 'July 30, 2026',
  certificateId = 'BIT-CERT-NEXT15-99824',
}: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrintDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      window.print();
      setDownloading(false);
    }, 300);
  };

  const copyVerifyLink = () => {
    navigator.clipboard.writeText(`https://upbit.academy/verify/${certificateId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="relative bg-[#030d1a] border border-blue-500/30 rounded-3xl p-6 sm:p-10 max-w-4xl w-full text-center space-y-6 shadow-2xl shadow-blue-500/20 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Top Badge */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 w-max mx-auto">
          <Sparkles size={14} /> Official Verified UpBit Academy Certificate
        </div>

        {/* Certificate Printable Canvas Container */}
        <div
          ref={certRef}
          className="certificate-print-area relative bg-gradient-to-br from-[#020b18] via-[#05142a] to-[#01060e] border-4 border-amber-500/40 rounded-2xl p-8 sm:p-12 text-center text-white shadow-2xl overflow-hidden my-4"
        >
          {/* Decorative Corner Borders */}
          <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
          <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
          <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
          <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />

          {/* Background Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

          {/* Certificate Header */}
          <div className="space-y-2 relative z-10">
            <div className="flex items-center justify-center gap-3 text-amber-400 font-extrabold tracking-widest text-xs uppercase">
              <Image src="/assets/images/logo-white.png" alt="Logo" width={28} height={28} className="object-contain" />
              UpBit Academy — Institute of Technology
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 uppercase">
              Certificate of Completion
            </h1>
            <p className="text-xs text-gray-400 tracking-wider uppercase pt-1">This document certifies that</p>
          </div>

          {/* Student Name */}
          <div className="py-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-wide border-b-2 border-amber-400/30 pb-3 max-w-xl mx-auto font-serif">
              {studentName}
            </h2>
          </div>

          {/* Certificate Text */}
          <div className="space-y-3 max-w-2xl mx-auto relative z-10">
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              has successfully completed all requirements, lectures, and interactive code exercises for the premier curriculum:
            </p>
            <h3 className="text-lg sm:text-2xl font-bold text-cyan-300 tracking-tight font-sans">
              "{courseTitle}"
            </h3>
          </div>

          {/* Footer Metadata & Signatures */}
          <div className="pt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end relative z-10 border-t border-white/10 mt-8">
            {/* Instructor Signature */}
            <div className="text-left space-y-1">
              <div className="h-8 font-serif italic text-amber-300 text-lg border-b border-white/20 pb-1">
                {instructorName}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lead Instructor</p>
            </div>

            {/* BIT Academy Official Gold Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center mb-1">
                <div className="w-full h-full rounded-full bg-[#020b18] flex flex-col items-center justify-center border border-amber-300/40">
                  <ShieldCheck size={24} className="text-amber-400" />
                  <span className="text-[7px] font-black text-amber-300 uppercase tracking-tighter">VERIFIED</span>
                </div>
              </div>
              <span className="text-[9px] font-mono text-gray-400">Issued: {completionDate}</span>
            </div>

            {/* Verification ID */}
            <div className="text-right space-y-1">
              <div className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-1 rounded-md inline-block">
                ID: {certificateId}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Verification Code</p>
            </div>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={copyVerifyLink}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <ShieldCheck size={14} />}
            {copied ? 'Verification Link Copied!' : 'Copy Verification Link'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrintDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-500/25 transition-all"
            >
              {downloading ? <Printer size={14} className="animate-spin" /> : <Download size={14} />}
              {downloading ? 'Preparing PDF…' : 'Download Official PDF Certificate'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
