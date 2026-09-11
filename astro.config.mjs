import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://xgueret.github.io',
  redirects: {
    '/posts': '/blog',
    '/posts/[...slug]': '/blog/[...slug]',
    '/en/posts': '/en/blog',
    '/en/posts/[...slug]': '/en/blog/[...slug]',
    '/about': '/#tp-about',
    '/cv': '/#tp-cv',
    '/contact': '/#tp-contact',
    '/training': '/',
    '/en/about': '/en/#tp-about',
    '/en/cv': '/en/#tp-cv',
    '/en/contact': '/en/#tp-contact',
    '/en/training': '/en/',
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      // three and lenis are reachable only through the home page's dynamic
      // import, so Vite's startup scan cannot see them. It discovers them on
      // the first visit instead, re-optimizes, and bumps the `?v=` hash the
      // open tab is still asking for — the dep 504s, the dynamic import
      // rejects, and the page silently degrades to the static one. Naming
      // them here pre-bundles them at boot, before any tab exists.
      include: ['three', 'lenis'],
    },
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr',
          en: 'en',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  markdown: {
    shikiConfig: {
      // Both themes ship as CSS variables on every token; `global.css` picks
      // one from `data-theme`. A single theme left code unreadable on paper.
      themes: { dark: 'github-dark', light: 'github-light' },
      defaultColor: false,
    },
  },
});
