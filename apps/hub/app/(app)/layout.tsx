import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { Sidebar } from '@/components/shared/sidebar';

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
    <div className="flex h-screen overflow-hidden bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
      >
        Hopp til hovedinnhold
      </a>
      <Sidebar userEmail={userEmail} showLogout={!isDev} />
      <main id="main-content" className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 md:px-10 md:py-8">
          <div className="h-14 shrink-0 md:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
