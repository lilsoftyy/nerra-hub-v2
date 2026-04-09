import type Anthropic from '@anthropic-ai/sdk';

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
    .replace(/\s{2,}/g, ' ')
    .trim();

  const summary = content
    .split('\n\n')
    .find((p) => p.length > 20)
    ?.replace(/[#*]/g, '')
    .trim()
    .slice(0, 200) ?? '';

  return { content, summary };
}
