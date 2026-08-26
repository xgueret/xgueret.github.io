import fr from './fr';
import en from './en';
import { translateCategorySlug } from './categories';

const translations = { fr, en } as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof fr;

export const defaultLocale: Locale = 'fr';
export const locales: Locale[] = ['fr', 'en'];

export function t(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations[defaultLocale][key] ?? key;
}

export function getLocaleFromUrl(url: URL | string): Locale {
  const pathname = typeof url === 'string' ? url : url.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0] as Locale;
  return locales.includes(first) ? first : defaultLocale;
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'fr' ? 'en' : 'fr';
}

export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? '' : `/${locale}`;
}

export function localizedPath(locale: Locale, path: string): string {
  const clean = path.replace(/^\/(fr|en)\//, '/').replace(/^\//, '');
  const prefix = localePrefix(locale);

  // Category slugs are translated names, so they cannot be carried across
  // locales as-is. Unknown categories fall back to the category index rather
  // than to a dead link.
  const category = clean.match(/^categories\/(.+?)\/?$/);
  if (category) {
    const translated = translateCategorySlug(
      decodeURIComponent(category[1]),
      locale
    );
    return translated === undefined
      ? `${prefix}/categories/`
      : `${prefix}/categories/${translated}/`;
  }

  return `${prefix}/${clean}`;
}

/**
 * Frontmatter dates are bare `YYYY-MM-DD`, which Zod coerces to midnight UTC.
 * Formatting them in the build machine's timezone shifts the day backwards
 * west of Greenwich, so the calendar date is read back in UTC — the timezone
 * it was written in.
 */
export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
