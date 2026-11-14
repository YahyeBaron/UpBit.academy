import type { ReactNode } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[#050508] text-white">
      {/* Single, unified public marketing navbar - fixed directly to viewport */}
      <Navbar />

      {/* Main page content landmark */}
      <main id="main-content" className="w-full overflow-x-clip">
        {children}
      </main>

      {/* Single, unified public footer */}
      <Footer />
    </div>
  );
}

