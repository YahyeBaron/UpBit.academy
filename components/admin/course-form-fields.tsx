'use client';

import React from 'react';
import Image from 'next/image';
import { UploadDropzone } from '@/lib/uploadthing';
import { getCourseImageUrl } from '@/lib/course-image';
import {
  Globe,
  Lock,
  Award,
  Clock,
  FileCheck2,
  DollarSign,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  Info,
  GraduationCap,
  Rocket,
  Calendar,
  Compass,
} from 'lucide-react';

export interface CourseFormData {
  title: string;
  slug: string;
  tagline: string;
  category: 'frontend' | '3d' | 'saas' | 'career' | string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' | string;
  price: number;
  originalPrice: number;
  description: string;
  longDescription: string;
  tags: string;
  image: string;
  duration: string;
  isPublished: boolean;
  isComingSoon?: boolean;
  releaseDate?: string;
  hasCertificate: boolean;
  totalHours: number;
  completionCriteria: string;
  instructorId?: string;
  seriesName?: string;
  seriesOrder?: number;
  nextCourseSlug?: string;
}

interface CourseFormFieldsProps {
  formData: CourseFormData;
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>>;
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
  isEditMode?: boolean;
}

export default function CourseFormFields({
  formData,
  setFormData,
  isUploading,
  setIsUploading,
  isEditMode = false,
}: CourseFormFieldsProps) {
  const currentImageUrl = getCourseImageUrl(formData.image);
  const [instructorsList, setInstructorsList] = React.useState<
    { id: string; name: string; title: string; avatar: string }[]
  >([]);

  React.useEffect(() => {
    fetch('/api/admin/instructors')
      .then((res) => res.json())
      .then((data) => {
        if (data.instructors && Array.isArray(data.instructors)) {
          setInstructorsList(data.instructors);
        }
      })
      .catch(() => {});
  }, []);

  const selectedInstructor =
    instructorsList.find((i) => i.id === (formData.instructorId || 'yahye')) ||
    instructorsList[0];

  const isDraft = !formData.isPublished;
  const isComingSoon = Boolean(formData.isPublished && formData.isComingSoon);
  const isLive = Boolean(formData.isPublished && !formData.isComingSoon);

  return (
    <div className="space-y-8 font-sans">
      {/* ── 1. PUBLICATION & VISIBILITY STATUS ── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isDraft && <Lock size={16} className="text-amber-400" />}
              {isComingSoon && <Rocket size={16} className="text-indigo-400" />}
              {isLive && <Globe size={16} className="text-emerald-400" />}
              Publication Status
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDraft && 'This course is a Draft and hidden from the public catalog, enrollment, and checkout.'}
              {isComingSoon && 'Coming Soon: Discoverable in catalog with a waitlist form. Purchases and player access are locked until launch.'}
              {isLive && 'This course is Live and discoverable by students with full purchasing and learning access.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/10 flex-wrap">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isPublished: false, isComingSoon: false }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isDraft
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Lock size={13} /> Draft (Hidden)
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isPublished: true, isComingSoon: true }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isComingSoon
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Rocket size={13} /> Coming Soon (Waitlist)
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isPublished: true, isComingSoon: false }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe size={13} /> Published (Live)
            </button>
          </div>
        </div>

        {isDraft && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-400" />
            <span>
              Draft mode ensures this course is safely isolated while you curate curriculum, configure prices, and review media.
            </span>
          </div>
        )}

        {isComingSoon && (
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs space-y-3">
            <div className="flex items-start gap-2">
              <Rocket size={16} className="shrink-0 mt-0.5 text-indigo-400" />
              <div>
                <span className="font-bold text-white block mb-0.5">Waitlist Mode Active</span>
                <span>
                  Students cannot buy or access course materials while locked. Instead, they can register for the priority waitlist to be notified on launch day.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-indigo-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1 flex items-center gap-1">
                  <Calendar size={12} /> Target Release Month / Date (Optional)
                </label>
                <input
                  type="text"
                  value={formData.releaseDate || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, releaseDate: e.target.value }))}
                  placeholder="e.g. October 2026, Q4 2026, or Next Month"
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-indigo-500/30 text-xs text-white placeholder-indigo-300/40 focus:outline-none focus:border-indigo-400"
                />
              </div>
              <p className="text-[11px] text-indigo-300/80 leading-relaxed">
                Displayed as a lock banner on the course detail card (e.g. &quot;Locked until October 2026&quot;).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. GENERAL METADATA ── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-blue-400">
          General Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">Course Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => {
                const titleVal = e.target.value;
                if (!isEditMode) {
                  const slugVal = titleVal
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)+/g, '');
                  setFormData((prev) => ({ ...prev, title: titleVal, slug: slugVal }));
                } else {
                  setFormData((prev) => ({ ...prev, title: titleVal }));
                }
              }}
              placeholder="e.g. Next.js 15 & React 19 Architect"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">URL Slug {isEditMode ? '(Immutable)' : '*'}</label>
            <input
              type="text"
              required
              disabled={isEditMode}
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="nextjs-15-architect"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">Tagline</label>
          <input
            type="text"
            value={formData.tagline}
            onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
            placeholder="Build enterprise SaaS apps with dynamic server actions and streaming"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#030a16] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="frontend">Frontend & Fullstack</option>
              <option value="3d">3D & Creative WebGL</option>
              <option value="saas">SaaS & Architecture</option>
              <option value="career">Career & System Design</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">Difficulty Level</label>
            <select
              value={formData.level}
              onChange={(e) => setFormData((prev) => ({ ...prev, level: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-[#030a16] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">Estimated Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
              placeholder="18h 30m"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
            placeholder="Next.js 15, React 19, TypeScript, PostgreSQL"
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* ── Assigned Instructor Selector ── */}
        <div className="space-y-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <GraduationCap size={15} className="text-cyan-400" /> Assigned Lead Instructor *
            </label>
            <span className="text-[11px] text-gray-400">
              Instructor shown on course page & certificates
            </span>
          </div>

          <div className="flex items-center gap-3">
            {selectedInstructor && (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20 shrink-0 bg-gray-900">
                <Image
                  src={selectedInstructor.avatar || '/assets/pri-next.jpg'}
                  alt={selectedInstructor.name || 'Instructor'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <select
              value={formData.instructorId || 'yahye'}
              onChange={(e) => setFormData((prev) => ({ ...prev, instructorId: e.target.value }))}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#030a16] border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {instructorsList.length > 0 ? (
                instructorsList.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} — {inst.title}
                  </option>
                ))
              ) : (
                <>
                  <option value="yahye">Yahye Baron — Lead Instructor & Full-Stack Architect</option>
                  <option value="alex">Alex Rivera — WebGL Specialist & GSAP Animator</option>
                  <option value="sarah">Sarah Kim — SaaS Founder & Backend Architect</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">Short Summary *</label>
          <textarea
            rows={2}
            required
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="A concise overview of what students will accomplish in this course..."
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">Long Description / Syllabus Overview</label>
          <textarea
            rows={4}
            value={formData.longDescription}
            onChange={(e) => setFormData((prev) => ({ ...prev, longDescription: e.target.value }))}
            placeholder="Detailed course description, prerequisites, architectural concepts, and expected outcomes..."
            className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
      </div>

      {/* ── 3. PRICING & COMMERCE ── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-emerald-400 flex items-center gap-1.5">
          <DollarSign size={14} /> Pricing & Commercials
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">Selling Price ($ USD) *</label>
            <input
              type="number"
              min={0}
              step="any"
              required
              value={formData.price}
              onChange={(e) => setFormData((prev) => ({ ...prev, price: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] text-gray-400">Set to 0 for 100% free courses.</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300">Original / Strikethrough Price ($ USD)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={formData.originalPrice}
              onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: Number(e.target.value) }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-gray-400 focus:outline-none focus:border-gray-500"
            />
            <span className="text-[11px] text-gray-400">Displayed crossed out to highlight discount value.</span>
          </div>
        </div>
      </div>

      {/* ── 4. CERTIFICATION & ACCREDITATION SETTINGS ── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-cyan-400 flex items-center gap-1.5">
          <Award size={14} /> Accreditation, Total Hours & Completion Rules
        </h3>

        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div>
            <span className="text-xs font-bold text-white block">Certificate Eligibility</span>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              Issue a verified digital certificate with QR verification code upon 100% completion.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, hasCertificate: !prev.hasCertificate }))}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              formData.hasCertificate
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {formData.hasCertificate ? 'Certificate Enabled' : 'No Certificate'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300 flex items-center gap-1">
              <Clock size={13} className="text-cyan-400" /> Total Accredited Hours
            </label>
            <input
              type="number"
              min={0}
              step="0.1"
              value={formData.totalHours}
              onChange={(e) => setFormData((prev) => ({ ...prev, totalHours: Number(e.target.value) }))}
              placeholder="e.g. 18.5"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[11px] text-gray-400">Printed on official completion certificates.</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-300 flex items-center gap-1">
              <FileCheck2 size={13} className="text-cyan-400" /> Completion Criteria
            </label>
            <textarea
              rows={2}
              value={formData.completionCriteria}
              onChange={(e) => setFormData((prev) => ({ ...prev, completionCriteria: e.target.value }))}
              placeholder="Complete all lessons, quizzes with >= 80%, and deploy the final capstone project."
              className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── 5. COURSE SERIES & LEARNING TRACK (ROADMAP) ── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-indigo-400 flex items-center gap-1.5">
              <Compass size={14} /> Course Series & Learning Track (RoadMap)
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Group this course into a sequential multi-course curriculum track (e.g. CS50 Computer Science).
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (formData.seriesName) {
                setFormData((prev) => ({ ...prev, seriesName: '', seriesOrder: undefined, nextCourseSlug: '' }));
              } else {
                setFormData((prev) => ({ ...prev, seriesName: 'CS50 Computer Science', seriesOrder: 0 }));
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              formData.seriesName
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            {formData.seriesName ? 'Series Track Active' : 'Standalone Course'}
          </button>
        </div>

        {Boolean(formData.seriesName) && (
          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Series / Track Name *</label>
                <input
                  type="text"
                  value={formData.seriesName || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seriesName: e.target.value }))}
                  placeholder="e.g. CS50 Computer Science"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                />
                <span className="text-[10px] text-gray-400">Courses with the same series name appear connected on the RoadMap.</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Position / Week Order Number *</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formData.seriesOrder ?? 0}
                  onChange={(e) => setFormData((prev) => ({ ...prev, seriesOrder: Number(e.target.value) }))}
                  placeholder="e.g. 0 for Week 0, 1 for Week 1"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-300 font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-gray-400">Order in sequence (0, 1, 2... 10).</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">Next Course Slug (Optional Override)</label>
              <input
                type="text"
                value={formData.nextCourseSlug || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, nextCourseSlug: e.target.value }))}
                placeholder="Leave blank to automatically suggest next course by order"
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-gray-400">Upon 100% completion, students are recommended to proceed to this course.</span>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. COURSE COVER BANNER & MEDIA ── */}
      <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[11px] text-purple-400 flex items-center gap-1.5">
            <ImageIcon size={14} /> Course Cover Banner
          </h3>

          {formData.image && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, image: '' }))}
              className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-bold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <Trash2 size={12} /> Remove Image
            </button>
          )}
        </div>

        {/* Live Preview Thumbnail */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-black/40 border border-white/10">
          <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-gray-900 border border-white/10 shrink-0">
            <Image
              src={currentImageUrl}
              alt="Course Banner Preview"
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-1 text-left flex-1 w-full">
            <p className="text-xs font-bold text-white">Active Banner Preview</p>
            <p className="text-[11px] text-gray-400 font-mono truncate max-w-md">
              {formData.image || '(Using default asset fallback: /assets/w-rc.jpg)'}
            </p>
            <p className="text-[10px] text-gray-500">
              Recommended: 16:9 ratio (1280x720 or 1920x1080), PNG, JPG, or WebP up to 8MB.
            </p>
          </div>
        </div>

        {/* Direct URL Override */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-300">Direct Banner URL or Asset Path</label>
          <input
            type="text"
            value={formData.image}
            onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
            placeholder="/assets/The20Ultimate20Next.png or https://utfs.io/f/..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* UploadDropzone with state lock */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-300">Upload New Cover Image</label>
          <UploadDropzone
            endpoint="courseResourceUploader"
            onUploadBegin={() => setIsUploading(true)}
            onClientUploadComplete={(res) => {
              setIsUploading(false);
              if (res?.[0]) {
                const url = res[0].ufsUrl || res[0].url;
                setFormData((prev) => ({ ...prev, image: url }));
              }
            }}
            onUploadError={(err) => {
              setIsUploading(false);
              alert(`Upload error: ${err.message}`);
            }}
            className="ut-label:text-gray-400 ut-allowed-content:text-gray-500 border-white/10 bg-white/5 rounded-xl min-h-[120px]"
          />
        </div>

        {isUploading && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center gap-2">
            <Info size={14} className="animate-spin" /> Uploading image to CDN... please wait before saving.
          </div>
        )}
      </div>
    </div>
  );
}
