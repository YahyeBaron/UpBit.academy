'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course, CurriculumSection, Lesson } from '@/lib/data';
import { UploadDropzone } from '@/lib/uploadthing';
import {
  Save,
  Plus,
  Trash2,
  Video,
  FileText,
  Check,
  AlertCircle,
  Layers,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  Play,
  Download,
  HelpCircle,
  CheckCircle2,
  X,
  File,
} from 'lucide-react';

interface CourseEditorProps {
  course: Course;
}

interface ResourceItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  lessonId?: string | null;
}

interface QuizChoiceInput {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestionInput {
  id?: string;
  question: string;
  type: string;
  points: number;
  choices: QuizChoiceInput[];
}

interface QuizData {
  id?: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number;
  questions: QuizQuestionInput[];
}

import CourseFormFields, { CourseFormData } from '@/components/admin/course-form-fields';

export default function CourseEditor({ course: initialCourse }: CourseEditorProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'resources' | 'quizzes' | 'info'>('curriculum');
  const [formData, setFormData] = useState<CourseFormData>({
    title: initialCourse.title || '',
    slug: initialCourse.slug || '',
    tagline: initialCourse.tagline || '',
    category: initialCourse.category || 'frontend',
    level: initialCourse.level || 'Beginner',
    price: Number(initialCourse.price ?? 0),
    originalPrice: Number(initialCourse.originalPrice ?? 0),
    description: initialCourse.description || '',
    longDescription: initialCourse.longDescription || '',
    tags: (initialCourse.tags || []).join(', '),
    image: initialCourse.image || '',
    duration: initialCourse.duration || '4h 00m',
    isPublished: initialCourse.isPublished ?? true,
    isComingSoon: initialCourse.isComingSoon ?? false,
    releaseDate: initialCourse.releaseDate || '',
    hasCertificate: initialCourse.hasCertificate ?? true,
    totalHours: Number(initialCourse.totalHours ?? 0),
    completionCriteria: initialCourse.completionCriteria || 'Complete all lessons and knowledge checks to earn your certificate.',
    instructorId: initialCourse.instructorId || 'yahye',
    seriesName: initialCourse.seriesName || '',
    seriesOrder: initialCourse.seriesOrder ?? undefined,
    nextCourseSlug: initialCourse.nextCourseSlug || '',
  });

  const [curriculum, setCurriculum] = useState<CurriculumSection[]>(initialCourse.curriculum || []);
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Resources Tab State
  const [selectedLessonForResource, setSelectedLessonForResource] = useState<string>('');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Quizzes Tab State
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState<string>('');
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const allLessons = curriculum.flatMap((s) => s.lessons);

  useEffect(() => {
    if (allLessons.length > 0 && !selectedLessonForResource) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLessonForResource(allLessons[0].id);
    }
    if (allLessons.length > 0 && !selectedLessonForQuiz) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLessonForQuiz(allLessons[0].id);
    }
  }, [curriculum]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchResources = async () => {
    setLoadingResources(true);
    try {
      const url = selectedLessonForResource
        ? `/api/resources?courseId=${formData.slug}&lessonId=${selectedLessonForResource}`
        : `/api/resources?courseId=${formData.slug}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.resources) setResources(data.resources);
    } catch {
      showToast('Failed to fetch resources');
    } finally {
      setLoadingResources(false);
    }
  };

  const deleteResource = async (id: string) => {
    try {
      await fetch(`/api/resources?id=${id}`, { method: 'DELETE' });
      setResources((prev) => prev.filter((r) => r.id !== id));
      showToast('Resource removed');
    } catch {
      showToast('Failed to delete resource');
    }
  };

  const fetchQuizForLesson = async (lessonId: string) => {
    setLoadingQuiz(true);
    try {
      const res = await fetch(`/api/admin/quizzes?lessonId=${lessonId}`);
      const data = await res.json();
      if (data.quizzes && data.quizzes.length > 0) {
        const q = data.quizzes[0];
        setActiveQuiz({
          id: q.id,
          lessonId: q.lessonId,
          title: q.title,
          description: q.description || '',
          passingScore: q.passingScore || 70,
          questions: q.questions.map((quest: any) => ({
            id: quest.id,
            question: quest.question,
            type: quest.type || 'MULTIPLE_CHOICE',
            points: quest.points || 1,
            choices: quest.choices.map((c: any) => ({
              id: c.id,
              text: c.text,
              isCorrect: Boolean(c.isCorrect),
            })),
          })),
        });
      } else {
        const lesson = allLessons.find((l) => l.id === lessonId);
        setActiveQuiz({
          lessonId,
          title: `${lesson?.title || 'Lesson'} Knowledge Check`,
          description: 'Test your understanding of the key concepts from this lesson.',
          passingScore: 70,
          questions: [
            {
              question: 'What is the primary concept covered in this lesson?',
              type: 'MULTIPLE_CHOICE',
              points: 1,
              choices: [
                { text: 'Option A (Correct answer)', isCorrect: true },
                { text: 'Option B (Incorrect answer)', isCorrect: false },
                { text: 'Option C (Incorrect answer)', isCorrect: false },
              ],
            },
          ],
        });
      }
    } catch {
      showToast('Error loading quiz');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Load resources when selected lesson changes or tab changes
  useEffect(() => {
    if (activeTab === 'resources' && formData.slug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchResources();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLessonForResource, formData.slug]);

  // Load quiz when selected lesson changes in Quizzes tab
  useEffect(() => {
    if (activeTab === 'quizzes' && selectedLessonForQuiz) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchQuizForLesson(selectedLessonForQuiz);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedLessonForQuiz]);


  const saveQuiz = async () => {
    if (!activeQuiz || !activeQuiz.title.trim()) return;
    setSavingQuiz(true);
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeQuiz),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save quiz');
      showToast('Quiz saved successfully!');
      if (data.quiz) {
        setActiveQuiz(data.quiz);
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving quiz');
    } finally {
      setSavingQuiz(false);
    }
  };

  // Section Handlers
  const addSection = () => {
    const newSection: CurriculumSection = {
      title: `Section ${curriculum.length + 1}: New Module`,
      lessons: [
        {
          id: `lesson-${Date.now()}`,
          title: 'Lesson 1: Introduction',
          duration: '10:00',
          type: 'video',
          preview: true,
          muxPlaybackId: '',
        },
      ],
    };
    setCurriculum([...curriculum, newSection]);
  };

  const updateSectionTitle = (sIdx: number, newTitle: string) => {
    const updated = [...curriculum];
    updated[sIdx].title = newTitle;
    setCurriculum(updated);
  };

  const deleteSection = (sIdx: number) => {
    setCurriculum(curriculum.filter((_, idx) => idx !== sIdx));
  };

  // Lesson Handlers
  const addLesson = (sIdx: number) => {
    const updated = [...curriculum];
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Video Lesson',
      duration: '12:30',
      type: 'video',
      preview: false,
      muxPlaybackId: '',
    };
    updated[sIdx].lessons.push(newLesson);
    setCurriculum(updated);
  };

  const updateLesson = (sIdx: number, lIdx: number, key: keyof Lesson, value: any) => {
    const updated = [...curriculum];
    updated[sIdx].lessons[lIdx] = {
      ...updated[sIdx].lessons[lIdx],
      [key]: value,
    };
    setCurriculum(updated);
  };

  const deleteLesson = (sIdx: number, lIdx: number) => {
    const updated = [...curriculum];
    updated[sIdx].lessons = updated[sIdx].lessons.filter((_, idx) => idx !== lIdx);
    setCurriculum(updated);
  };

  // Save changes
  const handleSave = async () => {
    if (isUploading) {
      setError('Please wait for image upload to complete before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const tagArray = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);

      const res = await fetch(`/api/admin/courses/${formData.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          originalPrice: Number(formData.originalPrice),
          totalHours: Number(formData.totalHours),
          tags: tagArray,
          curriculum,
          totalLessons: curriculum.reduce((acc, s) => acc + s.lessons.length, 0),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');

      showToast('Course settings & curriculum saved successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error saving course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in">
          <Check size={14} /> {toast}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] uppercase">
              {formData.category}
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                !formData.isPublished
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : formData.isComingSoon
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
            >
              {!formData.isPublished
                ? '○ Hidden Draft'
                : formData.isComingSoon
                ? '🚀 Coming Soon'
                : '● Live Published'}
            </span>
            {formData.hasCertificate && (
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase">
                Certificate
              </span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">{formData.title}</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">/{formData.slug}</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || isUploading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50"
        >
          <Save size={15} /> {saving ? 'Saving Studio…' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`flex items-center gap-2 text-xs font-bold py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'curriculum'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Layers size={14} /> Curriculum Builder ({allLessons.length} Lessons)
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 text-xs font-bold py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'resources'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Download size={14} /> Lesson Resources & PDFs
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 text-xs font-bold py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'quizzes'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <HelpCircle size={14} /> Quiz Builder
        </button>

        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 text-xs font-bold py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'info'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Settings size={14} /> Settings & Metadata
        </button>
      </div>

      {/* TAB 1: CURRICULUM BUILDER */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-300">Modules & Curriculum Sections</h2>
            <button
              onClick={addSection}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
            >
              <Plus size={14} /> Add Curriculum Section
            </button>
          </div>

          <div className="space-y-6">
            {curriculum.map((section, sIdx) => (
              <div key={sIdx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 shadow-xl">
                {/* Section Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-md">
                      M{sIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addLesson(sIdx)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 font-semibold transition-colors"
                    >
                      <Plus size={13} /> Add Lesson
                    </button>
                    <button
                      onClick={() => deleteSection(sIdx)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Lessons List */}
                <div className="space-y-3 pl-2 sm:pl-4">
                  {section.lessons.map((lesson, lIdx) => (
                    <div key={lesson.id || lIdx} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <span className="text-gray-500 text-xs font-mono">{lIdx + 1}.</span>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLesson(sIdx, lIdx, 'title', e.target.value)}
                            className="flex-1 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>

                        {/* Lesson Properties Controls */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lesson.duration}
                            onChange={(e) => updateLesson(sIdx, lIdx, 'duration', e.target.value)}
                            placeholder="12:00"
                            className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-center font-mono text-gray-300"
                          />

                          <select
                            value={lesson.type}
                            onChange={(e) => updateLesson(sIdx, lIdx, 'type', e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-[#030a16] border border-white/10 text-[11px] font-semibold text-gray-300"
                          >
                            <option value="video">Video</option>
                            <option value="quiz">Quiz</option>
                            <option value="project">Project</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => updateLesson(sIdx, lIdx, 'preview', !lesson.preview)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                              lesson.preview
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-white/5 text-gray-500 border-white/10'
                            }`}
                          >
                            {lesson.preview ? 'Free Preview' : 'Locked'}
                          </button>

                          <button
                            onClick={() => deleteLesson(sIdx, lIdx)}
                            className="p-1 rounded hover:text-red-400 text-gray-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Mux Playback ID Input */}
                      {lesson.type === 'video' && (
                        <div className="flex items-center gap-2 text-xs pt-1 border-t border-white/5">
                          <Play size={12} className="text-blue-400 shrink-0" />
                          <span className="text-[10px] text-gray-400 font-mono shrink-0">Mux Playback ID:</span>
                          <input
                            type="text"
                            value={lesson.muxPlaybackId || ''}
                            onChange={(e) => updateLesson(sIdx, lIdx, 'muxPlaybackId', e.target.value)}
                            placeholder="iybZvocdgFrKRGg81D01oZhOC2vAdl02QZxPOspT00sY68"
                            className="flex-1 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCES MANAGER */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Download size={16} className="text-blue-400" /> Lesson Resource Uploader
            </h3>
            <p className="text-xs text-gray-400">
              Select a lesson to attach downloadable resources (PDF slides, starter code ZIPs, cheat sheets).
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300">Target Lesson:</label>
              <select
                value={selectedLessonForResource}
                onChange={(e) => setSelectedLessonForResource(e.target.value)}
                className="w-full sm:w-96 px-3 py-2 rounded-xl bg-[#030a16] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
              >
                {allLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <UploadDropzone
                endpoint="courseResourceUploader"
                onClientUploadComplete={async (res) => {
                  for (const f of res) {
                    await fetch('/api/resources', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        courseId: formData.slug,
                        lessonId: selectedLessonForResource,
                        key: f.key,
                        url: f.ufsUrl || f.url,
                        name: f.name,
                        size: f.size,
                        type: f.type,
                      }),
                    });
                  }
                  showToast(`${res.length} resource(s) uploaded successfully!`);
                  fetchResources();
                }}
                onUploadError={(err) => showToast(`Upload failed: ${err.message}`)}
                className="ut-label:text-gray-400 ut-allowed-content:text-gray-500 ut-upload-icon:text-blue-400 border-white/10 bg-white/5 rounded-xl min-h-[140px]"
              />
            </div>
          </div>

          {/* Uploaded Files Table */}
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Uploaded Files ({resources.length})
            </h4>

            {loadingResources ? (
              <p className="text-xs text-gray-500">Loading resources…</p>
            ) : resources.length > 0 ? (
              <div className="space-y-2">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <File size={16} className="text-blue-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block">{res.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {(res.size / (1024 * 1024)).toFixed(2)} MB • Lesson ID: {res.lessonId || 'Course level'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 text-xs font-semibold transition-colors"
                      >
                        Preview
                      </a>
                      <button
                        onClick={() => deleteResource(res.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No resources uploaded for this lesson yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: QUIZ BUILDER */}
      {activeTab === 'quizzes' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle size={16} className="text-cyan-400" /> Lesson Quiz Builder
            </h3>
            <p className="text-xs text-gray-400">
              Create interactive multiple-choice quizzes attached to any lesson in this course.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300">Select Lesson:</label>
              <select
                value={selectedLessonForQuiz}
                onChange={(e) => setSelectedLessonForQuiz(e.target.value)}
                className="w-full sm:w-96 px-3 py-2 rounded-xl bg-[#030a16] border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
              >
                {allLessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingQuiz ? (
            <p className="text-xs text-gray-500">Loading quiz editor…</p>
          ) : activeQuiz ? (
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6 shadow-xl">
              {/* Quiz General Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-300">Quiz Title</label>
                  <input
                    type="text"
                    value={activeQuiz.title}
                    onChange={(e) => setActiveQuiz({ ...activeQuiz, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-300">Passing Score (%)</label>
                  <input
                    type="number"
                    value={activeQuiz.passingScore}
                    onChange={(e) => setActiveQuiz({ ...activeQuiz, passingScore: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-300">Description</label>
                <input
                  type="text"
                  value={activeQuiz.description || ''}
                  onChange={(e) => setActiveQuiz({ ...activeQuiz, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white"
                />
              </div>

              {/* Questions List */}
              <div className="space-y-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Questions ({activeQuiz.questions.length})
                  </h4>

                  <button
                    onClick={() => {
                      const newQ: QuizQuestionInput = {
                        question: `New Question ${activeQuiz.questions.length + 1}`,
                        type: 'MULTIPLE_CHOICE',
                        points: 1,
                        choices: [
                          { text: 'Choice 1', isCorrect: true },
                          { text: 'Choice 2', isCorrect: false },
                        ],
                      };
                      setActiveQuiz({
                        ...activeQuiz,
                        questions: [...activeQuiz.questions, newQ],
                      });
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
                  >
                    <Plus size={13} /> Add Question
                  </button>
                </div>

                {activeQuiz.questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-1 rounded">
                          Q{qIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const updated = [...activeQuiz.questions];
                            updated[qIdx].question = e.target.value;
                            setActiveQuiz({ ...activeQuiz, questions: updated });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <button
                        onClick={() => {
                          const updated = activeQuiz.questions.filter((_, idx) => idx !== qIdx);
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        className="p-1 rounded hover:text-red-400 text-gray-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Choices List */}
                    <div className="space-y-2 pl-6">
                      <label className="block text-[11px] font-bold text-gray-400 uppercase">Answer Choices:</label>
                      {q.choices.map((c, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={c.isCorrect}
                            onChange={(e) => {
                              const updated = [...activeQuiz.questions];
                              // If checking, set other choices to false for single select
                              updated[qIdx].choices = updated[qIdx].choices.map((ch, idx) => ({
                                ...ch,
                                isCorrect: idx === cIdx ? e.target.checked : e.target.checked ? false : ch.isCorrect,
                              }));
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-white/10 border-white/20"
                            title="Mark as correct answer"
                          />
                          <input
                            type="text"
                            value={c.text}
                            onChange={(e) => {
                              const updated = [...activeQuiz.questions];
                              updated[qIdx].choices[cIdx].text = e.target.value;
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            className={`flex-1 px-3 py-1 rounded-lg bg-white/5 border text-xs text-white focus:outline-none ${
                              c.isCorrect ? 'border-emerald-500/50 text-emerald-300' : 'border-white/10'
                            }`}
                          />
                          <button
                            onClick={() => {
                              const updated = [...activeQuiz.questions];
                              updated[qIdx].choices = updated[qIdx].choices.filter((_, idx) => idx !== cIdx);
                              setActiveQuiz({ ...activeQuiz, questions: updated });
                            }}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => {
                          const updated = [...activeQuiz.questions];
                          updated[qIdx].choices.push({
                            text: `Option ${updated[qIdx].choices.length + 1}`,
                            isCorrect: false,
                          });
                          setActiveQuiz({ ...activeQuiz, questions: updated });
                        }}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 mt-1 inline-block"
                      >
                        + Add Choice Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Quiz button */}
              <div className="pt-4 flex justify-end">
                <button
                  onClick={saveQuiz}
                  disabled={savingQuiz}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:from-cyan-500 transition-all disabled:opacity-50"
                >
                  <Save size={14} /> {savingQuiz ? 'Saving Quiz…' : 'Save Quiz'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 4: COURSE SETTINGS & METADATA */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          <CourseFormFields
            formData={formData}
            setFormData={setFormData}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
            isEditMode={true}
          />
        </div>
      )}
    </div>
  );
}
