'use client';

import { useRouter } from 'next/navigation';
import { TableRow } from '@/components/ui/table';

export function ClickableRow({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();

  return (
    <TableRow
      className={`cursor-pointer ${className ?? ''}`}
      onClick={(e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button') || target.closest('input') || target.closest('[role="checkbox"]')) return;
        router.push(href);
      }}
    >
      {children}
    </TableRow>
  );
}
