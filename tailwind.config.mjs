/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e293b',
          dark: '#0f172a',
          light: '#334155',
        },
        accent: {
          DEFAULT: '#3b5998',
          hover: '#2d4373',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      maxWidth: {
        site: '1200px',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: '80ch',
            a: {
              color: theme('colors.accent.DEFAULT'),
              textDecoration: 'none',
              '&:hover': {
                color: theme('colors.accent.hover'),
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
