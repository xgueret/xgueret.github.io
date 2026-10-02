import { decode, encode } from 'gpt-tokenizer/encoding/o200k_base';

/** The backdrop atlas is a 16×16 grid. */
export const ATLAS_SIZE = 256;

/** A content word: at least four letters once the leading space is dropped. */
const DISTINCTIVE = /^\p{L}{4,}$/u;

/** Visible text of an HTML fragment: no scripts, styles, tags or entities. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The page's text as an o200k model reads it, cut down to what the atlas can
 * hold: half the most frequent tokens (the grain of the language), half the
 * most frequent content words (what this page is about). A leading space is
 * drawn as `▁`, the way tokenizers print it.
 */
export function pageTokens(text: string, size = ATLAS_SIZE): string[] {
  const counts = new Map<number, number>();
  for (const id of encode(text)) counts.set(id, (counts.get(id) ?? 0) + 1);

  const ranked: { token: string; count: number }[] = [];
  for (const [id, count] of counts) {
    const raw = decode([id]);
    // Half of a multi-byte character decodes to U+FFFD on its own.
    if (raw.includes('�') || !raw.trim()) continue;
    ranked.push({ token: raw.replace(/^ /, '▁').replace(/\s+/g, ''), count });
  }
  ranked.sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const half = Math.floor(size / 2);
  const picked = new Set<string>();
  for (const r of ranked) {
    if (picked.size >= half) break;
    if (DISTINCTIVE.test(r.token.replace(/^▁/, ''))) picked.add(r.token);
  }
  for (const r of ranked) {
    if (picked.size >= size) break;
    picked.add(r.token);
  }
  return [...picked];
}
