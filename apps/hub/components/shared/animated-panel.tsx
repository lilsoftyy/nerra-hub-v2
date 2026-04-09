'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AnimatedPanelProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  trigger: React.ReactNode;
  width?: number;
  anchor?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  showClose?: boolean;
}

export function AnimatedPanel({
  open,
  onClose,
  children,
  trigger,
  width = 400,
  anchor = 'bottom-right',
  showClose = true,
}: AnimatedPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
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

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, handleClose]);

  const isVisible = mounted && !closing;

  const transformOrigin =
    anchor === 'bottom-right' ? 'top right' :
    anchor === 'bottom-left' ? 'top left' : 'top center';

  const panelPosition: React.CSSProperties = position ? (
    anchor === 'bottom-right' ? { top: position.top, right: position.right } :
    anchor === 'bottom-left' ? { top: position.top, left: position.left } :
    { top: position.top, left: position.left }
  ) : {};

  return (
    <>
      <div ref={triggerRef} className="inline-block">
        {trigger}
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
            style={{
              opacity: isVisible ? 1 : 0,
              transition: 'opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          />
          <div
            ref={panelRef}
            className="fixed z-50 rounded-2xl bg-popover p-5 text-sm ring-1 ring-foreground/10"
            style={{
              width,
              ...panelPosition,
              transformOrigin,
              transform: isVisible ? 'scale(1)' : 'scale(0.95)',
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
        </>,
        document.body
      )}
    </>
  );
}
