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
    '/projects': '/#tp-work',
    '/training': '/',
    '/en/about': '/en/#tp-about',
    '/en/cv': '/en/#tp-cv',
    '/en/contact': '/en/#tp-contact',
    '/en/projects': '/en/#tp-work',
    '/en/training': '/en/',
  },
  vite: {
    plugins: [tailwindcss()],
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
      theme: 'github-dark',
    },
  },
});
