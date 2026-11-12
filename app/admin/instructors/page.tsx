'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  Search,
  X,
  Check,
  Globe,
  Github,
  Twitter,
  Linkedin,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface InstructorItem {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  cover?: string;
  rating: number;
  reviews: number;
  students: number;
  coursesCount: number;
  expertise: string[];
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    title: '',
    bio: '',
    avatar: '/assets/pri-next.jpg',
    expertise: 'Next.js 15, TypeScript, Full-Stack Architecture',
    github: '',
    twitter: '',
    linkedin: '',
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/instructors');
      const data = await res.json();
      setInstructors(data.instructors || []);
    } catch {
      showToast('Failed to load instructors', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const openCreateModal = () => {
    setEditingInstructor(null);
    setForm({
      id: '',
      name: '',
      title: '',
      bio: '',
      avatar: '/assets/pri-next.jpg',
      expertise: 'Next.js 15, TypeScript, Full-Stack Architecture',
      github: '',
      twitter: '',
      linkedin: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (inst: InstructorItem) => {
    setEditingInstructor(inst);
    setForm({
      id: inst.id,
      name: inst.name,
      title: inst.title,
      bio: inst.bio,
      avatar: inst.avatar,
      expertise: Array.isArray(inst.expertise) ? inst.expertise.join(', ') : '',
      github: inst.social?.github || '',
      twitter: inst.social?.twitter || '',
      linkedin: inst.social?.linkedin || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.title || !form.bio) {
      showToast('Name, title, and bio are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: form.id || undefined,
        name: form.name,
        title: form.title,
        bio: form.bio,
        avatar: form.avatar,
        expertise: form.expertise.split(',').map((s) => s.trim()).filter(Boolean),
        github: form.github || null,
        twitter: form.twitter || null,
        linkedin: form.linkedin || null,
      };

      const url = editingInstructor
        ? `/api/admin/instructors/${editingInstructor.id}`
        : '/api/admin/instructors';
      const method = editingInstructor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Operation failed');

      showToast(
        editingInstructor ? 'Instructor updated successfully!' : 'Instructor created successfully!',
        'success'
      );
      setModalOpen(false);
      fetchInstructors();
    } catch (err: any) {
      showToast(err.message || 'Error saving instructor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete instructor "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/instructors/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      showToast(`Instructor ${name} deleted successfully!`, 'success');
      setInstructors((prev) => prev.filter((i) => i.id !== id));
    } catch (err: any) {
      showToast(err.message || 'Error deleting instructor', 'error');
    }
  };

  const filtered = instructors.filter((inst) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.title.toLowerCase().includes(q) ||
      inst.expertise.some((e) => e.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-2xl border ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950 border-rose-500/30 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-[10px] uppercase tracking-wider">
              Faculty & Mentors
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap size={28} className="text-cyan-400" /> Instructor Management Hub
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage course instructors, update bios, and oversee assigned catalog curricula.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchInstructors}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all"
            title="Refresh instructors list"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/20 transition-all"
          >
            <Plus size={15} /> Add New Instructor
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, expertise, or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="text-xs text-gray-400 flex items-center gap-3">
          <span>
            Total Instructors: <strong className="text-white font-mono">{instructors.length}</strong>
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span>
            Assigned Courses:{' '}
            <strong className="text-cyan-400 font-mono">
              {instructors.reduce((acc, i) => acc + (i.coursesCount || 0), 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Instructors Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
          <RefreshCw size={16} className="animate-spin text-cyan-400" /> Loading instructors…
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 rounded-2xl border border-white/10 bg-white/[0.01] text-center space-y-3">
          <GraduationCap size={36} className="mx-auto text-gray-600" />
          <p className="text-sm font-bold text-gray-300">No instructors found</p>
          <p className="text-xs text-gray-500">
            {search ? 'Try clearing your search query.' : 'Click "Add New Instructor" to create your first teacher profile.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((inst) => (
            <div
              key={inst.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all p-6 flex flex-col justify-between space-y-4 shadow-xl group relative overflow-hidden"
            >
              <div className="space-y-4">
                {/* Header Profile */}
                <div className="flex items-start gap-4">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/15 shrink-0 bg-gray-900 shadow-md">
                    <Image src={inst.avatar || '/assets/pri-next.jpg'} alt={inst.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-white text-base truncate group-hover:text-cyan-300 transition-colors">
                        {inst.name}
                      </h3>
                      <span className="text-[10px] font-mono text-gray-500 uppercase px-2 py-0.5 rounded bg-white/5">
                        /{inst.id}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400 font-semibold truncate mt-0.5">{inst.title}</p>
                  </div>
                </div>

                {/* Bio Snippet */}
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{inst.bio}</p>

                {/* Expertise Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(inst.expertise || []).slice(0, 4).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] text-gray-300 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {(inst.expertise || []).length > 4 && (
                    <span className="text-[10px] text-gray-500 font-mono">
                      +{(inst.expertise || []).length - 4}
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <BookOpen size={13} className="text-blue-400" />
                    <span className="font-mono font-bold text-white">{inst.coursesCount || 0}</span>
                    <span>courses</span>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-2 text-gray-500">
                    {inst.social?.github && (
                      <a href={inst.social.github} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                        <Github size={13} />
                      </a>
                    )}
                    {inst.social?.twitter && (
                      <a href={inst.social.twitter} target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">
                        <Twitter size={13} />
                      </a>
                    )}
                    {inst.social?.linkedin && (
                      <a href={inst.social.linkedin} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">
                        <Linkedin size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(inst)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all border border-white/10"
                >
                  <Edit3 size={13} /> Edit Profile
                </button>

                <button
                  onClick={() => handleDelete(inst.id, inst.name)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 transition-all"
                  title="Delete instructor"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1322] border border-white/15 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingInstructor ? 'Edit Instructor Profile' : 'Add New Instructor'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {editingInstructor
                      ? `Updating details for ${editingInstructor.name}`
                      : 'Create a new faculty member profile for course authoring.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">Instructor Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Yahye Baron"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-300">
                    Identifier Slug {editingInstructor ? '(Immutable)' : '(Auto-generated)'}
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingInstructor)}
                    value={
                      form.id ||
                      form.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)+/g, '')
                    }
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="e.g. yahye"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Professional Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Lead Instructor & Full-Stack Architect"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Avatar Image URL *</label>
                <input
                  type="text"
                  required
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="/assets/pri-next.jpg or https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">Bio & Qualifications *</label>
                <textarea
                  rows={3}
                  required
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Experienced engineer with 10+ years specializing in Next.js, TypeScript, and high-scale applications."
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  Expertise Areas (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.expertise}
                  onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  placeholder="Next.js 15, Three.js, TypeScript, Cloud"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 border-t border-white/10 space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Social & Profile Links (Optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={form.github}
                    onChange={(e) => setForm({ ...form, github: e.target.value })}
                    placeholder="GitHub URL"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={form.twitter}
                    onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                    placeholder="Twitter/X URL"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    value={form.linkedin}
                    onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                    placeholder="LinkedIn URL"
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Saving…' : editingInstructor ? 'Update Instructor' : 'Create Instructor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
