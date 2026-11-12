export default function LearnPlayerSkeleton() {
  return (
    <div className="min-h-screen bg-[#020813] text-white font-sans animate-pulse flex flex-col">
      {/* Top Bar Skeleton */}
      <div className="h-16 border-b border-white/10 bg-black px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-20 h-8 rounded-lg bg-white/10" />
          <div className="w-48 h-5 rounded bg-white/10 hidden sm:block" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-24 h-4 rounded bg-white/10" />
          <div className="w-8 h-8 rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Main Player + Sidebar Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Player Main Area */}
        <div className="flex-1 flex flex-col space-y-4 p-4">
          <div className="aspect-video w-full rounded-2xl bg-black border border-white/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/10" />
          </div>

          <div className="h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between px-4">
            <div className="w-32 h-6 rounded bg-white/10" />
            <div className="flex gap-2">
              <div className="w-20 h-7 rounded-lg bg-white/10" />
              <div className="w-24 h-7 rounded-lg bg-blue-600/40" />
            </div>
          </div>

          {/* Tabs Content Skeleton */}
          <div className="space-y-4 pt-4">
            <div className="flex gap-6 border-b border-white/10 pb-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-5 rounded bg-white/10" />
              ))}
            </div>
            <div className="w-3/4 h-7 rounded bg-white/10" />
            <div className="w-full h-4 rounded bg-white/5" />
            <div className="w-5/6 h-4 rounded bg-white/5" />
          </div>
        </div>

        {/* Right Curriculum Sidebar */}
        <div className="w-full lg:w-96 border-l border-white/10 bg-[#020712] p-4 space-y-4">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-white/[0.04] border border-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
