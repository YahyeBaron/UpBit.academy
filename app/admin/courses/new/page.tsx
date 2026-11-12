'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Sparkles } from 'lucide-react';
import CourseFormFields, { CourseFormData } from '@/components/admin/course-form-fields';

export default function NewCourseAuthoringPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    slug: '',
    tagline: '',
    category: 'frontend',
    level: 'Beginner',
    price: 29,
    originalPrice: 99,
    description: '',
    longDescription: '',
    tags: 'Next.js 15, React 19, TypeScript',
    image: '/assets/The20Ultimate20Next.png',
    duration: '10h 00m',
    isPublished: true,
    isComingSoon: false,
    releaseDate: '',
    hasCertificate: true,
    totalHours: 10,
    completionCriteria: 'Complete all lessons and knowledge checks to earn your certificate.',
    instructorId: 'yahye',
    seriesName: '',
    seriesOrder: undefined,
    nextCourseSlug: '',
  });

  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required.');
      return;
    }
    if (isUploading) {
      setError('Please wait for image upload to complete before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tagArray = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);

      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          totalHours: Number(formData.totalHours),
          tags: tagArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create course');

      router.push(`/admin/courses/${data.course.slug}/edit`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans pb-16">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/courses"
          className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Courses
        </Link>
        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1">
          <Sparkles size={13} /> Step 1: Core Setup & Settings
        </span>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-black text-white tracking-tight">Create New Course</h1>
        <p className="text-sm text-gray-400">
          Set up basic course metadata, publication status, accreditation, pricing, and cover image.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <CourseFormFields
          formData={formData}
          setFormData={setFormData}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
          isEditMode={false}
        />

        {/* Submit Bar */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving || isUploading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Creating Course…' : 'Create Course & Open Studio →'}
          </button>
        </div>
      </form>
    </div>
  );
}

