import type { Locale } from './index';

/**
 * Category slugs are the human-readable category names lowercased, so they
 * differ between locales whenever the name is translated. This table is the
 * only link between a category and its counterpart in the other language —
 * without it the language switcher carries a slug across locales verbatim and
 * lands on a 404.
 *
 * Slugs must be lowercase, exactly as `cat.toLowerCase()` produces them.
 */
const CATEGORY_PAIRS: ReadonlyArray<{ fr: string; en: string }> = [
  { fr: 'devops', en: 'devops' },
  { fr: 'github', en: 'github' },
  { fr: 'vibecoding', en: 'vibecoding' },
  { fr: 'tutoriels', en: 'tutorials' },
  { fr: 'intelligence artificielle', en: 'artificial intelligence' },
  { fr: 'projets personnels', en: 'personal projects' },
  { fr: 'du token au chatbot', en: 'from token to chatbot' },
  { fr: 'hermes agent', en: 'hermes agent' },
];

/**
 * Translate a category slug into the target locale. Returns undefined when the
 * slug is unknown, so callers can fall back instead of building a dead link.
 */
export function translateCategorySlug(
  slug: string,
  target: Locale
): string | undefined {
  const needle = slug.toLowerCase();
  const pair = CATEGORY_PAIRS.find((p) => p.fr === needle || p.en === needle);
  return pair?.[target];
}

/**
 * Fail the build when content introduces a category that is missing from
 * CATEGORY_PAIRS. Without this guard the table silently drifts as soon as a
 * new category is used, reintroducing broken language-switcher links.
 */
export function assertCategoriesMapped(slugs: string[], locale: Locale): void {
  const known = new Set(CATEGORY_PAIRS.map((p) => p[locale]));
  const missing = slugs.filter((slug) => !known.has(slug.toLowerCase()));

  if (missing.length > 0) {
    throw new Error(
      `[i18n/categories] Unmapped ${locale.toUpperCase()} categor${
        missing.length > 1 ? 'ies' : 'y'
      }: ${missing.map((m) => `"${m}"`).join(', ')}.\n` +
        `Add the ${locale === 'fr' ? 'fr/en' : 'en/fr'} pair to CATEGORY_PAIRS in src/i18n/categories.ts, ` +
        `otherwise the language switcher will link to a 404.`
    );
  }
}
