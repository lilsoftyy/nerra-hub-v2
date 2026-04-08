import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Nerra Hub</h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/customers" className="text-muted-foreground hover:text-foreground transition-colors">
                Kunder
              </Link>
              <Link href="/tasks" className="text-muted-foreground hover:text-foreground transition-colors">
                Oppgaver
              </Link>
            </nav>
          </div>
          <span className="text-sm text-muted-foreground">{user.email}</span>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
