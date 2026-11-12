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
  Star,
  Clock,
  BookOpen,
  Filter,
  ArrowRight,
  LayoutGrid,
  List,
  X,
  Rocket,
  Compass,
  Award,
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
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white font-sans">
      <Navbar />

      {/* Header Banner */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-[#030d20] via-black to-black border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.15),transparent_70%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs text-blue-300 font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            EraySame Tech Academy Full Catalog & Learning Tracks
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
            Master Cutting-Edge <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Engineering Skills</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-400 text-base sm:text-lg mb-8">
            Explore industry-vetted courses and interactive visual curriculum roadmaps designed to accelerate your developer journey.
          </p>

          {/* Primary View Switcher: Courses vs RoadMap */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleTabChange('catalog')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mainTab === 'catalog'
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-105 border border-blue-400/40'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              <BookOpen size={16} />
              <span>All Courses</span>
            </button>
            <button
              onClick={() => handleTabChange('roadmap')}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                mainTab === 'roadmap'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-600/30 scale-105 border border-purple-400/40'
                  : 'bg-indigo-500/10 text-indigo-300 hover:text-white hover:bg-indigo-500/20 border border-indigo-500/30'
              }`}
            >
              <Compass size={16} className={mainTab === 'roadmap' ? 'text-white' : 'text-indigo-400'} />
              <span>Interactive RoadMap</span>
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
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses by title, topic, or keyword (e.g. Next.js, Python, Security)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/80 focus:bg-white/10 shadow-xl backdrop-blur-xl transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Controls / Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 border-b border-white/10">
              {/* Category Filter Tabs (Exclusively course topics, not roadmap) */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'All Categories' },
                  { id: 'frontend', label: 'Frontend & Next.js' },
                  { id: '3d', label: '3D & Animations' },
                  { id: 'saas', label: 'SaaS & Backend' },
                  { id: 'career', label: 'Career & Business' },
                ].map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
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
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-gray-300 focus:outline-none focus:border-blue-500"
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
                  className="bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-gray-300 focus:outline-none focus:border-blue-500"
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
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    aria-label="Grid view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
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
                <h3 className="text-xl font-bold text-white mb-2">No courses match your criteria</h3>
                <p className="text-gray-400 text-xs mb-6">Try clearing your filters or searching for something else.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedLevel('all');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <GridCard key={course.slug} course={course} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <ListCard key={course.slug} course={course} />
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

function GridCard({ course }: { course: Course }) {
  const imageUrl = getCourseImageUrl(course.image);

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/5 overflow-hidden flex flex-col hover:border-blue-500/50 hover:bg-white/[0.08] transition-all duration-300 shadow-xl">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-900">
        <Image
          src={imageUrl}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {course.isComingSoon ? (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600/90 text-white backdrop-blur-md border border-indigo-400/40 uppercase tracking-wider flex items-center gap-1 shadow-lg">
            <Rocket size={11} /> Coming Soon
          </span>
        ) : (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-md text-blue-300 border border-white/10 uppercase tracking-wider">
            {course.category}
          </span>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {course.hasCertificate && (
            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/20 backdrop-blur-md text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Award size={11} /> Certificate
            </span>
          )}
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/10 backdrop-blur-md text-gray-200 border border-white/10">
            {course.level}
          </span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {course.seriesName && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                <Compass size={11} className="text-indigo-400" />
                {course.seriesName} • Wk {course.seriesOrder ?? 0}
              </span>
            </div>
          )}
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2 line-clamp-1">
            {course.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2">{course.tagline}</p>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1 text-amber-400 font-semibold">
            <Star size={13} className="fill-amber-400" />
            <span>{course.rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={13} />
            <span>{course.totalHours > 0 ? `${course.totalHours} hrs` : course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen size={13} />
            <span>{course.totalLessons} lessons</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {course.isComingSoon ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Clock size={13} className="text-indigo-400" />
              <span>{course.releaseDate ? `Target: ${course.releaseDate}` : 'Pre-Launch Waitlist'}</span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">${course.price}</span>
              {course.originalPrice > course.price && (
                <span className="text-xs text-gray-500 line-through">${course.originalPrice}</span>
              )}
            </div>
          )}
          <Link
            href={`/courses/${course.slug}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              course.isComingSoon
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20'
                : 'bg-blue-600/90 hover:bg-blue-600 text-white'
            }`}
          >
            {course.isComingSoon ? 'Join Waitlist' : 'View Course'}
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ListCard({ course }: { course: Course }) {
  const imageUrl = getCourseImageUrl(course.image);

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-blue-500/50 transition-all flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-full sm:w-56 aspect-video rounded-xl overflow-hidden bg-gray-900 shrink-0">
        <Image src={imageUrl} alt={course.title} fill className="object-cover group-hover:scale-105 transition-transform" />
        {course.isComingSoon && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-600/90 text-white backdrop-blur-md uppercase tracking-wider flex items-center gap-1">
            <Rocket size={10} /> Coming Soon
          </span>
        )}
      </div>

      <div className="flex-1 space-y-2 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {course.seriesName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 flex items-center gap-1">
                <Compass size={10} /> {course.seriesName} • Wk {course.seriesOrder ?? 0}
              </span>
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
              {course.category} • {course.level}
            </span>
            {course.hasCertificate && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
                <Award size={10} /> Cert
              </span>
            )}
            {course.isComingSoon && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                {course.releaseDate ? `Launch: ${course.releaseDate}` : 'Pre-Launch'}
              </span>
            )}
          </div>
          {!course.isComingSoon && (
            <span className="text-lg font-black text-white">${course.price}</span>
          )}
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{course.title}</h3>
        <p className="text-xs text-gray-400 line-clamp-1">{course.tagline}</p>

        <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
          <span className="text-amber-400 font-bold flex items-center gap-1">
            <Star size={13} className="fill-amber-400" /> {course.rating} ({course.reviews})
          </span>
          <span>{course.totalHours > 0 ? `${course.totalHours} hrs` : course.duration}</span>
          <span>{course.totalLessons} lessons</span>
        </div>
      </div>

      <Link
        href={`/courses/${course.slug}`}
        className={`px-5 py-3 rounded-xl text-xs font-bold transition-colors shrink-0 w-full sm:w-auto text-center ${
          course.isComingSoon
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
            : 'bg-blue-600 hover:bg-blue-500 text-white'
        }`}
      >
        {course.isComingSoon ? 'Join Waitlist' : 'View Course'}
      </Link>
    </div>
  );
}
