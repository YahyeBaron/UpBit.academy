import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 text-center selection:bg-blue-500 selection:text-white">
      <div className="relative mb-6">
        <div className="text-9xl font-black tracking-widest text-white/10 select-none">404</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-blue-500">Page Not Found</span>
        </div>
      </div>

      <p className="max-w-md text-gray-400 text-sm mb-8 leading-relaxed">
        The page or resource you are looking for does not exist, has been moved, or is temporarily unavailable.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/25"
        >
          <Home size={16} />
          Return Home
        </Link>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-sm transition-all"
        >
          <ArrowLeft size={16} />
          Browse Courses
        </Link>
      </div>
    </div>
  );
}
