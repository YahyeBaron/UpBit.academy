'use client';

import { motion } from 'framer-motion';

const TECH_ITEMS = [
  { name: 'JavaScript', src: '/assets/js.svg', tag: 'ES2026' },
  { name: 'React 19', src: '/assets/react.svg', tag: 'Frontend' },
  { name: 'Next.js 15', src: '/assets/next.svg', tag: 'App Router' },
  { name: 'Tailwind CSS', src: '/assets/tailwind.svg', tag: 'v4 Engine' },
  { name: 'GSAP Pro', src: '/assets/gsap.svg', tag: 'Animations' },
  { name: 'Three.js', src: '/assets/three-js.svg', tag: '3D WebGL' },
  { name: 'React Native', src: '/assets/react-native.svg', tag: 'Mobile' },
  { name: 'Prisma ORM', src: '/assets/database.svg', tag: 'Database' },
];

export default function TechnologyMarquee() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 border-y relative overflow-hidden"
      style={{backgroundColor:'var(--bg-lift)', borderColor:'rgba(255,255,255,0.07)'}}
    >
      {/* Edge gradient masks */}
      <div className="absolute top-0 left-0 bottom-0 w-28 z-10 pointer-events-none" style={{background:'linear-gradient(to right, var(--bg-lift), transparent)'}} />
      <div className="absolute top-0 right-0 bottom-0 w-28 z-10 pointer-events-none" style={{background:'linear-gradient(to left, var(--bg-lift), transparent)'}} />

      <div className="flex animate-marquee gap-10 whitespace-nowrap px-4 hover:[animation-play-state:paused]">
        {[...TECH_ITEMS, ...TECH_ITEMS, ...TECH_ITEMS].map((tech, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-white/10 bg-[#0B0F19]/80 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-105 hover:-translate-y-1 hover:border-blue-500/50 hover:bg-blue-500/10 hover:shadow-[0_0_25px_rgba(37,99,235,0.35)] cursor-pointer group"
          >
            <img src={tech.src} alt={tech.name} className="h-6 w-auto object-contain filter group-hover:drop-shadow-[0_0_12px_rgba(59,130,246,0.9)] transition-all duration-300 group-hover:scale-110" />
            <span className="text-white text-sm font-bold tracking-tight group-hover:text-blue-300 transition-colors">
              {tech.name}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 group-hover:border-blue-400/50 group-hover:bg-blue-500/20 transition-all">
              {tech.tag}
            </span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
