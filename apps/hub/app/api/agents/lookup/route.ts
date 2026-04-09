import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email?.endsWith('@nerra.no')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, company } = await request.json() as { name: string; company: string };

  if (!name || !company) {
    return NextResponse.json({ error: 'Navn og selskap er påkrevd' }, { status: 400 });
  }

  try {
    const anthropic = getAnthropicClient();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 5,
        },
      ],
      messages: [{
        role: 'user',
        content: `Finn informasjon om denne personen og selskapet:

Personnavn: ${name}
Selskap: ${company}

Søkestrategi:
1. Søk etter personens LinkedIn-profil: "${name} ${company} LinkedIn"
2. Søk etter personens direkte e-post og telefonnummer
3. Søk etter selskapets nettside og generell info
4. Søk etter selskapets generelle e-post/kontaktinfo (f.eks. post@selskap.com)

Returner følgende i JSON-format (ingenting annet, bare ren JSON):

{
  "person_name": "Fullt navn",
  "person_email": "personens DIREKTE e-postadresse hvis funnet, ellers null. IKKE selskapets generelle e-post (post@, info@, kontakt@). Kun personlig e-post som fornavn@selskap.com eller lignende.",
  "person_role": "stilling/rolle hvis funnet, ellers null",
  "person_phone": "personens direkte telefonnummer hvis funnet, ellers null. IKKE selskapets sentralbord.",
  "person_linkedin": "URL til LinkedIn-profil hvis funnet, ellers null",
  "company_name": "Offisielt firmanavn",
  "company_country": "Land (ISO 2-bokstavs kode, f.eks. NO, SE, DE)",
  "company_website": "URL til nettside hvis funnet, ellers null",
  "company_email": "selskapets generelle e-postadresse (post@, info@, kontakt@) hvis funnet, ellers null",
  "company_phone": "selskapets hovednummer hvis funnet, ellers null",
  "company_employee_count": tall eller null,
  "company_description": "Kort beskrivelse av hva selskapet gjør (1-2 setninger)",
  "company_operational_area": "Geografisk operasjonsområde hvis relevant, ellers null"
}

Viktig: Returner KUN gyldig JSON. Ingen markdown, ingen forklaring.`,
      }],
    });

    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => 'text' in block ? block.text : '')
      .join('');

    // Ekstraher JSON fra responsen
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Kunne ikke parse AI-respons' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ukjent feil';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
