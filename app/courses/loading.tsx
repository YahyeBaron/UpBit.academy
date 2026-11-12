export default function CoursesCatalogSkeleton() {
  return (
    <div className="min-h-screen bg-black text-white font-sans animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-white/10 bg-black/80 px-6 flex items-center justify-between">
        <div className="w-32 h-6 rounded bg-white/10" />
        <div className="w-24 h-8 rounded-lg bg-white/10" />
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Title + Search */}
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <div className="h-10 w-3/4 mx-auto rounded-xl bg-white/10" />
          <div className="h-5 w-1/2 mx-auto rounded bg-white/5" />
          <div className="h-12 w-full rounded-2xl bg-white/[0.05] border border-white/10 mt-6" />
        </div>

        {/* Categories Bar Skeleton */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-28 h-9 rounded-xl bg-white/[0.05] border border-white/10 shrink-0" />
          ))}
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl bg-[#030d1a] border border-white/10 p-5 space-y-4">
              <div className="aspect-video w-full rounded-2xl bg-white/10" />
              <div className="w-24 h-4 rounded-full bg-blue-500/20" />
              <div className="w-5/6 h-6 rounded bg-white/10" />
              <div className="w-full h-4 rounded bg-white/5" />
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="w-20 h-5 rounded bg-white/10" />
                <div className="w-16 h-5 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
