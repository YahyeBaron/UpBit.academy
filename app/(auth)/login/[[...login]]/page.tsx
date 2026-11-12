import { SignIn, ClerkLoaded, ClerkLoading } from '@clerk/nextjs';
import Logo from '@/components/logo';

export default function LoginPage() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020817] via-[#030d20] to-[#020817]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_10%,rgba(29,78,216,0.15),transparent_60%)]" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 flex flex-col items-center">
        {/* Logo Badge */}
        <div className="flex justify-center mb-6">
          <Logo imageSize={44} />
        </div>

        {/* Loading fallback while Clerk bundle initializes */}
        <ClerkLoading>
          <div className="w-full h-[480px] rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl animate-pulse flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-xs text-gray-400 font-medium tracking-wide uppercase">Securing session...</p>
          </div>
        </ClerkLoading>

        {/* Clerk SignIn Component with path routing */}
        <ClerkLoaded>
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
          appearance={{
            elements: {
              card: 'bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl rounded-2xl text-white',
              headerTitle: 'text-white font-extrabold text-2xl',
              headerSubtitle: 'text-gray-400 text-sm',
              socialButtonsBlockButton: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
              socialButtonsBlockButtonText: 'text-white font-medium',
              dividerLine: 'bg-white/10',
              dividerText: 'text-gray-500 text-xs',
              formFieldLabel: 'text-gray-300 text-xs font-semibold uppercase tracking-wider',
              formFieldInput: 'bg-white/5 border border-white/10 text-white focus:border-blue-500/60 focus:bg-white/8 rounded-xl',
              formButtonPrimary: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25',
              footerActionLink: 'text-blue-400 hover:text-blue-300 font-semibold',
              identityPreviewText: 'text-white',
              formHeaderTitle: 'text-white',
            },
          }}
        />
        </ClerkLoaded>
      </div>
    </section>
  );
}
