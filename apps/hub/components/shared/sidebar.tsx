'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Inbox,
  Users,
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
    label: 'Kunder',
    items: [
      { href: '/customers', label: 'Kunder', icon: Users },
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

  return (
    <aside className="flex h-screen w-44 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <span className="text-[15px] font-semibold tracking-tight">
          Nerra Hub
        </span>
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
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-[color,background-color] duration-150',
                      isActive
                        ? 'bg-foreground/[0.06] text-foreground'
                        : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
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
      <div className="border-t px-3 py-3">
        <div className="flex items-center justify-between px-2">
          <span className="truncate text-[12px] text-muted-foreground">
            {userEmail}
          </span>
          {showLogout && (
            <LogoutAction />
          )}
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
