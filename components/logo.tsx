import Image from 'next/image';

interface LogoProps {
  className?: string;
  imageSize?: number;
}

const Logo = ({
  className = '',
  imageSize = 42,
}: LogoProps) => {
  const src = '/assets/images/logo-white.png';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="flex items-center shrink-0">
        <Image
          src={src}
          alt="UpBit Academy"
          width={imageSize}
          height={imageSize}
          className="object-contain"
          priority
        />
      </div>

      <div className="flex flex-col justify-center">
        <span className="text-xl font-bold tracking-tight text-white font-space-grotesk leading-none">
          UpBit <span className="bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] bg-clip-text text-transparent">Academy</span>
        </span>
      </div>
    </div>
  );
};

export default Logo;
