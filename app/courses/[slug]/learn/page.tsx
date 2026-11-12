'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import MuxPlayer from '@mux/mux-player-react';
import { Course, Lesson } from '@/lib/data';
import { UploadDropzone } from '@/lib/uploadthing';
import CodeSandbox from '@/components/code-sandbox';
import CertificateModal from '@/components/certificate-modal';
import {
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  Download,
  BookOpen,
  ArrowLeft,
  Share2,
  Send,
  ThumbsUp,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Trophy,
  ClipboardList,
  Rocket,
  Code2,
  AlertCircle,
  Loader2,
  Volume2,
  Reply,
  Compass,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────
interface DiscussionThread {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  lessonId?: string | null;
  user: { id: string; name: string; avatar?: string; role: string };
  replies: DiscussionReply[];
}

interface DiscussionReply {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string; role: string };
}

interface NoteRecord {
  id: string;
  content: string;
  videoTime: number;
  createdAt: string;
  updatedAt?: string;
}

interface ResourceRecord {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  lessonId?: string | null;
  courseId?: string | null;
}

interface LessonProgressRecord {
  lessonId: string;
  completed: boolean;
  watchedPct: number;
  lastPositionSeconds: number;
  durationSeconds?: number | null;
}

// ─── Player state type ────────────────────────────────
type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

// ─── Helpers ───────────────────────────────────────────
function formatVideoTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

