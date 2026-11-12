'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { Course } from '@/lib/data';
import { getCourseImageUrl } from '@/lib/course-image';
import VisualRoadmap from '@/components/visual-roadmap';
import {
  Search,
  BookOpen,
  Filter,
  LayoutGrid,
  List,
  X,
  Compass,
  Sparkles,
} from 'lucide-react';

interface CoursesCatalogClientProps {
  initialCourses: Course[];
}

export default function CoursesCatalogClient({ initialCourses }: CoursesCatalogClientProps) {
  const [mainTab, setMainTab] = useState<'catalog' | 'roadmap'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'price-low' | 'price-high'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Read URL query parameter on mount to allow direct ?tab=roadmap navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'roadmap' || params.get('category') === 'roadmap') {
        setMainTab('roadmap');
      }
    }
  }, []);

  const handleTabChange = (tab: 'catalog' | 'roadmap') => {
    setMainTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'roadmap') {
        url.searchParams.set('tab', 'roadmap');
      } else {
        url.searchParams.delete('tab');
      }
      url.searchParams.delete('category');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Filter logic over database-backed initialCourses for catalog tab
  const filteredCourses = (initialCourses || [])
    .filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.tags && course.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;

      return matchesSearch && matchesCategory && matchesLevel;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return b.students - a.students;
    });

  const seriesCourses = (initialCourses || [])
    .filter((c) => Boolean(c.seriesName))
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#4d65ff] selection:text-white font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="relative pt-36 pb-16 overflow-hidden bg-gradient-to-b from-[#080d22] via-[#030612] to-black border-b border-white/10">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top, rgba(77, 101, 255, 0.18), transparent 70%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#4d65ff]/30 bg-[#4d65ff]/10 text-xs text-[#a5b4fc] font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#4d65ff] animate-pulse" />
            UpBit Academy Full Curriculum &amp; Learning Tracks
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-space-grotesk text-white tracking-tight mb-4">
            Master Production-Ready{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4d65ff] via-[#9d4edd] to-[#b23fe0]">
              AI &amp; Engineering Skills
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg mb-8 leading-relaxed">
            Explore industry-vetted courses and interactive visual curriculum roadmaps built and taught by real Forward Deployed Engineers.
          </p>

          {/* Primary View Switcher: Courses vs RoadMap */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleTabChange('catalog')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold font-space-grotesk transition-all cursor-pointer ${
                mainTab === 'catalog'
                  ? 'bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] text-white shadow-xl shadow-[#4d65ff]/30 scale-105 border border-white/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <BookOpen size={16} />
              <span>All Courses ({initialCourses.length})</span>
            </button>
            <button
              onClick={() => handleTabChange('roadmap')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold font-space-grotesk transition-all cursor-pointer ${
                mainTab === 'roadmap'
                  ? 'bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] text-white shadow-xl shadow-[#b23fe0]/30 scale-105 border border-white/20'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <Compass size={16} />
              <span>Interactive 32-Week RoadMap</span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">
                New
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content: RoadMap View or Course Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {mainTab === 'roadmap' ? (
          <VisualRoadmap courses={seriesCourses.length > 0 ? seriesCourses : initialCourses} />
        ) : (
          <>
            {/* Catalog Search bar */}
            <div className="max-w-2xl mx-auto relative group">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4d65ff] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by title, topic, or keyword..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#4d65ff] focus:bg-white/10 shadow-xl backdrop-blur-xl transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Controls / Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Categories' },
                  { id: 'frontend', label: 'Frontend & Next.js' },
                  { id: '3d', label: '3D & Animations' },
                  { id: 'saas', label: 'SaaS & Backend' },
                  { id: 'career', label: 'Career & AI' },
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-space-grotesk transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] text-white shadow-lg shadow-[#4d65ff]/30'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Secondary Select Filters & Layout Toggle */}
              <div className="flex items-center gap-3">
                {/* Level Filter */}
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-gray-300 focus:outline-none focus:border-[#4d65ff]"
                >
                  <option value="all" className="bg-slate-900 text-white">All Levels</option>
                  <option value="Beginner" className="bg-slate-900 text-white">Beginner</option>
                  <option value="Intermediate" className="bg-slate-900 text-white">Intermediate</option>
                  <option value="Advanced" className="bg-slate-900 text-white">Advanced</option>
                </select>

                {/* Sort Filter */}
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-gray-300 focus:outline-none focus:border-[#4d65ff]"
                >
                  <option value="popular" className="bg-slate-900 text-white">Most Popular</option>
                  <option value="rating" className="bg-slate-900 text-white">Highest Rated</option>
                  <option value="price-low" className="bg-slate-900 text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-slate-900 text-white">Price: High to Low</option>
                </select>

                {/* Grid / List View Toggle */}
                <div className="flex items-center bg-white/5 border border-white/15 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-[#4d65ff] text-white' : 'text-gray-400 hover:text-white'}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-[#4d65ff] text-white' : 'text-gray-400 hover:text-white'}`}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-mono">
                Showing <span className="font-bold text-white">{filteredCourses.length}</span> course{filteredCourses.length === 1 ? '' : 's'}
              </p>
            </div>

            {/* Grid vs List Render */}
            {filteredCourses.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <Filter size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-bold font-space-grotesk text-white mb-2">No courses match your criteria</h3>
                <p className="text-gray-400 text-xs mb-6">Try clearing your filters or searching for something else.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                  }}
                  className="button is-chamfer is-grad w-button cursor-pointer"
                  style={{ padding: '10px 24px', fontSize: '0.85rem' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <UnifiedCourseCard key={course.slug} course={course} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <UnifiedListCard key={course.slug} course={course} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

function UnifiedCourseCard({ course }: { course: Course }) {
  const imageUrl = getCourseImageUrl(course.image);
  const level = course.level || 'Beginner';
  const levelClass = level.toLowerCase().includes('adv')
    ? 'advanced'
    : level.toLowerCase().includes('inter')
    ? 'intermediate'
    : 'beginner';
  const rating = Number(course.rating || 4.95).toFixed(2);
  const reviews = course.reviews || 980;
  const duration = course.duration || '6h';
  const mentor = (course.instructors && course.instructors[0]) || 'UpBit Mentor';

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="course-card"
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        className="course-card__thumb"
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={course.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div
            className="course-card__thumb-art"
            style={{ background: 'linear-gradient(135deg, #0d1a3a 0%, #1a0d3a 60%, #0a0a1a 100%)' }}
          >
            <span className="thumb-glow" style={{ width: '120px', height: '120px', top: '-20px', left: '-20px', background: '#4d65ff' }} />
            <span className="thumb-glow" style={{ width: '90px', height: '90px', bottom: '-10px', right: '10px', background: '#B23FE0' }} />
          </div>
        )}
        <div className="course-card__preview-btn">
          <span>&#9654; View Course</span>
        </div>
        <div className={`course-card__badge ${levelClass}`}>{level}</div>
        <div className="course-card__bookmark">&#9646;</div>
      </div>

      <div className="course-card__body">
        <div className="course-card__meta">
          <div className="course-card__rating">
            <span className="star">&#9733;</span> {rating} <span className="count">({reviews})</span>
          </div>
          <div className="course-card__duration">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            {duration}
          </div>
        </div>

        <h3 className="course-card__title font-space-grotesk">{course.title}</h3>
        <p className="course-card__desc">{course.tagline || course.description}</p>

        <div className="course-card__footer">
          <div className="course-card__mentor">
            <div className="course-card__mentor-icon">&#127891;</div>
            {mentor}
          </div>
          <span className="course-card__cta">View Course &#8594;</span>
        </div>
      </div>
    </Link>
  );
}

function UnifiedListCard({ course }: { course: Course }) {
  const imageUrl = getCourseImageUrl(course.image);
  const rating = Number(course.rating || 4.95).toFixed(2);
  const reviews = course.reviews || 980;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block rounded-2xl border border-white/10 bg-[#0e1120] p-4 sm:p-5 hover:border-[#4d65ff]/50 hover:bg-[#12162a] transition-all duration-300"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden shrink-0 bg-slate-900">
          <Image
            src={imageUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-[#4d65ff]/10 text-[#4d65ff] border border-[#4d65ff]/20">
              {course.level}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              ★ {rating} <span className="text-gray-400 font-normal">({reviews})</span>
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">{course.duration}</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold font-space-grotesk text-white group-hover:text-[#a5b4fc] transition-colors truncate">
            {course.title}
          </h3>

          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
            {course.tagline || course.description}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-xs font-bold text-[#4d65ff] group-hover:text-[#b23fe0] transition-colors flex items-center gap-1">
            View Details &#8594;
          </span>
        </div>
      </div>
    </Link>
  );
}
