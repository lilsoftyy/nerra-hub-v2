import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { LogoutButton } from '@/components/shared/logout-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const host = headersList.get('host') ?? '';
  const isDev = host.startsWith('localhost') || host.startsWith('127.0.0.1');

  let userEmail = 'dev@localhost';

  if (!isDev) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }
    userEmail = user.email ?? '';
  }

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-semibold">Nerra Hub</h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                Dashboard
              </Link>
              <Link href="/inbox" className="text-muted-foreground hover:text-foreground transition-colors">
                Innboks
              </Link>
              <Link href="/customers" className="text-muted-foreground hover:text-foreground transition-colors">
                Kunder
              </Link>
              <Link href="/tasks" className="text-muted-foreground hover:text-foreground transition-colors">
                Oppgaver
              </Link>
              <Link href="/documents" className="text-muted-foreground hover:text-foreground transition-colors">
                Dokumenter
              </Link>
              <Link href="/contracts" className="text-muted-foreground hover:text-foreground transition-colors">
                Kontrakter
              </Link>
              <Link href="/calendar" className="text-muted-foreground hover:text-foreground transition-colors">
                Kalender
              </Link>
              <Link href="/agents" className="text-muted-foreground hover:text-foreground transition-colors">
                Agenter
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{userEmail}</span>
            {!isDev && <LogoutButton />}
          </div>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
