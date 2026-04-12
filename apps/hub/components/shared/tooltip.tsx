'use client';

import { useState, useRef } from 'react';

interface TooltipProps {
  label: string;
  children: React.ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), 500);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <div className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-popover px-2.5 py-1 text-[11px] text-muted-foreground shadow-sm ring-1 ring-foreground/[0.06]">
          {label}
        </div>
      )}
    </div>
  );
}
