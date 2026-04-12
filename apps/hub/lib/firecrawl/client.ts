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
 * Søk nettet via Firecrawl og returner resultater som tekst.
 */
export async function firecrawlSearch(query: string, limit = 5): Promise<string> {
  const fc = getFirecrawlClient();
  const result = await fc.search(query, { limit });

  const items = result.web ?? [];
  if (items.length === 0) return '';

  return items
    .map((item, i) => {
      const title = ('title' in item ? item.title : '') ?? 'Uten tittel';
      const url = ('url' in item ? item.url : '') ?? '';
      const description = ('description' in item ? item.description : '') ?? '';
      return `### Resultat ${i + 1}: ${title}\nURL: ${url}\n${description}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Scrape en spesifikk URL og returner innholdet som markdown.
 */
export async function firecrawlScrape(url: string): Promise<string> {
  const fc = getFirecrawlClient();
  const result = await fc.scrape(url, { formats: ['markdown'] });

  const markdown = ('markdown' in result ? result.markdown : '') as string ?? '';
  if (!markdown) return '';

  return markdown.length > 5000 ? markdown.slice(0, 5000) + '...' : markdown;
}
