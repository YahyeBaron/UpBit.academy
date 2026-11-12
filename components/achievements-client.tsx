'use client';

import React, { useState } from 'react';
import { Award, Trophy, Download } from 'lucide-react';
import CertificateModal from '@/components/certificate-modal';

interface Enrollment {
  courseId: string;
  enrolledAt: Date | string;
  progress: number;
}

interface AchievementsClientProps {
  completedCourses: Enrollment[];
}

export default function AchievementsClient({ completedCourses }: AchievementsClientProps) {
  const [selectedCourse, setSelectedCourse] = useState<{ title: string; id: string } | null>(null);

  const formatTitle = (id: string) => {
    return id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="text-amber-400" />
          Earned Certificates ({completedCourses.length})
        </h2>

        {completedCourses.length > 0 ? (
          <div className="space-y-3">
            {completedCourses.map((enrollment) => {
              const title = formatTitle(enrollment.courseId);
              return (
                <div key={enrollment.courseId} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="font-bold text-white text-sm">{title} Certificate</h3>
                    <p className="text-xs text-gray-400">
                      Issued {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} • Verified
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCourse({ title, id: enrollment.courseId })}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Download size={14} />
                    Download PDF Certificate
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
            <Trophy size={28} className="text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Complete a course to 100% to unlock your official verified certificate.</p>
          </div>
        )}
      </div>

      {selectedCourse && (
        <CertificateModal
          isOpen={!!selectedCourse}
          onClose={() => setSelectedCourse(null)}
          courseTitle={selectedCourse.title}
          certificateId={`BIT-CERT-${selectedCourse.id.slice(0, 8).toUpperCase()}-99214`}
        />
      )}
    </>
  );
}
