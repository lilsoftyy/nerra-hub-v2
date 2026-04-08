export const phaseLabels: Record<string, string> = {
  lead: 'Lead',
  qualification: 'Kvalifisering',
  sales: 'Salg',
  onboarding: 'Onboarding',
  training: 'Oppl\u00e6ring',
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
  open: '\u00c5pen',
  in_progress: 'Under arbeid',
  done: 'Fullf\u00f8rt',
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
  high: 'H\u00f8y',
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
  training: 'Oppl\u00e6ring',
  admin: 'Administrasjon',
  development: 'Utvikling',
  research: 'Research',
  other: 'Annet',
};
