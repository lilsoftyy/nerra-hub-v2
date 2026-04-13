'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ClickableRow } from '@/components/shared/clickable-row';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { documentKindLabels } from '@/lib/labels';
import { formatShortDate } from '@/lib/formatters';
import { sortableHeadClassName } from '@/lib/ui-utils';
import { SortIcon } from '@/components/shared/sort-icon';

interface Document {
  id: string;
  title: string;
  kind: string;
  created_at: string;
  company_name: string | null;
}

type SortKey = 'title' | 'kind' | 'company_name' | 'created_at';
type SortDir = 'asc' | 'desc';

export function DocumentsList({ documents }: { documents: Document[] }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  const filtered = useMemo(() => {
    let list = documents;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        d.title.toLowerCase().includes(q) ||
        (d.company_name ?? '').toLowerCase().includes(q) ||
        (documentKindLabels[d.kind] ?? d.kind).toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':
          cmp = a.title.localeCompare(b.title, 'nb');
          break;
        case 'kind':
          cmp = (documentKindLabels[a.kind] ?? a.kind).localeCompare(documentKindLabels[b.kind] ?? b.kind, 'nb');
          break;
        case 'company_name':
          cmp = (a.company_name ?? '').localeCompare(b.company_name ?? '', 'nb');
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [documents, search, sortKey, sortDir]);

  const headClass = sortableHeadClassName;

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Søk..."
        className="max-w-sm"
      />

      <div className="rounded-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={headClass} onClick={() => handleSort('title')}>
                Tittel<SortIcon active={sortKey === "title"} direction={sortDir} />
              </TableHead>
              <TableHead className={headClass} onClick={() => handleSort('kind')}>
                Type<SortIcon active={sortKey === "kind"} direction={sortDir} />
              </TableHead>
              <TableHead className={headClass} onClick={() => handleSort('company_name')}>
                Firma<SortIcon active={sortKey === "company_name"} direction={sortDir} />
              </TableHead>
              <TableHead className={headClass} onClick={() => handleSort('created_at')}>
                Opprettet<SortIcon active={sortKey === "created_at"} direction={sortDir} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((doc) => (
                <ClickableRow
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="transition-[background-color] duration-150 hover:bg-primary/[0.04]"
                >
                  <TableCell>
                    <Link href={`/documents/${doc.id}`} className="text-sm font-medium hover:underline">
                      {doc.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {documentKindLabels[doc.kind] ?? doc.kind}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {doc.company_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular-nums">
                    {formatShortDate(doc.created_at)}
                  </TableCell>
                </ClickableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  Ingen dokumenter funnet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
