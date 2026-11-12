'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function AdminLogoutBtn({ adminName }: { adminName?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.warn('Admin logout error:', err);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {adminName && (
        <span className="text-xs font-bold text-gray-300 hidden sm:inline-block">
          {adminName}
        </span>
      )}
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all"
        title="Sign Out of Admin Portal"
      >
        <LogOut size={13} /> Exit Studio
      </button>
    </div>
  );
}
