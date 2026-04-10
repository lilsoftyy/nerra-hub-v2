import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { taskPriorityLabels, taskCategoryLabels } from '@/lib/labels';
import { selectClassName } from '@/lib/ui-utils';
import { createTask } from '../actions';

async function createTaskAction(formData: FormData): Promise<void> {
  'use server';
  await createTask(formData);
}

export default async function NewTaskPage() {
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .is('deleted_at', null)
    .order('name');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Opprett oppgave</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ny oppgave</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTaskAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tittel *</Label>
              <Input id="title" name="title" required placeholder="Skriv tittel..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Valgfri beskrivelse..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioritet</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="medium"
                  className={selectClassName}
                >
                  {Object.entries(taskPriorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <select
                  id="category"
                  name="category"
                  defaultValue=""
                  className={selectClassName}
                >
                  <option value="">Velg kategori...</option>
                  {Object.entries(taskCategoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_id">Kunde</Label>
                <select
                  id="company_id"
                  name="company_id"
                  defaultValue=""
                  className={selectClassName}
                >
                  <option value="">Ingen kunde</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Forfallsdato</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Opprett oppgave</Button>
              <Button type="button" variant="outline" render={<a href="/tasks" />}>
                Avbryt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
