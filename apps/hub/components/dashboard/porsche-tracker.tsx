'use client';

/**
 * Porsche 911 Turbo S progress tracker.
 *
 * Strategi: Spare 1 000 000 kr i egenkapital, låne resten (2 800 000 kr).
 * Sparing: ca. 50 000 - 100 000 kr/år (to personer).
 * Progress bar viser sparing mot egenkapital-målet.
 */

const EQUITY_TARGET = 1_000_000;
const PORSCHE_PRICE = 3_800_000;

interface PorscheTrackerProps {
  /** Beløp spart/tjent mot Porsche-målet i NOK */
  savedAmount: number;
}

function formatNok(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k`;
  }
  return `${amount}`;
}

export function PorscheTracker({ savedAmount }: PorscheTrackerProps) {
  const progress = (savedAmount / EQUITY_TARGET) * 100;
  const remaining = EQUITY_TARGET - savedAmount;

  // Sparing: 50-100k/år totalt (to personer). Bruker 75k som snitt.
  const yearlySavingsEstimate = 75_000;
  const yearsLeft = remaining > 0 ? Math.ceil(remaining / yearlySavingsEstimate) : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/20 px-4 py-2.5">
      {/* Info + progress */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tabular-nums">
          {progress < 0.01 ? progress.toFixed(3) : progress < 1 ? progress.toFixed(2) : progress.toFixed(1)}%
        </p>

        {/* Progress bar */}
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/[0.04]">
          <div
            className="h-full rounded-full bg-foreground/[0.15] transition-[width] duration-500"
            style={{ width: `${Math.max(0.3, progress)}%` }}
          />
        </div>

        <p className="mt-0.5 text-[10px] text-muted-foreground/40">
          {formatNok(savedAmount)} / {formatNok(EQUITY_TARGET)} egenkapital
          {yearsLeft > 0 && ` — ~${yearsLeft} år`}
          {' '}({formatNok(PORSCHE_PRICE)} totalt)
        </p>
      </div>

      {/* Porsche-bilde — vendt 180° så nesa peker bort fra progress */}
      <img
        src="/porsche.png"
        alt="Porsche 911 GT2 RS — Nerra"
        className="h-16 w-auto opacity-60"
        style={{ filter: 'grayscale(0.2)' }}
      />
    </div>
  );
}
