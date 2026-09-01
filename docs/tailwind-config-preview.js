/**
 * Family Hub — Tailwind CSS Config Preview
 *
 * File ini adalah preview konfigurasi Tailwind CSS untuk Family Hub.
 * Salin konten `theme.extend` ke file `tailwind.config.ts` di project frontend.
 *
 * Font yang dibutuhkan (tambahkan di _document.tsx atau layout.tsx):
 * https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap
 * https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap
 */

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // ─── Font Family ─────────────────────────────────────────────────────
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      // ─── Font Size ───────────────────────────────────────────────────────
      fontSize: {
        xs:   ['11px', { lineHeight: '1.5' }],
        sm:   ['13px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.6' }],
        lg:   ['17px', { lineHeight: '1.5' }],
        xl:   ['19px', { lineHeight: '1.4' }],
        '2xl': ['22px', { lineHeight: '1.3' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
      },

      // ─── Colors ──────────────────────────────────────────────────────────
      colors: {
        // Primary — Teal Hangat
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6', // ← main primary
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          DEFAULT: '#14b8a6',
        },

        // Secondary — Indigo Hangat
        secondary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1', // ← main secondary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#6366f1',
        },

        // Accent — Amber Hangat
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // ← main accent
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#f59e0b',
        },

        // Neutral — Warm Gray (Stone-based)
        neutral: {
          0:   '#ffffff',
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        },

        // Semantic — Success
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },

        // Semantic — Warning
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },

        // Semantic — Error
        error: {
          50:  '#fef2f2',
          100: '#fee2e2',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        // Semantic — Info
        info: {
          50:  '#eff6ff',
          100: '#dbeafe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },

        // Family Member Colors
        member: {
          sky:     '#0ea5e9',
          rose:    '#f43f5e',
          violet:  '#8b5cf6',
          amber:   '#f59e0b',
          emerald: '#10b981',
          orange:  '#f97316',
          pink:    '#ec4899',
          indigo:  '#6366f1',
        },
      },

      // ─── Border Radius ───────────────────────────────────────────────────
      borderRadius: {
        sm:   '4px',
        DEFAULT: '6px',
        md:   '8px',
        lg:   '12px',  // button, input
        xl:   '16px',  // card default
        '2xl': '20px', // card besar, modal
        '3xl': '24px',
        full: '9999px',
      },

      // ─── Box Shadow ──────────────────────────────────────────────────────
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.05)',
        sm: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)',
        lg: '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04)',
        xl: '0 20px 25px rgba(0,0,0,0.08), 0 8px 10px rgba(0,0,0,0.04)',
        '2xl': '0 25px 50px rgba(0,0,0,0.12)',
        none: 'none',
      },

      // ─── Spacing ─────────────────────────────────────────────────────────
      // Menggunakan default Tailwind (base 4px), tidak perlu override
      // Gunakan: p-4 = 16px, p-6 = 24px, gap-3 = 12px, dst.

      // ─── Transitions ─────────────────────────────────────────────────────
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },

      // ─── Z-Index ─────────────────────────────────────────────────────────
      zIndex: {
        base:     '0',
        raised:   '10',
        dropdown: '100',
        overlay:  '200',
        modal:    '300',
        toast:    '400',
        tooltip:  '500',
      },

      // ─── Min Height (touch targets) ──────────────────────────────────────
      minHeight: {
        'touch': '44px', // minimum touch target (a11y)
        'btn-sm': '32px',
        'btn-md': '40px',
        'btn-lg': '48px',
      },

      // ─── Min Width ───────────────────────────────────────────────────────
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};

module.exports = config;

// ─── Cara Penggunaan ──────────────────────────────────────────────────────────
//
// Di file tailwind.config.ts frontend, merge dengan:
//
// import type { Config } from 'tailwindcss'
//
// const config: Config = {
//   darkMode: 'class',
//   content: [...],
//   theme: {
//     extend: {
//       // copy semua dari config.theme.extend di atas
//     }
//   },
//   plugins: [require('tailwindcss-animate')],
// }
//
// export default config
//
// ─── CSS Variables (globals.css) ──────────────────────────────────────────────
//
// :root {
//   --color-primary:      14 184 166;   /* #14b8a6  — used as RGB for opacity */
//   --color-secondary:    99 102 241;   /* #6366f1  */
//   --color-accent:       245 158 11;   /* #f59e0b  */
//   --color-background:   250 250 249;  /* #fafaf9  */
//   --color-surface:      245 245 244;  /* #f5f5f4  */
//   --color-border:       231 229 228;  /* #e7e5e4  */
//   --color-text:         41 37 36;     /* #292524  */
//   --color-text-muted:   120 113 108;  /* #78716c  */
//   --radius:             12px;
// }
//
// .dark {
//   --color-background:   28 25 23;     /* #1c1917  */
//   --color-surface:      41 37 36;     /* #292524  */
//   --color-border:       68 64 60;     /* #44403c  */
//   --color-text:         245 245 244;  /* #f5f5f4  */
//   --color-text-muted:   168 162 158;  /* #a8a29e  */
//   --color-primary:      45 212 191;   /* #2dd4bf  — brighter for dark mode */
// }
