export const phaseLabels: Record<string, string> = {
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
  other: 'Annet',
};

export const documentKindLabels: Record<string, string> = {
  research: 'Research',
  customer_report: 'Kunderapport',
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
