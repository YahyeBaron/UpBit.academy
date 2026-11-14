import DashboardLayout from '@/components/dashboard-layout';
import AchievementsClient from '@/components/achievements-client';
import { getCurrentDbUserAsync } from '@/lib/db-data';
import { Award, Trophy, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ALL_BADGES = [
  { icon: '🎉', name: 'Joined UpBit', key: 'joined', description: 'Signed up to UpBit Academy' },
  { icon: '🎯', name: 'First Lesson', key: 'first_lesson', description: 'Completed your first lesson' },
  { icon: '🔥', name: '7-Day Streak', key: 'streak_7', description: 'Learned 7 days in a row' },
  { icon: '⚡', name: 'Speed Learner', key: 'speed_learner', description: 'Completed 3 lessons in a day' },
  { icon: '🏆', name: 'Course Complete', key: 'course_complete', description: 'Finished an entire course' },
  { icon: '💎', name: 'Top Performer', key: 'top_performer', description: 'Scored 100% on a quiz' },
];

export default async function AchievementsPage() {
  const dbUser = await getCurrentDbUserAsync();
  const userAchievements = dbUser?.achievements || [];
  const userEnrollments = dbUser?.enrollments || [];

  // New users always get the "joined" badge
  const earnedKeys = new Set(['joined', ...userAchievements.map((a) => a.title)]);
  const completedCourses = userEnrollments.filter((e) => e.progress === 100);
  if (completedCourses.length > 0) earnedKeys.add('course_complete');

  const unlockedCount = ALL_BADGES.filter((b) => earnedKeys.has(b.key)).length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Achievements & Badges</h1>
          <p className="text-sm text-gray-400 mt-1">Track your unlocked accomplishments and download certificates.</p>
        </div>

        {/* Earned Certificates */}
        <AchievementsClient completedCourses={completedCourses} />

        {/* All Badges */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">All Badges</h2>
            <span className="text-xs text-amber-400 font-bold">{unlockedCount} / {ALL_BADGES.length} Unlocked</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {ALL_BADGES.map((badge) => {
              const earned = earnedKeys.has(badge.key);
              return (
                <div
                  key={badge.key}
                  className={`p-5 rounded-2xl border text-center transition-all group relative ${
                    earned
                      ? 'border-amber-500/30 bg-amber-500/10 text-white shadow-xl'
                      : 'border-white/5 bg-white/5 opacity-40 text-gray-500'
                  }`}
                >
                  <div className="text-4xl mb-3">
                    {earned ? badge.icon : <Lock size={28} className="mx-auto text-gray-600" />}
                  </div>
                  <div className="text-xs font-bold">{badge.name}</div>
                  <div className="text-[10px] mt-1 text-gray-400">
                    {earned ? 'Unlocked' : 'Locked'}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-36 bg-black/90 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {badge.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
