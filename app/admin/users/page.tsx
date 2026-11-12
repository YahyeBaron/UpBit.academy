'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  BookOpen,
  ChevronDown,
  Check,
  RefreshCw,
  UserCog,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  joinedDate: string;
  createdAt: string;
  _count: { enrollments: number; notes: number };
}

const ROLES = ['student', 'INSTRUCTOR', 'ADMIN'];
const ROLE_COLORS: Record<string, string> = {
  student: 'bg-gray-500/10 text-gray-300 border-gray-500/20',
  INSTRUCTOR: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  ADMIN: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const updateRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      showToast(`Role updated to ${newRole}`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to update role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user');

      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setTotal((prev) => Math.max(0, prev - 1));
      showToast(data.message || 'User permanently deleted', 'success');
      setUserToDelete(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete user', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-2xl border transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950 border-rose-500/30 text-rose-300'
          }`}
        >
          {toast.type === 'success' ? <Check size={16} /> : null}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users size={22} className="text-violet-400" /> User Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {total.toLocaleString()} registered users — manage roles, view activity, or delete accounts
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-all cursor-pointer"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
        >
          <option value="">All Roles</option>
          <option value="student">Students</option>
          <option value="INSTRUCTOR">Instructors</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" /> Loading users…
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-bold">No users found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-6 py-4">User</th>
                  <th className="text-left px-4 py-4">Role</th>
                  <th className="text-center px-4 py-4">Enrollments</th>
                  <th className="text-center px-4 py-4">Notes</th>
                  <th className="text-left px-4 py-4">Joined</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <div>
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                          ROLE_COLORS[user.role] || ROLE_COLORS.student
                        }`}
                      >
                        <Shield size={10} /> {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="flex items-center justify-center gap-1 text-sm font-bold text-white">
                        <BookOpen size={13} className="text-blue-400" />
                        {user._count.enrollments}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-400 font-mono">
                      {user._count.notes}
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Role Switcher & Actions */}
                        <div className="relative group/role">
                          <button
                            disabled={updatingId === user.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <UserCog size={12} />
                            Change Role
                            <ChevronDown size={11} />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl z-20 opacity-0 invisible group-hover/role:opacity-100 group-hover/role:visible transition-all overflow-hidden p-1">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Assign Role
                            </div>
                            {ROLES.map((role) => (
                              <button
                                key={role}
                                onClick={() => updateRole(user.id, role)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg hover:bg-white/5 transition-colors text-left cursor-pointer ${
                                  user.role === role ? 'text-blue-400 bg-blue-500/10' : 'text-gray-300'
                                }`}
                              >
                                {user.role === role && <Check size={12} />}
                                {user.role !== role && <span className="w-3" />}
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Standalone Delete Button with explicit label */}
                        <button
                          onClick={() => setUserToDelete(user)}
                          title="Delete User Permanently"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 border border-rose-500/30 hover:border-rose-600 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0a0e1a] p-6 shadow-2xl space-y-5">
            <button
              onClick={() => !deleting && setUserToDelete(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 text-rose-400">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Delete User Account</h3>
                <p className="text-xs text-rose-400/80">Permanent destructive action</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-3">
              <img
                src={userToDelete.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${userToDelete.name}`}
                alt={userToDelete.name}
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div className="overflow-hidden">
                <p className="font-bold text-white truncate">{userToDelete.name}</p>
                <p className="text-xs text-gray-400 truncate">{userToDelete.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                    Role: {userToDelete.role}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {userToDelete._count.enrollments} courses enrolled
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              Are you sure you want to permanently delete this user? All their course enrollments, notes, progress, and certificates will be completely removed.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteUser}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
