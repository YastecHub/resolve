export function maskAccount(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 4 ? `****${digits.slice(-4)}` : '****';
}

export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]! : '';
  return last ? `${first} ${last.charAt(0)}.` : first;
}

/** Wraps text from customers, merchants or counterparties so the prompt can treat it as data. */
export function untrusted(text: string | null | undefined): string | null {
  if (text === null || text === undefined) return null;
  // Repeat until stable so nested fragments like `<untr<untrusted>usted>` can't reassemble a tag.
  let cleaned = text;
  for (;;) {
    const next = cleaned.replace(/<\/?\s*untrusted\s*>/gi, '');
    if (next === cleaned) break;
    cleaned = next;
  }
  return `<untrusted>${cleaned}</untrusted>`;
}

export const MAX_OUTPUT_BYTES = 4096;
const encoder = new TextEncoder();
export const byteSize = (value: unknown) => encoder.encode(JSON.stringify(value)).length;

/** Trims the longest array until the JSON fits, then marks the result `truncated`. */
export function truncateOutput(
  data: Record<string, unknown>,
  maxBytes = MAX_OUTPUT_BYTES,
): Record<string, unknown> {
  if (byteSize(data) <= maxBytes) return data;
  const copy: Record<string, unknown> = { ...data };
  while (byteSize({ ...copy, truncated: true }) > maxBytes) {
    const longest = Object.entries(copy)
      .filter(([, value]) => Array.isArray(value) && value.length > 0)
      .sort((a, b) => (b[1] as unknown[]).length - (a[1] as unknown[]).length)[0];
    if (!longest) break;
    copy[longest[0]] = (longest[1] as unknown[]).slice(0, -1);
  }
  const result = { ...copy, truncated: true };
  return byteSize(result) <= maxBytes
    ? result
    : { truncated: true, note: 'Output was too large and was dropped. Narrow the request.' };
}
