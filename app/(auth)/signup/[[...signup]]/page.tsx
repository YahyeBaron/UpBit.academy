import { SignUp, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import Logo from '@/components/logo';

export default function SignupPage() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-36 pb-20">
      {/* Background */}
      <div className="absolute inset-0 bg-[#000000]" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(178, 63, 224, 0.18), transparent 60%)',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#b23fe0]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#4d65ff]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col items-center">
        {/* Logo Badge */}
        <div className="flex justify-center mb-6">
          <Logo imageSize={44} />
        </div>

        {/* Loading fallback while Clerk bundle initializes */}
        <ClerkLoading>
          <div className="w-full h-[480px] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-pulse flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-[#4d65ff] border-t-transparent animate-spin" />
            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Securing session...</p>
          </div>
        </ClerkLoading>

        {/* Clerk SignUp Component with path routing */}
        <ClerkLoaded>
          <SignUp
            path="/signup"
            routing="path"
            signInUrl="/login"
            appearance={{
              elements: {
                card: 'bg-[#0e1120]/90 border border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl text-white',
                headerTitle: 'text-white font-extrabold text-2xl font-space-grotesk',
                headerSubtitle: 'text-gray-400 text-sm',
                socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
                socialButtonsBlockButtonText: 'text-white font-medium',
                dividerLine: 'bg-white/10',
                dividerText: 'text-gray-500 text-xs',
                formFieldLabel: 'text-gray-300 text-xs font-semibold uppercase tracking-wider',
                formFieldInput: 'bg-white/5 border border-white/10 text-white focus:border-[#4d65ff] focus:bg-white/8 rounded-xl',
                formButtonPrimary: 'bg-gradient-to-r from-[#4d65ff] to-[#b23fe0] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-[#4d65ff]/25',
                footerActionLink: 'text-[#4d65ff] hover:text-[#b23fe0] font-semibold',
                identityPreviewText: 'text-white',
                formHeaderTitle: 'text-white font-space-grotesk',
              },
            }}
          />
        </ClerkLoaded>
      </div>
    </section>
  );
}
