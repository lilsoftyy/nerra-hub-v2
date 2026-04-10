'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { useToast } from '@/components/shared/toast-provider';
import { addLeadFromReport } from '@/app/(app)/documents/[documentId]/actions';
import { UserPlus, Mail, Check, ExternalLink } from 'lucide-react';
import { buildMailtoUrl } from '@/lib/ui-utils';

interface ParsedContact {
  name: string;
  role?: string;
  email?: string;
  linkedin?: string;
}

interface ParsedCompany {
  name: string;
  country?: string;
  city?: string;
  website?: string;
  employeeCount?: number;
  services?: string;
  relevance?: string;
  contacts: ParsedContact[];
  markdownSection: string;
}

function parseLeadResearchMarkdown(content: string): { intro: string; companies: ParsedCompany[] } {
  const sections = content.split(/^## /m);
  const intro = sections[0]?.trim() ?? '';
  const companies: ParsedCompany[] = [];

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i]!;
    const lines = section.split('\n');
    const name = lines[0]?.trim();
    if (!name || name.toLowerCase().startsWith('kontaktperson')) continue;

    const company: ParsedCompany = {
      name,
      contacts: [],
      markdownSection: `## ${section}`,
    };

    // Parse metadata lines
    const countryMatch = section.match(/\*\*Land:\*\*\s*(.+)/);
    const cityMatch = section.match(/\*\*By:\*\*\s*(.+)/);
    const websiteMatch = section.match(/\*\*Nettside:\*\*\s*(.+)/);
    const employeesMatch = section.match(/\*\*Ansatte:\*\*\s*(\d+)/);
    const servicesMatch = section.match(/\*\*Tjenester:\*\*\s*(.+)/);
    const relevanceMatch = section.match(/\*\*Relevans:\*\*\s*(.+)/);

    if (countryMatch?.[1]) company.country = countryMatch[1].trim();
    if (cityMatch?.[1]) company.city = cityMatch[1].trim();
    if (websiteMatch?.[1]) company.website = websiteMatch[1].trim();
    if (employeesMatch?.[1]) company.employeeCount = parseInt(employeesMatch[1], 10);
    if (servicesMatch?.[1]) company.services = servicesMatch[1].trim();
    if (relevanceMatch?.[1]) company.relevance = relevanceMatch[1].trim();

    // Parse contacts — look for lines like: **Name** — role | email | [LinkedIn](url)
    const contactPattern = /[-•]\s*\*\*(.+?)\*\*\s*[—–-]\s*(.+)/g;
    let match;
    while ((match = contactPattern.exec(section)) !== null) {
      const contactName = match[1]?.trim();
      const rest = match[2];
      if (!contactName || !rest) continue;

      const contact: ParsedContact = { name: contactName };

      // Parse role, email, linkedin from the rest
      const parts = rest.split('|').map((p) => p.trim());
      for (const part of parts) {
        if (part.includes('@')) {
          contact.email = part;
        } else if (part.includes('[LinkedIn]') || part.includes('linkedin.com')) {
          const urlMatch = part.match(/\((.+?)\)/);
          contact.linkedin = urlMatch?.[1] ?? part;
        } else if (!contact.role) {
          contact.role = part;
        }
      }

      company.contacts.push(contact);
    }

    companies.push(company);
  }

  return { intro, companies };
}

function CompanyCard({
  company,
  onAdd,
  added,
}: {
  company: ParsedCompany;
  onAdd: (company: ParsedCompany) => void;
  added: boolean;
}) {
  const primaryEmail = company.contacts.find((c) => c.email)?.email;

  return (
    <div className="rounded-xl border border-foreground/[0.08] p-5 space-y-4">
      <MarkdownContent content={company.markdownSection} />

      <div className="flex items-center gap-2 pt-2 border-t border-foreground/[0.06]">
        <Button
          size="sm"
          variant={added ? 'secondary' : 'default'}
          disabled={added}
          onClick={() => onAdd(company)}
          className="gap-1.5"
        >
          {added ? (
            <><Check className="size-3.5" strokeWidth={1.75} />Lagt til</>
          ) : (
            <><UserPlus className="size-3.5" strokeWidth={1.75} />Legg til</>
          )}
        </Button>

        {primaryEmail && (
          <a
            href={buildMailtoUrl(primaryEmail, '', '')}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Mail className="size-3.5" strokeWidth={1.75} />
            Kontakt
          </a>
        )}

        {company.website && (
          <a
            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
            Nettside
          </a>
        )}
      </div>
    </div>
  );
}

export function LeadResearchViewer({ content }: { content: string }) {
  const router = useRouter();
  const { addToast, updateToast } = useToast();
  const [addedCompanies, setAddedCompanies] = useState<Set<string>>(new Set());

  const { intro, companies } = parseLeadResearchMarkdown(content);

  const handleAdd = async (company: ParsedCompany) => {
    const toastId = addToast({
      type: 'loading',
      title: `Legger til ${company.name}...`,
    });

    const result = await addLeadFromReport({
      name: company.name,
      country: company.country ?? 'NO',
      city: company.city,
      website: company.website,
      employeeCount: company.employeeCount,
      services: company.services,
      relevance: company.relevance,
      contacts: company.contacts,
    });

    if (result.error) {
      updateToast(toastId, { type: 'error', title: 'Feil', description: result.error });
    } else {
      setAddedCompanies((prev) => new Set(prev).add(company.name));
      updateToast(toastId, {
        type: 'success',
        title: `${company.name} lagt til`,
        description: `${company.contacts.length} kontakt${company.contacts.length !== 1 ? 'er' : ''}`,
        action: result.companyId ? {
          label: 'Se profil',
          onClick: () => router.push(`/customers/${result.companyId}`),
        } : undefined,
      });
      router.refresh();
    }
  };

  // If parsing didn't find structured companies, fall back to plain markdown
  if (companies.length === 0) {
    return <MarkdownContent content={content} />;
  }

  return (
    <div className="space-y-6">
      {intro && <MarkdownContent content={intro} />}

      <div className="space-y-4">
        {companies.map((company) => (
          <CompanyCard
            key={company.name}
            company={company}
            onAdd={handleAdd}
            added={addedCompanies.has(company.name)}
          />
        ))}
      </div>
    </div>
  );
}
