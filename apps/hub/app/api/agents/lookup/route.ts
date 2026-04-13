import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { firecrawlSearch } from '@/lib/firecrawl/client';

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
    // Firecrawl: søk etter person og selskap
    let webData = '';
    try {
      const results = await Promise.all([
        firecrawlSearch(`${name} ${company} LinkedIn`, 3),
        firecrawlSearch(`${company} facility management building maintenance cleaning company`, 3),
      ]);
      webData = results.filter(Boolean).join('\n\n---\n\n');
    } catch {
      // Fortsett uten Firecrawl-data
    }

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
        content: `${webData ? `## Data fra nettet\n\n${webData}\n\n---\n\n` : ''}Finn informasjon om denne personen og selskapet basert på dataen over:

Personnavn: ${name}
Selskap: ${company}

VIKTIG KONTEKST: Vi driver med Drone Wash Academy — dronebasert fasadevask. Vi søker etter selskaper innen facility management, eiendomsservice, bygningsvedlikehold og rengjøring. Hvis selskapsnavnet er tvetydig (f.eks. "ISS"), finn selskapet som er relevant for denne bransjen (f.eks. ISS Facility Services, ikke ISS governance).

Returner følgende i JSON-format (ingenting annet, bare ren JSON):

{
  "person_name": "Fullt navn",
  "person_email": "personens DIREKTE e-postadresse hvis funnet, ellers null. IKKE selskapets generelle e-post (post@, info@, kontakt@). Kun personlig e-post som fornavn@selskap.com eller lignende.",
  "person_role": "stilling/rolle OVERSATT TIL NORSK (f.eks. 'Daglig leder', ikke 'Geschäftsführer' eller 'CEO'), ellers null",
  "person_phone": "personens direkte telefonnummer hvis funnet, ellers null. IKKE selskapets sentralbord.",
  "person_linkedin": "URL til LinkedIn-profil hvis funnet, ellers null",
  "company_name": "Offisielt firmanavn",
  "company_country": "Land (ISO 2-bokstavs kode, f.eks. NO, SE, DE)",
  "company_website": "URL til nettside hvis funnet, ellers null",
  "company_email": "selskapets generelle e-postadresse (post@, info@, kontakt@) hvis funnet, ellers null",
  "company_phone": "selskapets hovednummer hvis funnet, ellers null",
  "company_employee_count": tall eller null,
  "company_description": "Kort beskrivelse PÅ NORSK av hva selskapet gjør (1-2 setninger, alltid norsk bokmål)",
  "company_operational_area": "Geografisk operasjonsområde hvis relevant, ellers null"
}

Viktig:
- Returner KUN gyldig JSON. Ingen markdown, ingen forklaring.
- ALL tekst (stilling, beskrivelse, operasjonsområde) skal være på NORSK BOKMÅL med korrekte æ, ø, å. Oversett fra alle språk.`,
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
