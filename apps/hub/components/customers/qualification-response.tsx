import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface QualificationResponseProps {
  response: {
    responses: Record<string, string>;
    submitted_at: string;
    submitter_email: string;
  };
}

const fields = [
  { label: 'Bygningstyper', key: 'building_types' },
  { label: 'Nåværende metoder', key: 'current_methods' },
  { label: 'Droneerfaring', key: 'drone_experience' },
  { label: 'Ønsket oppstart', key: 'desired_start_date' },
  { label: 'Antall drone-team', key: 'drone_teams' },
  { label: 'Annet', key: 'additional_info' },
];

export function QualificationResponse({ response }: QualificationResponseProps) {
  const data = response.responses;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kvalifiseringsskjema</CardTitle>
          <Badge variant="secondary">
            Innsendt {new Date(response.submitted_at).toLocaleDateString('nb-NO')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3 text-sm">
          {fields.map(({ label, key }) => {
            const value = data[key];
            if (!value) return null;
            return (
              <div key={key}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{value}</dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
