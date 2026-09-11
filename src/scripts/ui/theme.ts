/**
 * Theme state. Dark is the site's identity and the default: the system's
 * `prefers-color-scheme` is deliberately never consulted, so light is always
 * an explicit choice. The head script in `BaseLayout` stamps the stored theme
 * before the first paint; this module owns every change after that.
 */

export type Theme = 'dark' | 'light';

const KEY = 'tp-theme';
/** Fired on `document` after the attribute changes, for the WebGL scene. */
export const THEME_EVENT = 'tp-themechange';

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private browsing refuses the write; the theme still holds for this page.
  }
  document.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/** Run `fn` on every theme change, and once now with the current theme. */
export function onThemeChange(fn: (theme: Theme) => void): void {
  document.addEventListener(THEME_EVENT, (e) => fn((e as CustomEvent<Theme>).detail));
  fn(getTheme());
}
