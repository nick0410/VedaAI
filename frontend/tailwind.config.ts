import type { Config } from 'tailwindcss';

const cssVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: cssVar('--c-page'),
        line: cssVar('--c-line'),
        ink: {
          50: cssVar('--c-ink-50'),
          100: cssVar('--c-ink-100'),
          200: cssVar('--c-ink-200'),
          300: cssVar('--c-ink-300'),
          400: cssVar('--c-ink-400'),
          500: cssVar('--c-ink-500'),
          600: cssVar('--c-ink-600'),
          700: cssVar('--c-ink-700'),
          800: cssVar('--c-ink-800'),
          900: cssVar('--c-ink-900'),
          950: cssVar('--c-ink-950'),
        },
        brand: {
          50: '#FFF1EC',
          100: '#FFE0D2',
          400: '#FF7E4D',
          500: '#FF6B35',
          600: '#E5552B',
          700: '#B8421F',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)',
        cta: '0 4px 14px -2px rgba(255, 107, 53, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Times New Roman"', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
export default config;
