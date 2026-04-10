'use client';

/**
 * Porsche 911 Turbo S progress tracker.
 *
 * Mål: 3 800 000 NOK
 * Viser en SVG-silhuett av en 911 i sideprofil med en progress bar under.
 */

const PORSCHE_PRICE = 3_800_000;

interface PorscheTrackerProps {
  /** Beløp spart/tjent mot Porsche-målet i NOK */
  savedAmount: number;
}

function Porsche911Svg({ progress }: { progress: number }) {
  // Fyllgrad basert på progress (venstre til høyre)
  const fillWidth = Math.max(0, Math.min(100, progress));

  return (
    <svg
      viewBox="0 0 800 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full"
      style={{ maxWidth: '420px' }}
      aria-label="Porsche 911 Turbo S"
    >
      <defs>
        <clipPath id="carClip">
          <path d={carPath} />
        </clipPath>
      </defs>

      {/* Fylt del basert på progress */}
      <rect
        x="0"
        y="0"
        width={`${fillWidth}%`}
        height="260"
        fill="currentColor"
        className="text-primary/[0.07]"
        clipPath="url(#carClip)"
      />

      {/* Omriss */}
      <path
        d={carPath}
        stroke="currentColor"
        className="text-foreground/[0.12]"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Hjul */}
      <circle cx="195" cy="210" r="42" stroke="currentColor" className="text-foreground/[0.12]" strokeWidth="2" fill="none" />
      <circle cx="195" cy="210" r="28" stroke="currentColor" className="text-foreground/[0.08]" strokeWidth="1.5" fill="none" />
      <circle cx="195" cy="210" r="8" fill="currentColor" className="text-foreground/[0.08]" />

      <circle cx="615" cy="210" r="42" stroke="currentColor" className="text-foreground/[0.12]" strokeWidth="2" fill="none" />
      <circle cx="615" cy="210" r="28" stroke="currentColor" className="text-foreground/[0.08]" strokeWidth="1.5" fill="none" />
      <circle cx="615" cy="210" r="8" fill="currentColor" className="text-foreground/[0.08]" />
    </svg>
  );
}

// Porsche 911 side profile path — forenklet silhuett
const carPath = [
  'M 100,210',
  'C 100,200 110,185 130,180',
  'L 155,175',
  'C 160,170 170,168 195,168',
  'C 220,168 230,170 235,175',
  'L 280,178',
  'L 310,175',
  'L 350,160',
  'L 390,135',
  'L 430,108',
  'L 470,88',
  'L 520,78',
  'L 560,76',
  'L 600,78',
  'L 640,85',
  'L 680,95',
  'L 710,108',
  'L 730,120',
  'L 740,135',
  'L 745,150',
  'L 748,165',
  'L 748,178',
  'L 740,185',
  'L 660,188',
  'C 655,175 640,168 615,168',
  'C 590,168 575,175 570,188',
  'L 240,188',
  'C 235,175 220,168 195,168',
  'C 170,168 155,175 150,188',
  'L 115,190',
  'C 105,195 100,200 100,210',
  'Z',
].join(' ');

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
  const progress = (savedAmount / PORSCHE_PRICE) * 100;
  const remaining = PORSCHE_PRICE - savedAmount;

  // Estimat: med 600k lønn, ~25% skatt, ~300k levekostnader = ~150k sparing/år per person
  // To personer = 300k/år i starten, voksende med lønnsøkning
  const yearlySavingsEstimate = 300_000;
  const yearsLeft = remaining > 0 ? Math.ceil(remaining / yearlySavingsEstimate) : 0;

  return (
    <div className="rounded-2xl bg-muted/20 px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            Porsche 911 Turbo S
          </p>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">
            {formatNok(savedAmount)} av {formatNok(PORSCHE_PRICE)} kr
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {progress < 0.01 ? progress.toFixed(3) : progress < 1 ? progress.toFixed(2) : progress.toFixed(1)}%
          </p>
          {yearsLeft > 0 && (
            <p className="text-[11px] text-muted-foreground/40">
              ~{yearsLeft} {yearsLeft === 1 ? 'år' : 'år'} igjen
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Porsche911Svg progress={progress} />
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-foreground/[0.04]">
        <div
          className="h-full rounded-full bg-foreground/[0.15] transition-[width] duration-500"
          style={{ width: `${Math.max(0.3, progress)}%` }}
        />
      </div>
    </div>
  );
}
