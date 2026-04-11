import { LoginButton } from '@/components/shared/login-button';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050510]">
      {/* Dynamisk bakgrunn — abstrakt lysform */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="absolute h-[500px] w-[500px] animate-[drift_12s_ease-in-out_infinite] rounded-full opacity-60"
          style={{
            background: 'radial-gradient(ellipse at 40% 50%, rgba(80, 120, 255, 0.4) 0%, rgba(120, 80, 220, 0.3) 30%, rgba(60, 100, 240, 0.15) 60%, transparent 80%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute h-[400px] w-[450px] animate-[drift2_15s_ease-in-out_infinite] rounded-full opacity-50"
          style={{
            background: 'radial-gradient(ellipse at 60% 40%, rgba(100, 140, 255, 0.35) 0%, rgba(80, 60, 200, 0.2) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute h-[300px] w-[350px] animate-[drift3_18s_ease-in-out_infinite] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 50% 60%, rgba(140, 160, 255, 0.3) 0%, rgba(100, 80, 200, 0.15) 50%, transparent 75%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Innhold */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Logo */}
        <img
          src="/logo.svg"
          alt="Nerra"
          className="h-8 opacity-70 brightness-200"
        />

        {/* Tittel */}
        <div className="space-y-3">
          <h1 className="text-5xl font-semibold tracking-tight text-white/90">
            Nerra Hub
          </h1>
          <p className="text-sm text-white/40">
            Internt kommandosenter for Nerra AS
          </p>
        </div>

        {/* Glass login-knapp */}
        <LoginButton />
      </div>
    </div>
  );
}
