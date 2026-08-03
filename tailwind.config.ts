import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    borderRadius: {
      none: '0',
      sm: '0.1875rem', // 3px
      DEFAULT: '0.25rem', // 4px
      md: '0.375rem', // 6px
      lg: '0.5rem', // 8px
      xl: '0.75rem', // 12px
      '2xl': '1rem', // 16px
      '3xl': '1.25rem', // 20px
      full: '9999px',
    },
    extend: {
      width: {
        '6xl': '72rem',
      },
      minWidth: {
        '6xl': '72rem',
      },
      colors: {
        brand: {
          50: '#f0f6fa',
          100: '#dceaf4',
          200: '#b9d5e9',
          300: '#8bbad9',
          400: '#5a9cc7',
          500: '#3d8bbf',
          600: '#2f7cb2',
          700: '#286694',
          800: '#225376',
          900: '#1c435f',
          950: '#122b3d',
        },
        ink: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(15, 23, 42, 0.05), 0 2px 8px rgba(15, 23, 42, 0.06)',
        'lift-brand':
          '0 1px 2px rgba(47, 124, 178, 0.08), 0 3px 10px rgba(47, 124, 178, 0.12)',
        'lift-lg':
          '0 2px 4px rgba(15, 23, 42, 0.05), 0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      backgroundImage: {
        'mesh-light':
          'radial-gradient(at 0% 0%, rgba(47, 124, 178, 0.09) 0, transparent 55%), radial-gradient(at 100% 0%, rgba(40, 102, 148, 0.07) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(15, 23, 42, 0.04) 0, transparent 45%)',
        'mesh-dark':
          'radial-gradient(at 20% 20%, rgba(90, 156, 199, 0.35) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(47, 124, 178, 0.4) 0, transparent 45%), radial-gradient(at 50% 100%, rgba(2, 6, 23, 0.8) 0, transparent 55%)',
        grid: 'linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '40px 40px',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'spin-rim-pulse': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '0.95', transform: 'scale(1.04)' },
        },
        'spin-win-pop': {
          '0%': { transform: 'scale(0.94)', opacity: '0' },
          '55%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'spin-spark': {
          '0%': { opacity: '0', transform: 'scale(0.4)' },
          '35%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.35)' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 14s ease infinite',
        shimmer: 'shimmer 2.8s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'spin-rim-pulse': 'spin-rim-pulse 2.8s ease-in-out infinite',
        'spin-win-pop': 'spin-win-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-spark': 'spin-spark 0.9s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
