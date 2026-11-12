export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans animate-pulse">
      {/* Dashboard Top Header Skeleton */}
      <div className="h-16 border-b border-white/10 bg-black/60 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="w-40 h-5 rounded bg-white/10" />
        </div>
        <div className="w-10 h-10 rounded-full bg-white/10" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome banner skeleton */}
        <div className="h-36 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/20 border border-white/10 p-8 space-y-3">
          <div className="w-64 h-7 rounded-lg bg-white/10" />
          <div className="w-96 h-4 rounded bg-white/5" />
        </div>

        {/* Stats Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-white/10" />
              <div className="w-20 h-6 rounded bg-white/10" />
              <div className="w-32 h-3 rounded bg-white/5" />
            </div>
          ))}
        </div>

        {/* Course Cards Grid Skeleton */}
        <div className="space-y-4">
          <div className="w-44 h-6 rounded bg-white/10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
                <div className="aspect-video w-full rounded-xl bg-white/10" />
                <div className="w-3/4 h-5 rounded bg-white/10" />
                <div className="w-1/2 h-4 rounded bg-white/5" />
                <div className="h-2 w-full rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
