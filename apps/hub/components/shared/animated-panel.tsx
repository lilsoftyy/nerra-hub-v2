'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface AnimatedPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Width of the panel. Default: 400px */
  width?: number;
  /** Where the panel appears relative to the trigger. Default: 'bottom-right' */
  anchor?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Show close button. Default: true */
  showClose?: boolean;
  /** Show backdrop. Default: true */
  showBackdrop?: boolean;
}

const anchorStyles = {
  'bottom-right': { right: 0, transformOrigin: 'top right' },
  'bottom-left': { left: 0, transformOrigin: 'top left' },
  'bottom-center': { left: '50%', transform: 'translateX(-50%)', transformOrigin: 'top center' },
} as const;

export function AnimatedPanel({
  open,
  onClose,
  children,
  width = 400,
  anchor = 'bottom-right',
  showClose = true,
  showBackdrop = true,
}: AnimatedPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setMounted(true));
    } else {
      setMounted(false);
      setClosing(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setMounted(false);
      setClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Check if click is on the trigger (parent's button) — let parent handle that
        const trigger = panelRef.current.parentElement?.querySelector('button');
        if (trigger && trigger.contains(e.target as Node)) return;
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, handleClose]);

  if (!open) return null;

  const isVisible = mounted && !closing;
  const anchorStyle = anchorStyles[anchor];

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px]"
          style={{
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className="absolute top-full z-50 mt-2 rounded-2xl bg-popover p-5 text-sm ring-1 ring-foreground/10"
        style={{
          width,
          ...anchorStyle,
          transform: `${anchor === 'bottom-center' ? 'translateX(-50%) ' : ''}${isVisible ? 'scale(1)' : 'scale(0.95)'}`,
          opacity: isVisible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1), opacity 150ms cubic-bezier(0.23, 1, 0.32, 1)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        }}
      >
        {showClose && (
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-muted-foreground/50 transition-[color] duration-150 hover:text-foreground"
            aria-label="Lukk"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
        {children}
      </div>
    </>
  );
}
