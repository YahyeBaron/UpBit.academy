'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import type { Course } from '@/lib/data';
import type {
  RoadmapMilestone,
  RoadmapPhase,
  PhaseId,
  UserEnrollmentRef,
} from '@/lib/roadmap-data';
import { buildRoadmapViewModel } from '@/lib/roadmap-data';
import {
  Compass,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  Search,
  Code2,
  Layers,
  Sparkles,
  ChevronRight,
  FileCode2,
  Check,
  Copy,
  Lightbulb,
  X,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';

export interface VisualRoadmapProps {
  courses: Course[];
  userEnrollments?: UserEnrollmentRef[];
  user?: { name?: string | null; email?: string | null } | null;
  initialSelectedWeek?: number;
}

const STORAGE_KEY = 'eraysame_roadmap_completed_weeks';

export default function VisualRoadmap({
  courses,
  userEnrollments = [],
  user = null,
  initialSelectedWeek = 0,
}: VisualRoadmapProps) {
  // Client-persisted completed weeks (survives page refresh for guests and manual overrides)
  const [clientCompletedWeeks, setClientCompletedWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number>(initialSelectedWeek);
  const [activePhaseFilter, setActivePhaseFilter] = useState<PhaseId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'curriculum' | 'code' | 'labs'>('overview');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Load client completed weeks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setClientCompletedWeeks(parsed.map(Number));
        }
      }
    } catch {
      // LocalStorage unavailable or error
    }
  }, []);

  // Save to localStorage whenever clientCompletedWeeks changes
  const toggleMilestoneCompletion = (weekNumber: number) => {
    setClientCompletedWeeks((prev) => {
      const exists = prev.includes(weekNumber);
      const updated = exists ? prev.filter((w) => w !== weekNumber) : [...prev, weekNumber];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // LocalStorage unavailable
      }
      return updated;
    });
  };

  // Build the normalized roadmap view model
  const viewModel = useMemo(() => {
    return buildRoadmapViewModel(courses, userEnrollments, clientCompletedWeeks);
  }, [courses, userEnrollments, clientCompletedWeeks]);

  // Set default selection to active/continue milestone if initial selection is default
  useEffect(() => {
    if (viewModel.continueMilestone && initialSelectedWeek === 0) {
      setSelectedWeek(viewModel.continueMilestone.weekNumber);
    }
  }, [viewModel.continueMilestone, initialSelectedWeek]);

  // Currently selected milestone
  const selectedMilestone = useMemo(() => {
    return (
      viewModel.milestones.find((m) => m.weekNumber === selectedWeek) ||
      viewModel.milestones[0]
    );
  }, [viewModel.milestones, selectedWeek]);

  // Filtered milestones based on phase selection and search
  const filteredMilestones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return viewModel.milestones.filter((m) => {
      // Phase filtering
      if (activePhaseFilter !== 'all' && m.phaseId !== activePhaseFilter) {
        return false;
      }

      // Search query filtering
      if (q) {
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchTagline = m.tagline.toLowerCase().includes(q);
        const matchDesc = m.description.toLowerCase().includes(q);
        const matchConcepts = m.concepts.some((c) => c.toLowerCase().includes(q));
        const matchProblems = m.problemSets.some((p) => p.title.toLowerCase().includes(q));
        const matchPhase = m.phaseTitle.toLowerCase().includes(q);
        return matchTitle || matchTagline || matchDesc || matchConcepts || matchProblems || matchPhase;
      }

      return true;
    });
  }, [viewModel.milestones, activePhaseFilter, searchQuery]);

  // Handle milestone selection
  const handleSelectMilestone = (week: number) => {
    setSelectedWeek(week);
    setActiveDetailTab('overview');
  };

  const copyCode = () => {
    if (!selectedMilestone.codeSnippet) return;
    navigator.clipboard.writeText(selectedMilestone.codeSnippet.code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const continueCourse = viewModel.continueMilestone;

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* ── 1. Compact Page Header & Track Progress Summary ── */}
      <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#060e22] via-[#030714] to-black p-6 sm:p-8 lg:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <Compass size={13} className="text-blue-400" />
                Computer Science Academic Path
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <Sparkles size={12} /> 11 Core Milestones
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Your Learning Path
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-xl">
              From algorithmic thinking and C memory management to relational SQL, full-stack web architecture, and cybersecurity defense.
            </p>
          </div>

          {/* Compact Track Progress Widget */}
          <div className="w-full lg:w-84 p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shrink-0 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Track Mastery</span>
              <span className="text-xs font-mono font-bold text-blue-400">
                {viewModel.completedMilestones} of {viewModel.totalMilestones} Completed ({viewModel.completionPercentage}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.max(viewModel.completionPercentage, 3)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-gray-400" />
                ~{viewModel.totalEstimatedHours}h curriculum
              </span>
              <span className="font-semibold text-gray-300">
                Current: {viewModel.currentPhase.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. "Continue Learning" Action Card ── */}
      {continueCourse && (
        <div className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-[#07132e]/50 to-[#04091a] p-5 sm:p-6 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <PlayCircle size={24} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {continueCourse.status === 'in-progress' ? 'Resume Learning' : 'Recommended Next Step'}
                  </span>
                  <span className="text-xs text-gray-400">{continueCourse.phaseTitle}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Week {continueCourse.weekNumber}: {continueCourse.title.replace(/^CS50 - Week \d+: /, '')}
                </h2>
                <p className="text-xs text-gray-400 line-clamp-1">
                  {continueCourse.tagline}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
              <button
                onClick={() => handleSelectMilestone(continueCourse.weekNumber)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors border border-white/10"
              >
                Inspect Milestone
              </button>
              <Link
                href={
                  continueCourse.course
                    ? `/courses/${continueCourse.slug}${continueCourse.progressPct > 0 ? '/learn' : ''}`
                    : `/courses/${continueCourse.slug}`
                }
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
              >
                <span>{continueCourse.progressPct > 0 ? 'Continue Course' : 'Start Course'}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Phase Navigation Bar & Search Filters ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        {/* 4 Official Phase Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Roadmap phase filters">
          <button
            role="tab"
            aria-selected={activePhaseFilter === 'all'}
            onClick={() => setActivePhaseFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activePhaseFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            All Milestones ({viewModel.totalMilestones})
          </button>

          {viewModel.phases.map((phase) => {
            const isActive = activePhaseFilter === phase.id;
            return (
              <button
                key={phase.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePhaseFilter(phase.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>Phase {phase.phaseNumber}: {phase.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {phase.completedCount}/{phase.totalCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search within curriculum */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts (e.g. pointers, sql)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Search result count if filtered */}
      {(searchQuery || activePhaseFilter !== 'all') && (
        <div className="flex items-center justify-between text-xs text-gray-400 px-2">
          <span>
            Showing <strong className="text-white">{filteredMilestones.length}</strong> of {viewModel.totalMilestones} milestones
            {searchQuery && <> matching &ldquo;<span className="text-blue-400">{searchQuery}</span>&rdquo;</>}
          </span>
          {(searchQuery || activePhaseFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setActivePhaseFilter('all');
              }}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Reset filters
            </button>
          )}
        </div>
      )}

      {/* ── 4. Main Two-Column Layout: Milestone Feed + Detail Drawer ── */}
      {filteredMilestones.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">No milestones match your search</h3>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            We couldn&apos;t find any milestones matching &ldquo;{searchQuery}&rdquo;. Try searching for broader terms like &ldquo;memory&rdquo;, &ldquo;algorithms&rdquo;, or &ldquo;web&rdquo;.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActivePhaseFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: Spacious Vertical Milestone Feed ── */}
          <div className="lg:col-span-6 xl:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Curriculum Sequence
              </span>
              <span className="text-[11px] text-gray-500">
                Select a milestone to view syllabus
              </span>
            </div>

            <div className="space-y-3">
              {filteredMilestones.map((milestone) => {
                const isSelected = selectedMilestone.weekNumber === milestone.weekNumber;
                const isCompleted = milestone.status === 'completed';
                const isInProgress = milestone.status === 'in-progress';
                const isNext = milestone.status === 'next';

                return (
                  <button
                    key={milestone.id}
                    type="button"
                    onClick={() => handleSelectMilestone(milestone.weekNumber)}
                    aria-current={isSelected ? 'true' : undefined}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-950/60 via-[#07132a] to-[#040817] border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.01]'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Milestone State Badge */}
                      <div
                        className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-mono font-bold text-xs transition-colors ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : isInProgress
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                            : isNext
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-white/5 text-gray-400 border border-white/10'
                        }`}
                      >
                        {isCompleted ? <Check size={18} /> : `W${milestone.weekNumber}`}
                      </div>

                      {/* Milestone Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
                            {milestone.phaseTitle}
                          </span>

                          {/* Status pill */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : isInProgress
                                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                : isNext
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                : 'bg-white/5 text-gray-400 border border-white/5'
                            }`}
                          >
                            {isCompleted
                              ? 'Completed'
                              : isInProgress
                              ? `${milestone.progressPct}% Done`
                              : isNext
                              ? 'Up Next'
                              : 'Upcoming'}
                          </span>
                        </div>

                        <h3 className={`text-sm sm:text-base font-bold truncate transition-colors ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                          Week {milestone.weekNumber}: {milestone.title.replace(/^CS50 - Week \d+: /, '')}
                        </h3>

                        <p className="text-xs text-gray-400 line-clamp-1">
                          {milestone.tagline}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-gray-400" />
                            ~{milestone.estimatedHours}h
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} className="text-gray-400" />
                            {milestone.totalLessons} Lessons
                          </span>
                          <span className="text-gray-400">
                            • {milestone.difficulty}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 pt-3 flex items-center">
                        <ChevronRight
                          size={16}
                          className={`transition-transform ${
                            isSelected ? 'text-blue-400 translate-x-1' : 'text-gray-600'
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT COLUMN: Focused Progressive-Disclosure Detail Drawer / Panel ── */}
          <div
            className="lg:col-span-6 xl:col-span-7 lg:sticky lg:top-24"
          >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#060e22] to-[#02050f] p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
              {/* Header: Title + Contextual Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-white/10">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Week {selectedMilestone.weekNumber}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{selectedMilestone.phaseTitle}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-400 font-mono">{selectedMilestone.difficulty}</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {selectedMilestone.title.replace(/^CS50 - Week \d+: /, '')}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {selectedMilestone.tagline}
                  </p>
                </div>

                {/* Primary & Secondary Action CTAs */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  {/* Mark as Mastered button (durable local sync) */}
                  <button
                    onClick={() => toggleMilestoneCompletion(selectedMilestone.weekNumber)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedMilestone.status === 'completed'
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300'
                    }`}
                  >
                    <CheckCircle2
                      size={14}
                      className={selectedMilestone.status === 'completed' ? 'text-emerald-400' : 'text-gray-500'}
                    />
                    <span>{selectedMilestone.status === 'completed' ? 'Mastered ✓' : 'Mark Complete'}</span>
                  </button>

                  {/* Course Action Link */}
                  <Link
                    href={
                      selectedMilestone.status === 'completed'
                        ? `/courses/${selectedMilestone.slug}/learn`
                        : selectedMilestone.status === 'in-progress'
                        ? `/courses/${selectedMilestone.slug}/learn`
                        : `/courses/${selectedMilestone.slug}`
                    }
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
                  >
                    <span>
                      {selectedMilestone.status === 'completed'
                        ? 'Review Course'
                        : selectedMilestone.status === 'in-progress'
                        ? 'Continue Learning'
                        : 'Start Course'}
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* ── Tabbed Progressive Disclosure Navigation ── */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
                <button
                  onClick={() => setActiveDetailTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeDetailTab === 'overview'
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Overview & Outcomes
                </button>

                {selectedMilestone.course && selectedMilestone.course.curriculum && (
                  <button
                    onClick={() => setActiveDetailTab('curriculum')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      activeDetailTab === 'curriculum'
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Curriculum ({selectedMilestone.course.curriculum.length} Modules)
                  </button>
                )}

                {selectedMilestone.codeSnippet && (
                  <button
                    onClick={() => setActiveDetailTab('code')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      activeDetailTab === 'code'
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Code Blueprint
                  </button>
                )}

                {selectedMilestone.problemSets.length > 0 && (
                  <button
                    onClick={() => setActiveDetailTab('labs')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      activeDetailTab === 'labs'
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Problem Sets & Labs ({selectedMilestone.problemSets.length})
                  </button>
                )}
              </div>

              {/* ── TAB 1: Overview & Competencies ── */}
              {activeDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Academic Summary */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Lightbulb size={14} className="text-amber-400" />
                      Academic Overview
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {selectedMilestone.description}
                    </p>
                  </div>

                  {/* Core Competencies */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-cyan-400" />
                      Key Competencies Mastered
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedMilestone.concepts.map((concept, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-200"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1.5" />
                          <span>{concept}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Takeaway Principle */}
                  <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div className="text-xs text-gray-300 leading-relaxed">
                      <span className="font-bold text-white">Guiding Principle: </span>
                      {selectedMilestone.keyTakeaway}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TAB 2: Curriculum Preview ── */}
              {activeDetailTab === 'curriculum' && selectedMilestone.course && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Lesson Modules ({selectedMilestone.totalLessons} Total Lessons)
                    </h3>
                    <span className="text-xs font-mono text-gray-400">
                      Duration: ~{selectedMilestone.estimatedHours}h
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedMilestone.course.curriculum.map((section, sIdx) => (
                      <div key={sIdx} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-2.5">
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          <Layers size={13} className="text-blue-400" />
                          {section.title}
                        </h4>

                        <div className="space-y-1.5 pl-5 border-l border-white/10">
                          {section.lessons.map((lesson, lIdx) => (
                            <div
                              key={lIdx}
                              className="flex items-center justify-between text-xs py-1 text-gray-300"
                            >
                              <span className="truncate">{lesson.title}</span>
                              <span className="text-[11px] font-mono text-gray-500 shrink-0 ml-2">
                                {lesson.duration}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── TAB 3: Code Blueprint ── */}
              {activeDetailTab === 'code' && selectedMilestone.codeSnippet && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Code2 size={14} className="text-blue-400" />
                      {selectedMilestone.codeSnippet.filename}
                    </h3>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300 hover:text-white transition-colors border border-white/10"
                    >
                      {copiedSnippet ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedSnippet ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 p-4 font-mono text-xs">
                    <pre className="text-gray-300 overflow-x-auto leading-relaxed">
                      <code>{selectedMilestone.codeSnippet.code}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* ── TAB 4: Problem Sets & Labs ── */}
              {activeDetailTab === 'labs' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                    <FileCode2 size={14} className="text-rose-400" />
                    Hands-on Challenges & Capstones
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedMilestone.problemSets.map((ps, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{ps.title}</h4>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {ps.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {ps.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sequential Next / Prev Navigation */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                {selectedMilestone.weekNumber > 0 ? (
                  <button
                    onClick={() => handleSelectMilestone(selectedMilestone.weekNumber - 1)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ← Week {selectedMilestone.weekNumber - 1}
                  </button>
                ) : (
                  <div />
                )}

                {selectedMilestone.weekNumber < 10 && (
                  <button
                    onClick={() => handleSelectMilestone(selectedMilestone.weekNumber + 1)}
                    className="text-blue-400 hover:text-blue-300 font-bold transition-colors"
                  >
                    Week {selectedMilestone.weekNumber + 1} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
