'use client';

import { useRouter } from 'next/navigation';

export function ClickableRow({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();

  return (
    <tr
      className={`cursor-pointer ${className ?? ''}`}
      onClick={(e) => {
        // Ikke navigere hvis bruker klikket på en lenke, knapp eller input
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('[role="checkbox"]')) return;
        router.push(href);
      }}
    >
      {children}
    </tr>
  );
}
