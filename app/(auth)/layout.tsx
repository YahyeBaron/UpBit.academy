import type { ReactNode } from 'react';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
