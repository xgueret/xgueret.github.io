/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      maxWidth: {
        site: '1200px',
      },
      typography: () => ({
        DEFAULT: {
          css: {
            maxWidth: '80ch',
            a: {
              color: 'var(--color-accent)',
              textDecoration: 'none',
              '&:hover': {
                color: 'var(--color-accent-hover)',
                textDecoration: 'underline',
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
