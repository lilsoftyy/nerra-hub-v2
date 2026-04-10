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

      {/* Forhjul */}
      <circle cx="195" cy="215" r="38" stroke="currentColor" className="text-foreground/[0.12]" strokeWidth="2" fill="none" />
      <circle cx="195" cy="215" r="25" stroke="currentColor" className="text-foreground/[0.08]" strokeWidth="1.5" fill="none" />
      <circle cx="195" cy="215" r="7" fill="currentColor" className="text-foreground/[0.08]" />

      {/* Bakhjul (litt større, typisk 911) */}
      <circle cx="648" cy="215" r="40" stroke="currentColor" className="text-foreground/[0.12]" strokeWidth="2" fill="none" />
      <circle cx="648" cy="215" r="26" stroke="currentColor" className="text-foreground/[0.08]" strokeWidth="1.5" fill="none" />
      <circle cx="648" cy="215" r="7" fill="currentColor" className="text-foreground/[0.08]" />
    </svg>
  );
}

// Porsche 992 911 Turbo S side profile — moderne silhuett
// Lav nese, bred bakende, markant spoiler-linje, agressiv profil
const carPath = [
  // Forhjul bunn → nese
  'M 148,195',
  'C 140,192 120,188 108,182',
  'C 96,176 82,170 74,164',
  'L 60,156',
  'C 54,152 50,148 50,144',
  // Nese → panser
  'L 52,140',
  'C 54,136 62,132 76,128',
  'L 120,118',
  // Panser → vindskjerm (lang, lav linje)
  'L 200,104',
  'L 260,92',
  'C 290,86 310,82 330,80',
  // Vindskjerm → tak (bratt vinkel, typisk 911)
  'C 350,78 365,76 380,76',
  'L 420,76',
  // Tak → bakrute (kort, avrundet)
  'C 450,76 470,78 490,84',
  'L 520,94',
  // Bakrute → bakende (bred, kraftig)
  'C 540,102 560,112 575,120',
  'L 600,130',
  // Bakende → spoiler
  'C 620,138 640,146 660,150',
  'L 700,156',
  'C 720,158 735,160 742,162',
  // Spoiler-kant
  'L 748,160',
  'L 750,164',
  // Bakende nedover
  'L 748,170',
  'C 746,176 740,182 732,186',
  'L 710,192',
  // Bakhjul overkant
  'C 698,195 676,196 662,196',
  'C 648,196 636,194 626,190',
  // Mellom hjulene (underside)
  'L 240,190',
  // Forhjul overkant
  'C 230,194 218,196 204,196',
  'C 190,196 178,195 166,192',
  'L 148,195',
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
  const progress = (savedAmount / EQUITY_TARGET) * 100;
  const remaining = EQUITY_TARGET - savedAmount;

  // Sparing: 50-100k/år totalt (to personer). Bruker 75k som snitt.
  const yearlySavingsEstimate = 75_000;
  const yearsLeft = remaining > 0 ? Math.ceil(remaining / yearlySavingsEstimate) : 0;

  return (
    <div className="rounded-2xl bg-muted/20 px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            Porsche 911 Turbo S
          </p>
          <p className="text-[11px] text-muted-foreground/40 mt-0.5">
            {formatNok(savedAmount)} av {formatNok(EQUITY_TARGET)} egenkapital ({formatNok(PORSCHE_PRICE)} totalt)
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {progress < 0.01 ? progress.toFixed(3) : progress < 1 ? progress.toFixed(2) : progress.toFixed(1)}%
          </p>
          {yearsLeft > 0 && (
            <p className="text-[11px] text-muted-foreground/40">
              ~{yearsLeft} år igjen
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