// ─── Root Page Component ───────────────────────────────
export default function CoursePlayerPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [pageState, setPageState] = useState<'loading' | 'unauthorized' | 'error' | 'notfound' | 'ready' | 'coming_soon'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setPageState('loading');

    fetch(`/api/courses/${slug}`)
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          setPageState('unauthorized');
          return;
        }
        if (r.status === 404) {
          setPageState('notfound');
          return;
        }
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setErrorMessage(body?.error || 'Failed to load course');
          setPageState('error');
          return;
        }
        const data = await r.json();
        if (data.course) {
          if (data.course.isComingSoon) {
            try {
              const enrollRes = await fetch(`/api/enroll?courseId=${slug}`);
              const enrollData = await enrollRes.json();
              if (!enrollData?.isAdmin) {
                setCourse(data.course);
                setPageState('coming_soon');
                return;
              }
            } catch {
              setCourse(data.course);
              setPageState('coming_soon');
              return;
            }
          }
          setCourse(data.course);
          setPageState('ready');
        } else {
          setPageState('notfound');
        }
      })
      .catch(() => {
        setErrorMessage('Network error — please check your connection and try again');
        setPageState('error');
      });
  }, [slug]);

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#020813] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <Loader2 className="w-8 h-8 text-blue-500/60 animate-spin mx-auto" />
          <p className="text-xs text-gray-500">Loading course…</p>
        </div>
      </div>
    );
  }

  if (pageState === 'notfound') return notFound();

  if (pageState === 'unauthorized') {
    return (
      <div className="min-h-screen bg-[#020813] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-white/10">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-gray-400">
            You need an active enrollment to access this course. Please enroll or sign in.
          </p>
          <div className="flex flex-col gap-2">
            <Link href={`/courses/${slug}`} className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors">
              Enroll in Course
            </Link>
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'coming_soon') {
    return (
      <div className="min-h-screen bg-[#020813] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-5 p-8 rounded-3xl bg-white/[0.03] border border-indigo-500/30 backdrop-blur-xl shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
            <Rocket className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Coming Soon • Pre-Launch Mode
          </div>
          <h2 className="text-2xl font-black text-white">{course?.title || 'Course In Pre-Release'}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            This course is currently locked and preparing for launch{course?.releaseDate ? ` (${course.releaseDate})` : ''}.
            Direct player access will unlock automatically on launch day!
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href={`/courses/${slug}`}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25"
            >
              Join Priority Waitlist
            </Link>
            <Link
              href="/courses"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Browse Available Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'error' || !course) {
    return (
      <div className="min-h-screen bg-[#020813] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-white/5 border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Something Went Wrong</h2>
          <p className="text-sm text-gray-400">{errorMessage || 'An unexpected error occurred.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <CoursePlayer course={course} slug={slug} />;
}

// ─── Main Player Component ─────────────────────────────
function CoursePlayer({ course, slug }: { course: Course; slug: string }) {
  const allLessons: Lesson[] = course.curriculum.flatMap((s) => s.lessons);

  // Core lesson state
  const [activeLesson, setActiveLesson] = useState<Lesson>(allLessons[0]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [serverProgress, setServerProgress] = useState(0);
  const [lessonProgressMap, setLessonProgressMap] = useState<Map<string, LessonProgressRecord>>(new Map());

  // Player state machine
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [videoProgress, setVideoProgress] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Mux signed playback tokens
  const [playbackTokens, setPlaybackTokens] = useState<{
    playback?: string;
    thumbnail?: string;
    storyboard?: string;
  } | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'sandbox' | 'resources' | 'discussion'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Set<number>>(() => new Set([0]));

  // Auto-advance state
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  // Completion / Certificate modals
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const completionFiredRef = useRef(false);
  const [certificateData, setCertificateData] = useState<{ id: string; verificationCode: string } | null>(null);
  const [nextCourseData, setNextCourseData] = useState<{ title: string; slug: string } | null>(null);

  useEffect(() => {
    if (course.nextCourseSlug) {
      fetch(`/api/courses/${course.nextCourseSlug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.course) {
            setNextCourseData({ title: d.course.title, slug: d.course.slug });
          }
        })
        .catch(() => {});
    }
  }, [course.nextCourseSlug]);

  // Notes state
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [noteUpdating, setNoteUpdating] = useState(false);
  // Draft input is preserved across tab switches (not lesson switches)
  const noteDraftRef = useRef('');

  // Resources state
  const [resources, setResources] = useState<ResourceRecord[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  // Discussion state
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [postingThread, setPostingThread] = useState(false);

  // Stable refs
  const videoTimeRef = useRef(0);
  // Mirror of videoTimeRef for display in JSX — refs do not trigger re-renders
  // so we keep a separate state value updated alongside the ref.
  const [displayVideoTimeSec, setDisplayVideoTimeSec] = useState(0);
  const lastSavedTimeRef = useRef(0);
  const ninetyPctFiredRef = useRef(false);
  const completionSentRef = useRef(false);
  const lessonIdRef = useRef(allLessons[0]?.id ?? '');
  const muxPlayerRef = useRef<any>(null);

  // ─── Update lessonId ref ──────────────────────────────
  useEffect(() => {
    lessonIdRef.current = activeLesson.id;
  }, [activeLesson.id]);

  // ─── Fetch Mux signed playback tokens ──────────────────
  useEffect(() => {
    if (activeLesson.type !== 'video' || !activeLesson.muxPlaybackId) {
      setPlaybackTokens(null);
      return;
    }

    let isCancelled = false;
    fetch(`/api/courses/${slug}/lessons/${activeLesson.id}/playback`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Playback authorization failed');
        }
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        if (data.playbackConfig?.tokens) {
          setPlaybackTokens(data.playbackConfig.tokens);
        } else if (data.playbackConfig?.token) {
          setPlaybackTokens({ playback: data.playbackConfig.token });
        } else {
          setPlaybackTokens(null);
        }
      })
      .catch((_err) => {
        if (isCancelled) return;
        // Unsigned fallback or unauthenticated preview fallback
        setPlaybackTokens(null);
      });

    return () => {
      isCancelled = true;
    };
  }, [activeLesson.id, activeLesson.type, activeLesson.muxPlaybackId, slug]);

  // ─── Toast helper ─────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── Send progress to server ──────────────────────────
  const sendProgressUpdate = useCallback(
    async (opts: {
      lessonId?: string;
      positionSeconds?: number;
      durationSeconds?: number;
      completed?: boolean;
      explicitComplete?: boolean;
      watchedPct?: number;
    }) => {
      const lessonId = opts.lessonId ?? lessonIdRef.current;
      if (!lessonId) return;
      try {
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: slug,
            lessonId,
            positionSeconds: opts.positionSeconds ?? videoTimeRef.current,
            durationSeconds: opts.durationSeconds,
            completed: opts.completed,
            explicitComplete: opts.explicitComplete,
            watchedPct: opts.watchedPct,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.courseProgress === 'number') {
            setServerProgress(data.courseProgress);
          }
          if (data.completed && lessonId) {
            setCompletedIds((prev) =>
              prev.includes(lessonId) ? prev : [...prev, lessonId]
            );
          }
          return data;
        }
      } catch (err) {
        console.warn('[Progress] Update failed:', err);
      }
      return null;
    },
    [slug]
  );

  // ─── Load initial progress ────────────────────────────
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/progress?courseId=${slug}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.completedLessonIds?.length) {
          setCompletedIds(data.completedLessonIds);
          const firstIncomplete = allLessons.find((l) => !data.completedLessonIds.includes(l.id));
          if (firstIncomplete) {
            setActiveLesson(firstIncomplete);
            course.curriculum.forEach((sec, idx) => {
              if (sec.lessons.some((l) => l.id === firstIncomplete.id)) {
                setOpenSections(new Set([idx]));
              }
            });
          }
        }
        if (typeof data.courseProgress === 'number') {
          setServerProgress(data.courseProgress);
        }
        if (Array.isArray(data.lessonProgress)) {
          const map = new Map<string, LessonProgressRecord>();
          for (const r of data.lessonProgress) {
            map.set(r.lessonId, r);
          }
          setLessonProgressMap(map);
        }
      })
      .catch(() => {/* offline or auth error — silently skip */});
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load notes and resources on lesson change ────────
  useEffect(() => {
    let isMounted = true;
    setNotes([]);
    setResources([]);
    setResourcesError(null);
    setResourcesLoading(true);
    setEditingNoteId(null);
    // Preserve draft input on lesson switch via ref — restore on mount
    setNoteInput(noteDraftRef.current);
    ninetyPctFiredRef.current = false;
    completionSentRef.current = false;
    setVideoProgress(0);
    setPlayerState('idle');
    setPlayerError(null);

    Promise.all([
      fetch(`/api/notes?lessonId=${activeLesson.id}&courseId=${slug}`)
        .then(async (r) => {
          if (r.status === 401 || r.status === 403) return { notes: [] as NoteRecord[], _authFail: true };
          if (!r.ok) return { notes: [] as NoteRecord[] };
          return r.json() as Promise<{ notes?: NoteRecord[] }>;
        })
        .catch(() => ({ notes: [] as NoteRecord[] })),
      fetch(`/api/resources?courseId=${slug}&lessonId=${activeLesson.id}`)
        .then(async (r) => {
          if (r.status === 401 || r.status === 403) return { resources: [] as ResourceRecord[], _authFail: true };
          if (!r.ok) {
            const body = await r.json().catch(() => ({})) as { error?: string };
            return { resources: [] as ResourceRecord[], _error: body?.error || 'Failed to load resources' };
          }
          return r.json() as Promise<{ resources?: ResourceRecord[] }>;
        })
        .catch(() => ({ resources: [] as ResourceRecord[], _error: 'Network error loading resources' })),
    ]).then(([notesData, resourcesData]) => {
      if (!isMounted) return;
      if ((notesData as any)?.notes) setNotes((notesData as any).notes);
      if ((resourcesData as any)?._error) setResourcesError((resourcesData as any)._error);
      if ((resourcesData as any)?.resources) setResources((resourcesData as any).resources);
    }).finally(() => { if (isMounted) setResourcesLoading(false); });

    return () => {
      isMounted = false;
    };
  }, [activeLesson.id, slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load discussions when tab opened ────────────────
  useEffect(() => {
    if (activeTab !== 'discussion') return;
    let isMounted = true;
    setThreadsLoading(true);
    fetch(`/api/discussions?courseId=${slug}`)
      .then((r) => (r.ok ? r.json() : {}) as Promise<{ threads?: DiscussionThread[] }>)
      .then((data) => {
        if (!isMounted) return;
        if (data?.threads) setThreads(data.threads);
      })
      .catch(() => {})
      .finally(() => { if (isMounted) setThreadsLoading(false); });
    return () => { isMounted = false; };
  }, [activeTab, slug]);

  // ─── Course completion detection ──────────────────────
  useEffect(() => {
    if (
      completedIds.length === allLessons.length &&
      allLessons.length > 0 &&
      !completionFiredRef.current
    ) {
      completionFiredRef.current = true;
      setShowCompletionModal(true);
    }
  }, [completedIds.length, allLessons.length]);

  // ─── Window unload beacon ─────────────────────────────
  useEffect(() => {
    const handleExit = () => {
      const lessonId = lessonIdRef.current;
      if (!lessonId) return;
      const payload = JSON.stringify({
        courseId: slug,
        lessonId,
        positionSeconds: videoTimeRef.current,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/progress', new Blob([payload], { type: 'application/json' }));
      } else {
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') handleExit();
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', handleExit);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', handleExit);
    };
  }, [slug]);

  // ─── Keyboard shortcuts ───────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
      if (inInput || e.metaKey || e.ctrlKey || e.altKey) return;

      const player = muxPlayerRef.current;
      if (!player) return;

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (playerState === 'playing') player.pause?.();
        else player.play?.();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (typeof player.currentTime === 'number') player.currentTime = Math.min(player.currentTime + 5, player.duration || Infinity);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (typeof player.currentTime === 'number') player.currentTime = Math.max(0, player.currentTime - 5);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [playerState]);

  // ─── Navigation helpers ───────────────────────────────
  const activeIndex = allLessons.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  const goToLesson = useCallback((lesson: Lesson) => {
    setActiveLesson(lesson);
    setSidebarOpen(false);
    setActiveTab('overview');
    videoTimeRef.current = 0;
    lastSavedTimeRef.current = 0;
    // Clear auto-advance
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    setAutoAdvanceCountdown(null);
  }, []);

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // ─── Mark Complete (manual) ───────────────────────────
  const markComplete = async (lessonId: string) => {
    const alreadyDone = completedIds.includes(lessonId);
    // Optimistic update
    setCompletedIds((prev) =>
      alreadyDone ? prev.filter((i) => i !== lessonId) : [...prev, lessonId]
    );
    const result = await sendProgressUpdate({
      lessonId,
      completed: !alreadyDone,
      explicitComplete: !alreadyDone,
    });
    // Reconcile with server response
    if (result && typeof result.completed === 'boolean') {
      setCompletedIds((prev) =>
        result.completed ? (prev.includes(lessonId) ? prev : [...prev, lessonId]) : prev.filter((i) => i !== lessonId)
      );
    }
  };

  // ─── Auto-advance after lesson ends ──────────────────
  const triggerAutoAdvance = useCallback(() => {
    if (!nextLesson) return;
    let count = 5;
    setAutoAdvanceCountdown(count);
    autoAdvanceTimerRef.current = setInterval(() => {
      count -= 1;
      setAutoAdvanceCountdown(count);
      if (count <= 0) {
        clearInterval(autoAdvanceTimerRef.current!);
        setAutoAdvanceCountdown(null);
        goToLesson(nextLesson);
      }
    }, 1000) as unknown as ReturnType<typeof setTimeout>;
  }, [nextLesson, goToLesson]);

  // ─── Mux player handlers ──────────────────────────────
  const handlePlayerReady = useCallback(() => {
    setPlayerState('ready');
    setPlayerError(null);

    // Resume from last saved position
    const saved = lessonProgressMap.get(activeLesson.id);
    const pos = saved?.lastPositionSeconds;
    if (pos && pos > 5 && !saved?.completed) {
      const player = muxPlayerRef.current;
      if (player && typeof player.currentTime !== 'undefined') {
        player.currentTime = pos;
      }
    }
  }, [activeLesson.id, lessonProgressMap]);

  const handleTimeUpdate = useCallback(
    (e: any) => {
      const curr: number = e.target?.currentTime || 0;
      const dur: number = e.target?.duration || 0;
      videoTimeRef.current = curr;
      setDisplayVideoTimeSec(Math.round(curr));

      if (dur > 0) {
        const pct = Math.round((curr / dur) * 100);
        setVideoProgress(pct);

        // 5-second throttle flush
        if (Math.abs(curr - lastSavedTimeRef.current) >= 5) {
          lastSavedTimeRef.current = curr;
          sendProgressUpdate({ positionSeconds: curr, durationSeconds: dur, watchedPct: pct });
        }

        // 90% threshold trigger
        if (pct >= 90 && !ninetyPctFiredRef.current && !completedIds.includes(activeLesson.id)) {
          ninetyPctFiredRef.current = true;
          sendProgressUpdate({
            positionSeconds: curr,
            durationSeconds: dur,
            completed: true,
            watchedPct: pct,
          }).then((data) => {
            if (data?.completed) {
              setCompletedIds((prev) =>
                prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]
              );
            }
          });
        }
      }
    },
    [activeLesson.id, completedIds, sendProgressUpdate]
  );

  const handleEnded = useCallback(() => {
    setPlayerState('ended');
    if (!completionSentRef.current) {
      completionSentRef.current = true;
      sendProgressUpdate({
        positionSeconds: videoTimeRef.current,
        completed: true,
        explicitComplete: true,
        watchedPct: 100,
      }).then((data) => {
        if (data?.completed) {
          setCompletedIds((prev) =>
            prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]
          );
        }
      });
    }
    triggerAutoAdvance();
  }, [activeLesson.id, sendProgressUpdate, triggerAutoAdvance]);

  // ─── Notes ────────────────────────────────────────────
  const saveNote = async () => {
    if (!noteInput.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: activeLesson.id,
          courseId: slug,
          content: noteInput.trim(),
          videoTime: Math.round(videoTimeRef.current),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.error || 'Failed to save note');
        return;
      }
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setNoteInput('');
        showToast('Note saved!');
      }
    } catch {
      showToast('Failed to save note — network error');
    } finally {
      setNoteSaving(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    // Optimistic remove
    const snapshot = notes;
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    const res = await fetch(`/api/notes?id=${noteId}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('Failed to delete note');
      setNotes(snapshot); // rollback
    }
  };

  const startEditNote = (note: NoteRecord) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const saveEditNote = async (noteId: string) => {
    const trimmed = editingNoteContent.trim();
    if (!trimmed) return;
    const snapshot = notes;
    // Optimistic update
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, content: trimmed } : n));
    setNoteUpdating(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: noteId, content: trimmed }),
      });
      if (!res.ok) {
        showToast('Failed to update note');
        setNotes(snapshot); // rollback
      } else {
        const data = await res.json();
        if (data.note) {
          setNotes((prev) => prev.map((n) => n.id === noteId ? data.note : n));
        }
        setEditingNoteId(null);
        showToast('Note updated!');
      }
    } catch {
      showToast('Network error — could not update note');
      setNotes(snapshot);
    } finally {
      setNoteUpdating(false);
    }
  };

  const seekToNoteTime = (seconds: number) => {
    const player = muxPlayerRef.current;
    if (player && typeof player.currentTime !== 'undefined') {
      player.currentTime = seconds;
      player.play?.();
    }
  };

  // ─── Q&A ──────────────────────────────────────────────
  const postThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    setPostingThread(true);
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: slug,
          lessonId: activeLesson.id,
          title: newThreadTitle.trim(),
          content: newThreadContent.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.error || 'Failed to post question');
        return;
      }
      const data = await res.json();
      if (data.thread) {
        setThreads((prev) => [data.thread, ...prev]);
        setNewThreadTitle('');
        setNewThreadContent('');
        showToast('Question posted!');
      }
    } catch {
      showToast('Network error — could not post question');
    } finally {
      setPostingThread(false);
    }
  };

  // ─── Certificate issuance ─────────────────────────────
  const handleIssueCertificate = async () => {
    try {
      const res = await fetch(`/api/certificates?courseId=${slug}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err?.error || 'Failed to retrieve certificate');
        return;
      }
      const data = await res.json();
      if (data.certificate) {
        setCertificateData({ id: data.certificate.id, verificationCode: data.certificate.verificationCode });
        setShowCertModal(true);
      }
    } catch {
      showToast('Network error — could not issue certificate');
    }
  };

  const displayProgress = serverProgress || Math.round((completedIds.length / (allLessons.length || 1)) * 100);

  return (
    <div className="min-h-screen bg-[#020813] text-white flex flex-col font-sans">
      {/* Accessible live region for completion announcements */}
      <div role="status" aria-live="polite" className="sr-only" id="live-announcer" />

      {/* ── Toast ─────────────────────────────────── */}
      {toast && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-[100] flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold shadow-xl backdrop-blur-md"
        >
          <Check size={14} /> {toast}
        </div>
      )}

      {/* ── Auto-Advance Banner ───────────────────── */}
      {autoAdvanceCountdown !== null && nextLesson && (
        <div className="fixed bottom-6 right-6 z-[90] flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-600/90 border border-blue-500/40 text-white text-xs font-bold shadow-2xl backdrop-blur-md">
          <span>Next: {nextLesson.title}</span>
          <span className="px-2 py-0.5 rounded-lg bg-white/20 font-mono">{autoAdvanceCountdown}s</span>
          <button onClick={() => { clearInterval(autoAdvanceTimerRef.current!); setAutoAdvanceCountdown(null); }} className="ml-1 p-1 rounded hover:bg-white/20">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Completion Modal ──────────────────────── */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative bg-[#030d1a] border border-blue-500/30 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-5 shadow-2xl shadow-blue-500/20 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCompletionModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400">
              <X size={16} />
            </button>
            <div className="text-5xl sm:text-6xl">🏆</div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Course Complete!</h2>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                You have completed all {allLessons.length} lessons of{' '}
                <span className="text-white font-bold">{course.title}</span>. Congratulations!
              </p>
            </div>

            {/* Series Next Course Suggestion */}
            {course.seriesName && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/70 via-indigo-950/40 to-[#020813] border border-blue-500/30 text-left space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Compass size={12} className="text-blue-400" />
                    Next in Series
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {course.seriesName}
                  </span>
                </div>

                {course.nextCourseSlug ? (
                  <>
                    <p className="text-sm font-bold text-white leading-snug">
                      {nextCourseData?.title || 'Next Course in Learning Track'}
                    </p>
                    <div className="pt-1 flex flex-col gap-2">
                      <Link
                        href={`/courses/${course.nextCourseSlug}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all group"
                      >
                        <span>Continue to Next Week {(course.seriesOrder !== undefined ? course.seriesOrder + 1 : '')}</span>
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link
                        href="/courses?category=roadmap"
                        className="text-[11px] text-center text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Entire RoadMap →
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-2 space-y-1">
                    <p className="text-xs text-emerald-400 font-bold">
                      🎉 Congratulations! You reached the final week of {course.seriesName}!
                    </p>
                    <Link
                      href="/courses?category=roadmap"
                      className="text-[11px] inline-block text-blue-400 hover:underline pt-1"
                    >
                      Explore Complete Track RoadMap
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                onClick={handleIssueCertificate}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
              >
                <Trophy size={16} /> Get Certificate
              </button>
              <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Certificate Modal ─────────────────────── */}
      <CertificateModal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        courseTitle={course.title}
        instructorName={course.instructors?.[0] || 'BIT Academy'}
        certificateId={certificateData?.verificationCode || ''}
      />

      {/* ── Header ───────────────────────────────── */}
      <header className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${course.slug}`}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 transition-colors"
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="hidden sm:flex flex-col min-w-0">
            {course.seriesName && (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/courses?category=roadmap"
                  className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider truncate"
                >
                  {course.seriesName} {course.seriesOrder !== undefined ? `• Week ${course.seriesOrder}` : ''}
                </Link>
              </div>
            )}
            <h1 className="text-sm font-bold text-white truncate max-w-xs">{course.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
            Completion:
            <span className="text-blue-400 font-bold">{displayProgress}%</span>
          </div>
          <div className="hidden md:block w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Link copied!'); }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            title="Share"
            aria-label="Copy link to clipboard"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
            aria-label={sidebarOpen ? 'Close curriculum sidebar' : 'Open curriculum sidebar'}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* ── Main Layout ───────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </div>
        )}

        {/* ── Left: Video + Content ──────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">

          {/* Video Player Container */}
          <div className="relative aspect-video w-full bg-black overflow-hidden border-b border-white/10 shadow-2xl">

            {/* Loading skeleton */}
            {(playerState === 'idle' || playerState === 'loading') && activeLesson.type === 'video' && activeLesson.muxPlaybackId && (
              <div className="absolute inset-0 bg-[#030d1a] flex items-center justify-center z-10">
                <div className="space-y-3 w-full px-8">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-500/30 to-transparent animate-pulse rounded-full" />
                  </div>
                  <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                    <Loader2 size={16} className="animate-spin text-blue-500/60" />
                    <p>Loading video player…</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mux Video Player */}
            {activeLesson.type === 'video' && activeLesson.muxPlaybackId && (
              <MuxPlayer
                ref={muxPlayerRef}
                key={activeLesson.id}
                streamType="on-demand"
                playbackId={activeLesson.muxPlaybackId}
                tokens={playbackTokens || undefined}
                metadata={{ video_title: activeLesson.title, video_id: activeLesson.id }}
                accentColor="#3b82f6"
                className="w-full h-full object-cover"
                onCanPlay={handlePlayerReady}
                onLoadedData={handlePlayerReady}
                onPlay={() => setPlayerState('playing')}
                onPause={() => setPlayerState('paused')}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onError={(e: any) => {
                  console.error('[MuxPlayer] Playback error:', e);
                  setPlayerState('error');
                  setPlayerError('Video playback error. Please refresh and try again.');
                }}
              />
            )}

            {/* Player error overlay */}
            {playerState === 'error' && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-20">
                <AlertCircle className="text-red-400" size={40} />
                <p className="text-sm text-gray-300">{playerError}</p>
                <button
                  onClick={() => { setPlayerState('idle'); setPlayerError(null); }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Video unavailable — no Mux playback ID */}
            {activeLesson.type === 'video' && !activeLesson.muxPlaybackId && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#040e1a] via-[#020813] to-black text-center p-6">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Volume2 size={28} className="text-blue-400" />
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <p className="text-white font-bold text-base">{activeLesson.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Video unavailable — the instructor has not uploaded media for this lesson yet.
                  </p>
                </div>
                <button
                  onClick={() => markComplete(activeLesson.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 border border-blue-500/30 text-white text-xs font-bold transition-colors"
                >
                  <Check size={14} />
                  {completedIds.includes(activeLesson.id) ? (nextLesson ? 'Next Lesson →' : 'All Done!') : 'Mark Complete & Continue'}
                </button>
              </div>
            )}

            {/* Quiz lesson type */}
            {activeLesson.type === 'quiz' && (
              <div className="absolute inset-0 bg-[#020813] overflow-y-auto p-4 sm:p-8">
                <StudentQuizPlayer
                  lessonId={activeLesson.id}
                  lessonTitle={activeLesson.title}
                  isCompleted={completedIds.includes(activeLesson.id)}
                  onMarkComplete={() => markComplete(activeLesson.id)}
                  onPass={() => {
                    setCompletedIds((prev) =>
                      prev.includes(activeLesson.id) ? prev : [...prev, activeLesson.id]
                    );
                  }}
                />
              </div>
            )}

            {/* Project lesson type */}
            {activeLesson.type === 'project' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br from-[#030d1a] to-[#060f20]">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <Rocket className="text-cyan-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">Project Submission</h3>
                <p className="text-sm text-gray-400 text-center max-w-xs">
                  Upload your project files for review. Accepted: ZIP archives, PDFs, and images.
                </p>
                <UploadDropzone
                  endpoint="courseResourceUploader"
                  headers={{ 'x-course-id': slug, 'x-lesson-id': activeLesson.id }}
                  onClientUploadComplete={(res) => {
                    showToast(`Project uploaded: ${res[0]?.name}`);
                    markComplete(activeLesson.id);
                  }}
                  onUploadError={(err) => showToast(`Upload failed: ${err.message}`)}
                  className="ut-label:text-gray-400 ut-allowed-content:text-gray-500 ut-upload-icon:text-blue-400 border-white/10 bg-white/5 rounded-xl"
                />
              </div>
            )}
          </div>

          {/* Video progress bar */}
          {activeLesson.type === 'video' && (
            <div className="h-1 bg-white/5 w-full" role="progressbar" aria-valuenow={videoProgress} aria-valuemin={0} aria-valuemax={100}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          )}

          {/* ── Action Bar ─────────────────────────── */}
          <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
            <button
              id="btn-mark-complete"
              onClick={() => markComplete(activeLesson.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                completedIds.includes(activeLesson.id)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
            >
              <CheckCircle size={14} />
              {completedIds.includes(activeLesson.id) ? 'Completed ✓' : 'Mark Complete'}
            </button>

            <div className="flex items-center gap-2">
              <button
                id="btn-prev-lesson"
                disabled={!prevLesson}
                onClick={() => prevLesson && goToLesson(prevLesson)}
                aria-label={prevLesson ? `Go to previous lesson: ${prevLesson.title}` : 'No previous lesson'}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                id="btn-next-lesson"
                disabled={!nextLesson}
                onClick={() => nextLesson && goToLesson(nextLesson)}
                aria-label={nextLesson ? `Go to next lesson: ${nextLesson.title}` : 'No next lesson'}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Next Lesson <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* ── Tabs ──────────────────────────────── */}
          <div className="px-4 sm:px-6 max-w-4xl w-full space-y-6 pt-6 pb-12">
            <div className="flex items-center gap-1 sm:gap-4 border-b border-white/10 pb-0 overflow-x-auto">
              {(
                [
                  { id: 'overview', label: 'Overview', icon: BookOpen },
                  { id: 'notes', label: `Notes (${notes.length})`, icon: FileText },
                  { id: 'sandbox', label: 'Code Sandbox', icon: Code2 },
                  { id: 'resources', label: 'Resources', icon: Download },
                  { id: 'discussion', label: `Q&A (${threads.length})`, icon: MessageSquare },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 text-xs font-bold py-3 px-2 border-b-2 whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <Icon size={13} /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-sm text-gray-300">
                <h2 className="text-xl font-bold text-white">{activeLesson.title}</h2>
                <p className="leading-relaxed text-gray-400">
                  In this lesson, we explore <strong className="text-gray-200">{activeLesson.title}</strong>. Follow along
                  with the starter source code provided in the resources section.
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 pt-2">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${completedIds.includes(activeLesson.id) ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                    {completedIds.includes(activeLesson.id) ? 'Completed' : 'In progress'}
                  </span>
                  <span>•</span>
                  <span>{activeLesson.duration}</span>
                  <span>•</span>
                  <span className="capitalize">{activeLesson.type}</span>
                </div>
              </div>
            )}

            {/* TAB: CODE SANDBOX */}
            {activeTab === 'sandbox' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Interactive Lesson Sandbox</h3>
                    <p className="text-xs text-gray-400">Write, test, and execute JavaScript and HTML code in real time.</p>
                  </div>
                </div>
                <CodeSandbox />
              </div>
            )}

            {/* TAB: NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="note-input" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Add Note at {formatVideoTime(displayVideoTimeSec)}
                  </label>
                  <textarea
                    id="note-input"
                    rows={3}
                    value={noteInput}
                    onChange={(e) => { setNoteInput(e.target.value); noteDraftRef.current = e.target.value; }}
                    placeholder="Write a personal note for this moment in the video…"
                    maxLength={5000}
                    className="w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-600">{noteInput.length}/5000</span>
                    <button
                      id="btn-save-note"
                      onClick={saveNote}
                      disabled={noteSaving || !noteInput.trim()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                    >
                      {noteSaving ? 'Saving…' : 'Save Note'}
                    </button>
                  </div>
                </div>

                {notes.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saved Notes</h4>
                    {notes.map((note) => (
                      <div key={note.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 group">
                        <div className="flex items-center justify-between mb-1.5">
                          <button
                            onClick={() => seekToNoteTime(note.videoTime)}
                            className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md hover:bg-blue-500/20 transition-colors"
                            title="Click to seek to this moment"
                            aria-label={`Seek to ${formatVideoTime(note.videoTime)}`}
                          >
                            {formatVideoTime(note.videoTime)}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => startEditNote(note)}
                              aria-label="Edit note"
                              className="p-1 rounded hover:text-blue-400 text-gray-500"
                            >
                              <FileText size={12} />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              aria-label="Delete note"
                              className="p-1 rounded hover:text-red-400 text-gray-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {editingNoteId === note.id ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              rows={3}
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              maxLength={5000}
                              autoFocus
                              className="w-full p-2.5 rounded-lg bg-white/5 border border-blue-500/40 text-xs text-white focus:outline-none resize-none"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveEditNote(note.id)}
                                disabled={noteUpdating || !editingNoteContent.trim()}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-bold"
                              >
                                {noteUpdating ? 'Saving…' : 'Save'}
                              </button>
                              <button
                                onClick={cancelEditNote}
                                className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-[11px] hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="leading-relaxed mt-1">{note.content}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {notes.length === 0 && (
                  <p className="text-xs text-gray-500 pt-2">No notes yet. Add your first note above.</p>
                )}
              </div>
            )}

            {/* TAB: RESOURCES */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                {resourcesLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 py-2">
                    <Loader2 size={14} className="animate-spin" /> Loading resources…
                  </div>
                )}

                {!resourcesLoading && resourcesError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Resources unavailable</p>
                      <p className="opacity-80 mt-0.5">{resourcesError}</p>
                    </div>
                  </div>
                )}

                {!resourcesLoading && !resourcesError && resources.length > 0 && resources.map((res) => (
                  <a
                    key={res.id}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                    download
                  >
                    <div>
                      <p className="font-bold text-gray-200">{res.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{formatFileSize(res.size)} · {res.type?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-bold transition-colors">
                      <Download size={13} /> Download
                    </div>
                  </a>
                ))}

                {!resourcesLoading && !resourcesError && resources.length === 0 && (
                  <div className="space-y-4">
                    <p className="text-xs text-gray-500">No resources uploaded yet for this lesson.</p>
                    <div className="pt-2">
                      <p className="text-xs font-bold text-gray-400 mb-3">Upload a resource for this lesson:</p>
                      <UploadDropzone
                        endpoint="courseResourceUploader"
                        headers={{ 'x-course-id': slug, 'x-lesson-id': activeLesson.id }}
                        onClientUploadComplete={(res) => {
                          const newFiles = res.map((f) => ({
                            id: f.key,
                            name: f.name,
                            url: f.ufsUrl ?? f.url,
                            size: f.size,
                            type: f.type ?? '',
                          }));
                          setResources((prev) => [...newFiles, ...prev]);
                          showToast(`${res.length} file(s) uploaded!`);
                        }}
                        onUploadError={(err) => showToast(`Error: ${err.message}`)}
                        className="ut-label:text-gray-400 ut-allowed-content:text-gray-500 ut-upload-icon:text-blue-400 border-white/10 bg-white/5 rounded-xl min-h-[120px]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Q&A DISCUSSION */}
            {activeTab === 'discussion' && (
              <div className="space-y-6">
                <form onSubmit={postThread} className="space-y-3">
                  <input
                    type="text"
                    id="thread-title"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="Question title…"
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <div className="flex gap-3">
                    <textarea
                      id="thread-content"
                      value={newThreadContent}
                      onChange={(e) => setNewThreadContent(e.target.value)}
                      placeholder="Ask a question about this lesson…"
                      rows={2}
                      maxLength={5000}
                      className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                    <button
                      id="btn-post-thread"
                      type="submit"
                      disabled={postingThread || !newThreadTitle.trim() || !newThreadContent.trim()}
                      className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 self-end"
                    >
                      {postingThread ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Post
                    </button>
                  </div>
                </form>

                {threadsLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 size={14} className="animate-spin" /> Loading discussions…
                  </div>
                )}

                {!threadsLoading && threads.length === 0 && (
                  <p className="text-xs text-gray-500">No questions yet. Be the first to ask!</p>
                )}

                <div className="space-y-3">
                  {threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      courseId={slug}
                      onDeleteThread={(id) => setThreads((prev) => prev.filter((t) => t.id !== id))}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar: Curriculum ──────────── */}
        <div
          className={`
            fixed lg:relative inset-y-0 right-0 z-50 lg:z-auto
            w-80 lg:w-96 xl:w-[26rem]
            border-l border-white/10 bg-[#020712]
            flex flex-col shrink-0
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            top-16 lg:top-auto
            overflow-y-auto
          `}
          aria-label="Course curriculum sidebar"
        >
          <div className="p-4 border-b border-white/10 bg-black/40 sticky top-0 z-10">
            <h2 className="font-bold text-white text-sm">Course Curriculum</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={displayProgress}>
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${displayProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 shrink-0">
                {completedIds.length}/{allLessons.length}
              </p>
            </div>
          </div>

          {course.seriesName && (
            <div className="px-4 py-2.5 bg-blue-500/10 border-b border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Compass size={14} className="text-blue-400 shrink-0" />
                <span className="text-[11px] font-bold text-blue-300 truncate">
                  {course.seriesName} {course.seriesOrder !== undefined ? `• Wk ${course.seriesOrder}` : ''}
                </span>
              </div>
              <Link
                href="/courses?category=roadmap"
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/20 shrink-0 transition-colors"
              >
                RoadMap
              </Link>
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {course.curriculum.map((section, sIdx) => {
              const isOpen = openSections.has(sIdx);
              const sectionDone = section.lessons.filter((l) => completedIds.includes(l.id)).length;
              return (
                <div key={sIdx}>
                  <button
                    onClick={() => toggleSection(sIdx)}
                    className="w-full p-3.5 flex items-center justify-between bg-white/[0.04] hover:bg-white/[0.07] transition-colors text-left"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <p className="text-[11px] font-bold text-gray-200 uppercase tracking-wider">{section.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {sectionDone}/{section.lessons.length} lessons
                      </p>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                  </button>

                  {isOpen && (
                    <div>
                      {section.lessons.map((lesson) => {
                        const isCurrent = lesson.id === activeLesson.id;
                        const isDone = completedIds.includes(lesson.id);
                        const typeIcon = lesson.type === 'quiz' ? '📋' : lesson.type === 'project' ? '🚀' : '▶';
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => goToLesson(lesson)}
                            aria-current={isCurrent ? 'true' : undefined}
                            className={`w-full text-left pl-4 pr-3 py-3 flex items-center justify-between transition-colors border-l-2 ${
                              isCurrent ? 'bg-blue-600/20 border-blue-500' : 'border-transparent hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isDone
                                ? <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                                : <Circle size={15} className={`shrink-0 ${isCurrent ? 'text-blue-400' : 'text-gray-600'}`} />
                              }
                              <div className="min-w-0">
                                <span className={`text-xs block truncate ${isCurrent ? 'text-white font-semibold' : isDone ? 'text-gray-400' : 'text-gray-300'}`}>
                                  {typeIcon} {lesson.title}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-500 font-mono shrink-0 ml-2">{lesson.duration}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {course.seriesName && course.nextCourseSlug && (
            <div className="p-3.5 border-t border-white/10 bg-[#040e1f] shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <Compass size={11} className="text-blue-400" />
                  Next in Track
                </span>
                <span className="text-[10px] text-blue-400 font-semibold">
                  Week {(course.seriesOrder ?? 0) + 1}
                </span>
              </div>
              <Link
                href={`/courses/${course.nextCourseSlug}`}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 group transition-all"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                    {nextCourseData?.title || 'Next Course in Series'}
                  </p>
                  <p className="text-[10px] text-gray-500">Click to view course</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Discussion Thread Card ────────────────────────────
function ThreadCard({
  thread,
  courseId,
  onDeleteThread,
}: {
  thread: DiscussionThread;
  courseId: string;
  onDeleteThread?: (threadId: string) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [replies, setReplies] = useState(thread.replies);
  const [replyError, setReplyError] = useState<string | null>(null);

  const postReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setPosting(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/discussions/${thread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setReplyError(body?.error || 'Failed to post reply');
        return;
      }
      const data = await res.json();
      if (data.reply) {
        setReplies((prev) => [...prev, data.reply]);
        setReplyContent('');
        setShowReplyForm(false);
      }
    } catch {
      setReplyError('Network error — failed to post reply');
    } finally {
      setPosting(false);
    }
  };

  const deleteReply = async (replyId: string) => {
    const snapshot = replies;
    setReplies((prev) => prev.filter((r) => r.id !== replyId));
    try {
      const res = await fetch(`/api/discussions/${thread.id}/replies?replyId=${replyId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setReplies(snapshot); // rollback
      }
    } catch {
      setReplies(snapshot); // rollback
    }
  };

  const deleteThread = async () => {
    try {
      const res = await fetch(`/api/discussions?id=${thread.id}`, { method: 'DELETE' });
      if (res.ok && onDeleteThread) {
        onDeleteThread(thread.id);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/5 space-y-3 group">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            {thread.title}
            {thread.user.role === 'INSTRUCTOR' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">Instructor</span>
            )}
            {thread.user.role === 'ADMIN' && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">Admin</span>
            )}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            {thread.isPinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">Pinned</span>
            )}
            {onDeleteThread && (
              <button
                onClick={deleteThread}
                aria-label="Delete thread"
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{thread.content}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="font-semibold text-gray-400">{thread.user.name}</span>
          <span>•</span>
          <span>{formatRelativeTime(thread.createdAt)}</span>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="space-y-2 pl-3 border-l border-white/10">
          {replies.map((reply) => (
            <div key={reply.id} className="space-y-0.5 group/reply flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-300 leading-relaxed">{reply.content}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                  <span className="font-semibold text-gray-400">{reply.user.name}</span>
                  {reply.user.role === 'INSTRUCTOR' && (
                    <span className="text-[9px] px-1 py-0.1 rounded bg-amber-500/20 text-amber-300 font-mono">Instructor</span>
                  )}
                  {reply.user.role === 'ADMIN' && (
                    <span className="text-[9px] px-1 py-0.1 rounded bg-purple-500/20 text-purple-300 font-mono">Admin</span>
                  )}
                  <span>•</span>
                  <span>{formatRelativeTime(reply.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={() => deleteReply(reply.id)}
                aria-label="Delete reply"
                className="opacity-0 group-hover/reply:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all shrink-0 ml-2"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {replyError && <p className="text-[11px] text-red-400">{replyError}</p>}

      {!thread.isLocked && (
        <>
          {showReplyForm ? (
            <form onSubmit={postReply} className="flex gap-2 pt-1">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply…"
                maxLength={2000}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={posting || !replyContent.trim()}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold"
              >
                {posting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
              <button
                type="button"
                onClick={() => { setShowReplyForm(false); setReplyError(null); }}
                className="px-3 py-2 rounded-lg bg-white/5 text-gray-400 text-xs"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowReplyForm(true)}
              className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-blue-400 transition-colors"
            >
              <Reply size={12} /> Reply
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Quiz Player Component ─────────────────────────────
function StudentQuizPlayer({
  lessonId,
  lessonTitle,
  isCompleted,
  onMarkComplete,
  onPass,
}: {
  lessonId: string;
  lessonTitle: string;
  isCompleted: boolean;
  onMarkComplete: () => void;
  onPass: () => void;
}) {
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setResult(null);
    setUserAnswers({});
    setError(null);

    fetch(`/api/quiz/lesson/${lessonId}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          setError(body?.error || 'Failed to load quiz');
          return;
        }
        const data = await r.json();
        setQuiz(data.quiz?.questions?.length ? data.quiz : null);
      })
      .catch(() => setError('Network error — could not load quiz'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Quiz submission failed');
        return;
      }
      setResult(data);
      if (data.passed) onPass();
    } catch {
      setError('Network error — could not submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-gray-500 space-y-2">
        <Loader2 size={20} className="animate-spin text-cyan-500" />
        <p>Loading Quiz…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <AlertCircle className="text-red-400" size={32} />
        <p className="text-sm text-gray-400">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <ClipboardList className="text-cyan-400" size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">{lessonTitle} — Quiz</h3>
        <p className="text-xs text-gray-400">
          Review the material for this lesson and mark it complete when you are confident with the concepts.
        </p>
        <button
          id="btn-quiz-mark-complete"
          onClick={onMarkComplete}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs transition-all ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500'
          }`}
        >
          <CheckCircle size={16} />
          {isCompleted ? 'Quiz Completed ✓' : 'Mark Quiz Complete'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-white/10 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md">
          Interactive Quiz • Passing Score: {quiz.passingScore}%
        </span>
        <h2 className="text-xl font-black text-white mt-2">{quiz.title}</h2>
        {quiz.description && <p className="text-xs text-gray-400 mt-1">{quiz.description}</p>}
      </div>

      {result && (
        <div
          role="alert"
          className={`p-5 rounded-2xl border ${
            result.passed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          } space-y-2`}
        >
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-base">
              {result.passed ? '🎉 Congratulations! You Passed!' : '❌ Not Quite There'}
            </span>
            <span className="font-mono text-sm font-bold bg-black/40 px-3 py-1 rounded-lg">
              {result.score}%
            </span>
          </div>
          <p className="text-xs opacity-90">
            {result.passed
              ? `You answered ${result.correctCount} of ${result.totalQuestions} questions correctly.`
              : `You scored ${result.score}%. The passing threshold is ${result.passingScore}%. Try again!`}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.questions.map((q: any, qIdx: number) => (
          <div key={q.id || qIdx} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
            <h4 className="text-xs font-bold text-white flex items-start gap-2">
              <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded text-[11px]">
                Q{qIdx + 1}
              </span>
              {q.question}
            </h4>
            <div className="space-y-2 pt-2">
              {q.choices.map((c: any) => {
                const isSelected = userAnswers[q.id] === c.id;
                return (
                  <label
                    key={c.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-white font-semibold'
                        : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={c.id}
                      checked={isSelected}
                      onChange={() => setUserAnswers({ ...userAnswers, [q.id]: c.id })}
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span>{c.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4">
          <button
            id="btn-submit-quiz"
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting & Grading…' : 'Submit Quiz Answers'}
          </button>

          <button
            type="button"
            onClick={onMarkComplete}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {isCompleted ? 'Completed ✓' : 'Mark Completed'}
          </button>
        </div>
      </form>
    </div>
  );
}
