'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { TEAM_MEMBERS, TEAM_AVATARS } from '@/lib/constants';
import {
  LayoutDashboard,
  Inbox,
  Users,
  Building2,
  CheckSquare,
  FileText,
  FileSignature,
  Calendar,
  Bot,
  LogOut,
} from 'lucide-react';

const navGroups = [
  {
    label: 'Oversikt',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/inbox', label: 'Innboks', icon: Inbox },
    ],
  },
  {
    label: 'CRM',
    items: [
      { href: '/customers', label: 'Personer', icon: Users },
      { href: '/companies', label: 'Firma', icon: Building2 },
      { href: '/tasks', label: 'Oppgaver', icon: CheckSquare },
    ],
  },
  {
    label: 'Dokumenter',
    items: [
      { href: '/documents', label: 'Dokumenter', icon: FileText },
      { href: '/contracts', label: 'Kontrakter', icon: FileSignature },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/calendar', label: 'Kalender', icon: Calendar },
      { href: '/agents', label: 'Agenter', icon: Bot },
    ],
  },
];

interface SidebarProps {
  userEmail: string;
  showLogout: boolean;
}

export function Sidebar({ userEmail, showLogout }: SidebarProps) {
  const pathname = usePathname();
  const userName = TEAM_MEMBERS[userEmail] ?? userEmail.split('@')[0] ?? '';
  const avatarSrc = TEAM_AVATARS[userEmail] ?? null;

  return (
    <aside className="flex h-screen w-44 flex-col bg-background">
      {/* Logo */}
      <div className="flex items-center px-4 pt-6 pb-3">
        <Link href="/dashboard">
          <img src="/logo.svg" alt="Nerra — gå til dashboard" className="h-14" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  // Firmaprofiler (/customers/[id]) matcher "Firma", ikke "Personer"
                  (item.href === '/companies' && pathname.startsWith('/customers/') && pathname !== '/customers') ||
                  (item.href === '/customers' && pathname === '/customers') ||
                  (item.href !== '/dashboard' && item.href !== '/customers' && item.href !== '/companies' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-[color,background-color] duration-200',
                      isActive
                        ? 'bg-primary/[0.08] text-foreground'
                        : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-3">
        <div className="flex flex-col items-start gap-2 px-2">
          {avatarSrc && (
            <img
              src={avatarSrc}
              alt={userName}
              className="h-32 w-auto rounded-xl opacity-70"
              style={{ filter: 'grayscale(0.1)' }}
            />
          )}
          <div className="flex items-center justify-between w-full">
            <span className="truncate text-[12px] text-muted-foreground">
              {userEmail}
            </span>
            {showLogout && (
              <LogoutAction />
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function LogoutAction() {
  // Dynamic import to avoid pulling in supabase client when not needed
  return (
    <button
      onClick={async () => {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/login';
      }}
      className="text-muted-foreground/60 transition-[color] duration-150 hover:text-foreground"
      aria-label="Logg ut"
    >
      <LogOut className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
