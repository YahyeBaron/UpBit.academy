'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/dashboard-layout';
import { MOCK_STUDENT } from '@/lib/data';
import { useUser } from '@clerk/nextjs';
import { UploadButton } from '@/lib/uploadthing';
import { Save, Check, User, Loader2 } from 'lucide-react';

const PRESET_AVATARS = [
  '/assets/w-rc.jpg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export default function ProfileSettingsPage() {
  const { user, isLoaded } = useUser();
  const [name, setName] = useState(MOCK_STUDENT.name);
  const [email, setEmail] = useState(MOCK_STUDENT.email);
  const [avatar, setAvatar] = useState(MOCK_STUDENT.avatar);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setName(user.fullName || user.firstName || MOCK_STUDENT.name);
      setEmail(user.primaryEmailAddress?.emailAddress || MOCK_STUDENT.email);
      setAvatar(user.imageUrl || MOCK_STUDENT.avatar);
    }
  }, [isLoaded, user]);

  const handleImageUpload = async (uploadedUrl: string) => {
    setAvatar(uploadedUrl);
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: uploadedUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error syncing avatar to DB:', err);
    }
  };



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (user && name) {
        const parts = name.trim().split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';
        await user.update({ firstName, lastName });
      }

      await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Profile Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Manage your account profile picture and personal information.</p>
        </div>

        <form onSubmit={handleSave} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md space-y-8">
          
            {/* Profile Picture Upload — UploadThing */}
            <div className="space-y-4 pb-6 border-b border-white/10">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Profile Photo
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar Preview */}
                <div className="relative">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500/40 shadow-xl bg-gray-900">
                    <Image src={avatar} alt={name} fill className="object-cover" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-400" size={24} />
                      </div>
                    )}
                  </div>
                </div>

                {/* UploadThing Button */}
                <div className="space-y-2 text-center sm:text-left">
                  <UploadButton
                    endpoint="avatarUploader"
                    onUploadBegin={() => setIsUploading(true)}
                    onClientUploadComplete={(res) => {
                      setIsUploading(false);
                      if (res?.[0]?.ufsUrl || res?.[0]?.url) {
                        handleImageUpload(res[0].ufsUrl ?? res[0].url);
                      }
                    }}
                    onUploadError={(err) => {
                      setIsUploading(false);
                      console.error('Upload error:', err);
                    }}
                    className="ut-button:bg-blue-600 ut-button:hover:bg-blue-500 ut-button:rounded-xl ut-button:font-bold ut-button:text-xs ut-button:px-4 ut-button:py-2 ut-allowed-content:text-gray-500 ut-allowed-content:text-[11px]"
                  />
                  <p className="text-[11px] text-gray-500">JPG, PNG, GIF or WEBP. Max 4MB.</p>
                </div>
              </div>

              {/* Preset Avatars Picker */}
              <div className="pt-2">
                <span className="text-[11px] text-gray-400 block mb-2 font-medium">Or select a preset avatar:</span>
                <div className="flex items-center gap-3">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleImageUpload(url)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        avatar === url ? 'border-cyan-400 scale-110 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-white/40'
                      }`}
                    >
                      <Image src={url} alt={`Preset ${idx + 1}`} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

          {/* User Personal Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm cursor-not-allowed opacity-75"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">Email managed via Clerk Authentication.</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25"
            >
              <Save size={16} />
              Save Changes
            </button>

            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                <Check size={14} />
                Profile updated successfully!
              </span>
            )}
          </div>

        </form>
      </div>
    </DashboardLayout>
  );
}
