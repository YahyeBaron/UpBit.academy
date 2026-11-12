export default function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#030712] text-white font-sans animate-pulse flex">
      {/* Sidebar Skeleton */}
      <div className="w-64 border-r border-white/10 p-6 space-y-6 hidden md:block shrink-0">
        <div className="w-32 h-7 rounded bg-white/10" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      </div>

      {/* Main Admin Area */}
      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="w-48 h-8 rounded-lg bg-white/10" />
            <div className="w-64 h-4 rounded bg-white/5" />
          </div>
          <div className="w-32 h-10 rounded-xl bg-blue-600/40" />
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="w-24 h-4 rounded bg-white/10" />
              <div className="w-16 h-8 rounded bg-white/10" />
            </div>
          ))}
        </div>

        {/* Admin Table Skeleton */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 space-y-4">
          <div className="w-40 h-6 rounded bg-white/10" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.02]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
