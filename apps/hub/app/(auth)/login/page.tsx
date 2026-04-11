import { LoginButton } from '@/components/shared/login-button';
import { UnicornBackground } from '@/components/shared/unicorn-background';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050510]">
      <UnicornBackground />

      {/* Innhold */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        <img
          src="/logo.svg"
          alt="Nerra"
          className="h-12 opacity-80 brightness-200"
        />

        <p className="text-sm text-white/30">
          Internt kommandosenter for Nerra AS
        </p>

        <LoginButton />
      </div>
    </div>
  );
}
