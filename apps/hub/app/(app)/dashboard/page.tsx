import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <Card>
        <CardHeader>
          <CardTitle>Velkommen</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Innlogget som {user?.user_metadata?.full_name ?? user?.email}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hub er under utvikling. Kundemodul, oppgaver og godkjenningsko kommer i neste fase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
