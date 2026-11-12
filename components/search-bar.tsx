'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Loader2, BookOpen, X } from 'lucide-react';
import type { CourseSearchDocument } from '@/lib/search/types';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Search courses, skills, instructors...',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CourseSearchDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.hits || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed to search courses:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative w-full max-w-md ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-9 text-sm text-white placeholder-gray-400 outline-none backdrop-blur-md transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-1 focus:ring-cyan-500/30"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-white/10 bg-[#0c1222]/95 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Matching Courses ({results.length})
          </div>
          <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
            {results.map((course) => (
              <Link
                key={course.id || course.slug}
                href={`/courses/${course.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 p-3 transition hover:bg-white/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white group-hover:text-cyan-400">
                    {course.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{course.instructorName}</span>
                    <span>•</span>
                    <span className="capitalize">{course.level}</span>
                  </div>
                </div>
                <div className="text-sm font-semibold text-cyan-400">
                  {course.price > 0 ? `$${course.price}` : 'Free'}
                </div>
              </Link>
            ))}
          </div>
          <div className="border-t border-white/10 p-2 text-center">
            <Link
              href={`/courses?search=${encodeURIComponent(query)}`}
              onClick={() => setIsOpen(false)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              View all results →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
