export default function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white font-sans animate-pulse">
      {/* Top Navbar Skeleton */}
      <div className="h-16 border-b border-white/10 bg-black/80 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="w-32 h-5 rounded bg-white/10" />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-4 rounded bg-white/10" />
          <div className="w-24 h-9 rounded-xl bg-white/10" />
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <div className="relative pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Left Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="w-28 h-6 rounded-full bg-blue-500/20 border border-blue-500/30" />
            <div className="h-12 w-3/4 rounded-xl bg-white/10" />
            <div className="h-6 w-full rounded bg-white/5" />
            <div className="h-6 w-5/6 rounded bg-white/5" />

            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10" />
                <div className="space-y-2">
                  <div className="w-24 h-4 rounded bg-white/10" />
                  <div className="w-32 h-3 rounded bg-white/5" />
                </div>
              </div>
              <div className="w-24 h-5 rounded bg-white/10" />
            </div>

            {/* Curriculum Skeleton */}
            <div className="pt-8 space-y-4">
              <div className="h-8 w-48 rounded bg-white/10" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-white/[0.04] border border-white/10" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Card Skeleton */}
          <div className="lg:col-span-1 rounded-3xl bg-[#030d1a] border border-white/10 p-6 space-y-6">
            <div className="aspect-video w-full rounded-2xl bg-white/10" />
            <div className="h-10 w-32 rounded bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-blue-600/30" />
            <div className="space-y-3 pt-4 border-t border-white/10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-full rounded bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
