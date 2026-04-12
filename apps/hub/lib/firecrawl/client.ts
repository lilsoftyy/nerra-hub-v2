import Firecrawl from '@mendable/firecrawl-js';

let client: Firecrawl | null = null;

export function getFirecrawlClient(): Firecrawl {
  if (!client) {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY is not set');
    }
    client = new Firecrawl({ apiKey });
  }
  return client;
}

/**
 * Søk nettet via Firecrawl og returner markdown-innhold fra resultatene.
 * Returnerer de beste treffene med fullt sideinnhold.
 */
export async function firecrawlSearch(query: string, limit = 5): Promise<string> {
  const fc = getFirecrawlClient();
  const result = await fc.search(query, { limit });

  if (!result.success || !result.data || result.data.length === 0) {
    return '';
  }

  return result.data
    .map((item: { title?: string; url?: string; markdown?: string }, i: number) => {
      const title = item.title ?? 'Uten tittel';
      const url = item.url ?? '';
      const content = item.markdown ?? '';
      // Begrens innhold per resultat for å spare tokens
      const trimmed = content.length > 2000 ? content.slice(0, 2000) + '...' : content;
      return `### Resultat ${i + 1}: ${title}\nURL: ${url}\n\n${trimmed}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Scrape en spesifikk URL og returner innholdet som markdown.
 */
export async function firecrawlScrape(url: string): Promise<string> {
  const fc = getFirecrawlClient();
  const result = await fc.scrapeUrl(url, { formats: ['markdown'] });

  if (!result.success || !result.markdown) {
    return '';
  }

  // Begrens for å spare tokens
  return result.markdown.length > 5000 ? result.markdown.slice(0, 5000) + '...' : result.markdown;
}
