import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChecklistItem {
  id: string;
  item_key: string;
  label: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

interface PhaseChecklistProps {
  items: ChecklistItem[];
  companyId: string;
}

export function PhaseChecklist({ items, companyId: _companyId }: PhaseChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sjekkliste</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="rounded"
                />
                <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Ingen sjekkpunkter for denne fasen.</p>
        )}
      </CardContent>
    </Card>
  );
}
