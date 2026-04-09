/** Shared select element className — matches Input styling */
export const selectClassName = "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Sortable table head className */
export const sortableHeadClassName = "cursor-pointer select-none hover:text-foreground transition-[color] duration-150";

/** Build mailto URL with proper encoding */
export function buildMailtoUrl(to: string | string[], subject: string, body: string): string {
  const emails = Array.isArray(to) ? to.join(',') : to;
  return `mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
