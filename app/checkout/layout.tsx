import type { ReactNode } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

