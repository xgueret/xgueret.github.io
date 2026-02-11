import fr from './fr';
import en from './en';

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

export function localizedPath(locale: Locale, path: string): string {
  const clean = path.replace(/^\/(fr|en)\//, '/').replace(/^\//, '');
  return `/${locale}/${clean}`;
}

export function formatDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
