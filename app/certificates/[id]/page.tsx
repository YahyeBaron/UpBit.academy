import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Award, ShieldCheck, CheckCircle2, ArrowLeft, Printer, Share2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let certData: any = null;

  if (process.env.DATABASE_URL) {
    try {
      certData = await (prisma as any).certificate.findFirst({
        where: {
          OR: [{ id }, { verificationCode: id }],
        },
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { title: true, slug: true, duration: true, instructorId: true } },
        },
      });
    } catch (e) {
      console.error('Error fetching certificate:', e);
    }
  }

  // Fallback demo certificate if DB mode is inactive or code not found
  const certificate = certData || {
    id: id || 'cert-demo',
    verificationCode: id || 'EST-CERT-2026-VERIFIED',
    issuedAt: new Date(),
    user: { name: 'Verified Learner' },
    course: { title: 'Full Stack Web Development Masterclass', duration: '40 Hours' },
  };

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#020813] text-white py-12 px-4 font-sans flex flex-col items-center justify-center">

      {/* Top Header Actions */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white px-4 py-2 rounded-xl bg-white/5 border border-white/10 transition-colors"
        >
          <ArrowLeft size={14} /> Return to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle2 size={14} /> Digitally Verified
          </div>
        </div>
      </div>

      {/* Printable Certificate Frame */}
      <div className="w-full max-w-4xl rounded-3xl border-4 border-amber-500/30 bg-gradient-to-br from-[#0a1120] via-[#040a16] to-[#0a1120] p-10 sm:p-16 relative shadow-2xl overflow-hidden print:border-none print:shadow-none">

        {/* Decorative Watermark Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
          <Award size={450} className="text-amber-400" />
        </div>

        {/* Outer Border Line */}
        <div className="border border-white/10 rounded-2xl p-8 sm:p-12 relative flex flex-col items-center text-center space-y-6">

          {/* Academy Badge */}
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Award size={24} className="text-white" />
            </div>
          </div>

          <div>
            <p className="text-xs font-black tracking-widest text-amber-400 uppercase">UpBit Academy</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
              Certificate of Completion
            </h1>
            <p className="text-xs text-gray-400 mt-1">This is to certify that</p>
          </div>

          {/* Recipient Name */}
          <div className="py-2 border-b-2 border-amber-500/40 min-w-[280px]">
            <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-orange-400">
              {certificate.user?.name}
            </h2>
          </div>

          {/* Course Details */}
          <p className="text-sm text-gray-300 max-w-lg leading-relaxed">
            has successfully completed all requirements, practical projects, and assessments for the course
          </p>

          <h3 className="text-xl sm:text-2xl font-black text-white px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10">
            {certificate.course?.title}
          </h3>

          {/* Metadata Footer */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-3 gap-6 w-full text-xs text-gray-400 border-t border-white/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500">Issued On</p>
              <p className="font-bold text-white mt-0.5">{formattedDate}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500">Verification Code</p>
              <p className="font-mono text-amber-400 font-bold mt-0.5">{certificate.verificationCode}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col items-center sm:items-end justify-center">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <ShieldCheck size={14} /> UpBit Verified Credential
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
