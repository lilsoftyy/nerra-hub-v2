import { ChevronUp, ChevronDown } from 'lucide-react';

export function SortIcon({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) {
  if (!active) return null;
  return direction === 'asc'
    ? <ChevronUp className="inline size-3 ml-0.5" strokeWidth={2} />
    : <ChevronDown className="inline size-3 ml-0.5" strokeWidth={2} />;
}
