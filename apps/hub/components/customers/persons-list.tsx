'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AnimatedPanel } from '@/components/shared/animated-panel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PersonEditButton } from '@/components/customers/person-edit-button';
import { PersonDetailTrigger } from '@/components/customers/person-detail-panel';
import { ContactRowActions } from '@/components/customers/contact-row-actions';
import { QuickEmailButton } from '@/components/customers/quick-email-button';
import { countryName } from '@/lib/countries';
import { sortableHeadClassName, buildMailtoUrl } from '@/lib/ui-utils';
import { SortIcon } from '@/components/shared/sort-icon';
import { Mail } from 'lucide-react';

interface Person {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  company_id: string | null;
  company_name: string | null;
  company_phase: string | null;
  company_country: string | null;
}

const potentialCustomerPhases: string[] = ['lead', 'qualification', 'sales', 'onboarding', 'training'];

type SortKey = 'full_name' | 'company_name';
type SortDir = 'asc' | 'desc';

export function PersonsList({ persons }: { persons: Person[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('full_name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emailOpen, setEmailOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = persons;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.company_name ?? '').toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const valA = (sortKey === 'full_name' ? a.full_name : a.company_name ?? '') ?? '';
      const valB = (sortKey === 'full_name' ? b.full_name : b.company_name ?? '') ?? '';
      const cmp = valA.localeCompare(valB, 'nb');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [persons, search, sortKey, sortDir]);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const selectedEmails = filtered
    .filter((p) => selected.has(p.id) && p.email)
    .map((p) => p.email!);

  const handleSendEmail = () => {
    window.open(buildMailtoUrl(selectedEmails, subject, body), '_blank');
    setEmailOpen(false);
    setSubject('');
    setBody('');
    setSelected(new Set());
  };

  const headClass = sortableHeadClassName;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Søk..."
          className="max-w-sm"
        />
        {selectedEmails.length > 0 && (
          <AnimatedPanel
            open={emailOpen}
            onClose={() => setEmailOpen(false)}
            width={340}
            anchor="bottom-left"
            trigger={
              <Button size="sm" variant="outline" onClick={() => setEmailOpen(true)}>
                <Mail className="size-4" strokeWidth={1.75} aria-hidden="true" />
                Send til {selectedEmails.length} valgte
              </Button>
            }
          >
            <div className="space-y-3">
              <h3 className="text-base font-semibold">E-post til {selectedEmails.length} personer</h3>
              <p className="text-xs text-muted-foreground">{selectedEmails.join(', ')}</p>
              <div className="space-y-2">
                <Label>Emne</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Melding</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
              </div>
              <Button size="sm" className="w-full" onClick={handleSendEmail} disabled={!subject.trim()}>
                Åpne i e-postklient
              </Button>
            </div>
          </AnimatedPanel>
        )}
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={headClass} onClick={() => handleSort('full_name')}>
                Navn<SortIcon active={sortKey === 'full_name'} direction={sortDir} />
              </TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead className={headClass} onClick={() => handleSort('company_name')}>
                Selskap<SortIcon active={sortKey === 'company_name'} direction={sortDir} />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Land</TableHead>
              <TableHead className="w-16" />
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((p) => {
                const isPotentialCustomer = p.company_phase ? potentialCustomerPhases.includes(p.company_phase) : false;
                return (
                  <TableRow key={p.id} className={selected.has(p.id) ? 'bg-primary/[0.03]' : ''}>
                    <TableCell>
                      <PersonDetailTrigger person={p} />
                    </TableCell>
                    <TableCell>
                      {p.email ? (
                        <a href={`mailto:${p.email}`} className="text-sm text-primary hover:underline">{p.email}</a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.phone ?? '—'}</TableCell>
                    <TableCell>
                      {p.company_id ? (
                        <Link href={`/customers/${p.company_id}`} className="text-sm hover:underline">{p.company_name}</Link>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {isPotentialCustomer ? (
                        <Badge className="bg-primary/10 text-primary text-[10px]">Kunde</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Kontakt</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {countryName(p.company_country)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {p.email && <QuickEmailButton email={p.email} name={p.full_name} />}
                        <PersonEditButton contactId={p.id} fullName={p.full_name} email={p.email} phone={p.phone} role={p.role} />
                        <ContactRowActions contactId={p.id} contactName={p.full_name} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(p.id)}
                        onCheckedChange={() => toggleSelect(p.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  Ingen personer funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}
