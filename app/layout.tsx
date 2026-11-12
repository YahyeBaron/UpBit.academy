import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { PostHogProvider } from '@/components/PostHogProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EraySame Tech Academy - Premier Tech & Development E-Learning Platform',
  description: 'Master web development, 3D graphics, SaaS building, and modern frontend technologies with industry experts.',
  icons: {
    icon: '/assets/logo-eraysame-transparent.png',
    shortcut: '/assets/logo-eraysame-transparent.png',
    apple: '/assets/logo-eraysame-transparent.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark scroll-smooth">
        <body className={`${inter.className} bg-black text-white antialiased selection:bg-blue-500 selection:text-white`}>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
