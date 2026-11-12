import Image from 'next/image';

interface LogoProps {
  className?: string;
  imageSize?: number;
}

const Logo = ({
  className = '',
  imageSize = 68,
}: LogoProps) => {
  const src = '/assets/logo-eraysame-transparent.png';

  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      {/* Icon — larger for gradient detail to read clearly */}
      <div className="flex items-center shrink-0">
        <Image
          src={src}
          alt="EraySame Logo Mark"
          width={imageSize}
          height={imageSize}
          className="object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
          priority
        />
      </div>

      {/* Divider — more opaque + slightly wider, breathing room on both sides */}
      <div className="h-10 w-[1.5px] bg-white/40 mx-2 shrink-0" />

      {/* Wordmark */}
      <div className="flex flex-col justify-center">
        <span className="text-2xl font-bold tracking-tight text-white font-sans leading-none">
          EraySame
        </span>
        <span className="text-[11px] font-semibold tracking-[0.2em] text-blue-400 uppercase font-sans mt-1">
          Tech Academy
        </span>
      </div>
    </div>
  );
};

export default Logo;
