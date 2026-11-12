import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero/hero-section';
import ImpactSection from '@/components/impact-section';
import TechnologyMarquee from '@/components/tech-marquee';
import CoursesSection from '@/components/courses-section';
import PricingSection from '@/components/pricing';
import BentoFeatures from '@/components/bento-features';
import Testimonials from '@/components/testimonials';
import FAQ from '@/components/faq';
import Footer from '@/components/footer';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500 selection:text-white font-sans overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <ImpactSection />
      <TechnologyMarquee />
      <CoursesSection />
      <PricingSection />
      <BentoFeatures />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  );
}
