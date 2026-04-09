/** Ordered list of all customer phases */
export const PHASES = [
  'lead',
  'qualification',
  'sales',
  'onboarding',
  'training',
  'operational',
  'finished',
] as const;

export type Phase = (typeof PHASES)[number];

/** Team members — the only users of Nerra Hub */
export const TEAM_MEMBERS: Record<string, string> = {
  'magnus@nerra.no': 'Magnus',
  'martin@nerra.no': 'Martin',
};

/** Allowed email domain for Hub access */
export const ALLOWED_DOMAIN = 'nerra.no';

/** Dot colors for pipeline visualization */
export const phaseDotColors: Record<string, string> = {
  lead: 'bg-neutral-400',
  qualification: 'bg-blue-500',
  sales: 'bg-amber-500',
  onboarding: 'bg-violet-500',
  training: 'bg-orange-500',
  operational: 'bg-emerald-500',
  finished: 'bg-neutral-300',
};
