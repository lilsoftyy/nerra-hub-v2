export const phaseLabels: Record<string, string> = {
  contact: 'Kontakt',
  lead: 'Lead',
  qualification: 'Kvalifisering',
  sales: 'Salg',
  onboarding: 'Onboarding',
  training: 'Opplæring',
  operational: 'Operativ',
  finished: 'Ferdig',
};

export const phaseColors: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-800',
  qualification: 'bg-blue-100 text-blue-800',
  sales: 'bg-yellow-100 text-yellow-800',
  onboarding: 'bg-purple-100 text-purple-800',
  training: 'bg-orange-100 text-orange-800',
  operational: 'bg-green-100 text-green-800',
  finished: 'bg-slate-100 text-slate-800',
};

export const taskStatusLabels: Record<string, string> = {
  open: 'Åpen',
  in_progress: 'Under arbeid',
  done: 'Fullført',
  cancelled: 'Kansellert',
};

export const taskStatusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  done: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export const taskPriorityLabels: Record<string, string> = {
  low: 'Lav',
  medium: 'Medium',
  high: 'Høy',
  critical: 'Kritisk',
};

export const taskPriorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const taskCategoryLabels: Record<string, string> = {
  sales: 'Salg',
  training: 'Opplæring',
  admin: 'Administrasjon',
  development: 'Utvikling',
  research: 'Research',
  personal: 'Personlig',
  other: 'Annet',
};

export const taskCategoryColors: Record<string, string> = {
  sales: 'bg-emerald-100 text-emerald-700',
  training: 'bg-amber-100 text-amber-700',
  admin: 'bg-slate-100 text-slate-600',
  development: 'bg-violet-100 text-violet-700',
  research: 'bg-sky-100 text-sky-700',
  personal: 'bg-rose-100 text-rose-700',
  other: 'bg-stone-100 text-stone-600',
};

export const taskCategoryBarColors: Record<string, string> = {
  sales: 'bg-emerald-300/60',
  training: 'bg-amber-300/60',
  admin: 'bg-slate-300/50',
  development: 'bg-violet-300/60',
  research: 'bg-sky-300/60',
  personal: 'bg-rose-300/60',
  other: 'bg-stone-300/50',
};

export const documentKindLabels: Record<string, string> = {
  research: 'Firmasøk',
  customer_report: 'Kunderesearch',
  lead_research: 'Lead Research',
  welcome_package: 'Velkomstpakke',
  contract: 'Kontrakt',
  briefing: 'Briefing',
  other: 'Annet',
};

export const documentVisibilityLabels: Record<string, string> = {
  internal: 'Intern',
  customer_shareable: 'Kundesynlig',
};

export const contractStatusLabels: Record<string, string> = {
  draft: 'Utkast',
  sent: 'Sendt',
  viewed: 'Sett',
  signed: 'Signert',
  declined: 'Avslått',
  expired: 'Utløpt',
};

export const contractStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-yellow-100 text-yellow-800',
  signed: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};
