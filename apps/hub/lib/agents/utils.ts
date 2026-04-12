import type Anthropic from '@anthropic-ai/sdk';
import { SupabaseClient } from '@supabase/supabase-js';

/** Hent agentens lærdom fra tidligere redigeringer */
export async function getAgentMemory(supabase: SupabaseClient, agentName: string): Promise<string> {
  const { data } = await supabase
    .from('agent_memory')
    .select('category, learning')
    .eq('agent_name', agentName)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return '';

  const lines = data.map((m) => `- [${m.category}] ${m.learning}`).join('\n');
  return `\n\n---\n\n## Lærdom fra tidligere redigeringer\n\nBrukeren har tidligere redigert dokumenter du har generert. Her er hva du bør ta hensyn til:\n\n${lines}\n\nBruk denne lærdommen til å tilpasse tone, innhold og struktur.`;
}

/** Clean AI-generated content: remove citations, zero-width chars, excess whitespace */
export function cleanAgentContent(message: Anthropic.Message): { content: string; summary: string } {
  const rawContent = message.content
    .filter((block) => block.type === 'text')
    .map((block) => 'text' in block ? block.text : '')
    .join('\n\n');

  const content = rawContent
    .replace(/\[\d+\]/g, '')
    .replace(/[\u{E000}-\u{F8FF}\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/gu, '')
    .replace(/\u200B/g, '')
    // Fix "**Label:** \n\nVerdi" → "**Label:** Verdi"
    .replace(/(\*\*[^*]+:\*\*)\s*\n+\s*/g, '$1 ')
    // Fix linjeskift foran punktum/komma
    .replace(/\n+\.\s*/g, '. ')
    .replace(/\n+,\s*/g, ', ')
    // Fix "tekst\n\n. \n\ntekst" → "tekst. tekst"
    .replace(/\s*\n\n\.\s*\n\n/g, '. ')
    // Fix løse linjeskift midt i setninger (lowercase før \n\n + lowercase etter)
    .replace(/([a-zæøå,])\s*\n\n\s*([a-zæøå])/g, '$1 $2')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[^\S\n]{2,}/g, ' ')
    .replace(/\\"/g, '"')
    .trim();

  const summary = content
    .split('\n\n')
    .find((p) => p.length > 20)
    ?.replace(/[#*]/g, '')
    .trim()
    .slice(0, 200) ?? '';

  return { content, summary };
}
