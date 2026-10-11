import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand
        'brand-gold': {
          50: 'rgb(var(--color-brand-gold-50) / <alpha-value>)',
          100: 'rgb(var(--color-brand-gold-100) / <alpha-value>)',
          300: 'rgb(var(--color-brand-gold-300) / <alpha-value>)',
          500: 'rgb(var(--color-brand-gold-500) / <alpha-value>)',
          700: 'rgb(var(--color-brand-gold-700) / <alpha-value>)',
          900: 'rgb(var(--color-brand-gold-900) / <alpha-value>)',
        },
        // Neutral
        neutral: {
          0: 'rgb(var(--color-neutral-0) / <alpha-value>)',
          50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
          500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
          700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
          900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
        },
        // Accent (preto/grafite da logo)
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
        },
        // Semantic
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
        // Surfaces
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        hover: 'rgb(var(--color-hover) / <alpha-value>)',
        // Text
        ink: 'rgb(var(--color-text-primary) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.625rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: 'var(--shadow-focus)',
        'inner-soft': 'inset 0 1px 2px rgba(0,0,0,0.04)',
      },
      zIndex: {
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(8px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-left': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-100%)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.96)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          from: { transform: 'scale(1)', opacity: '1' },
          to: { transform: 'scale(0.96)', opacity: '0' },
        },
        // Variante do scale-in/out que preserva a centralização por
        // transform (-translate-x-1/2 -translate-y-1/2) do DialogContent —
        // usar `scale-in`/`scale-out` puro ali sobrescreve o translate
        // durante a animação e o modal "pula" pro canto por um instante.
        'dialog-in': {
          from: { transform: 'translate(-50%, -50%) scale(0.96)', opacity: '0' },
          to: { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
        },
        'dialog-out': {
          from: { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
          to: { transform: 'translate(-50%, -50%) scale(0.96)', opacity: '0' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-2%, -3%) scale(1.04)' },
        },
        'drift-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(3%, 2%) scale(1.06)' },
        },
      },
      animation: {
        'fade-in': 'fade-in var(--duration-base) var(--ease-out)',
        'fade-out': 'fade-out var(--duration-base) var(--ease-out)',
        'slide-in-right': 'slide-in-right var(--duration-base) var(--ease-out)',
        'slide-up': 'slide-up var(--duration-base) var(--ease-out)',
        'slide-in-left': 'slide-in-left var(--duration-base) var(--ease-out)',
        'slide-out-left': 'slide-out-left var(--duration-base) var(--ease-out)',
        'scale-in': 'scale-in var(--duration-base) var(--ease-out)',
        'scale-out': 'scale-out var(--duration-fast) var(--ease-in-out)',
        'dialog-in': 'dialog-in var(--duration-base) var(--ease-out)',
        'dialog-out': 'dialog-out var(--duration-base) var(--ease-in-out)',
        'accordion-down': 'accordion-down var(--duration-base) var(--ease-out)',
        'accordion-up': 'accordion-up var(--duration-base) var(--ease-out)',
        shimmer: 'shimmer 1.6s linear infinite',
        'glow-pulse': 'glow-pulse 6s var(--ease-in-out) infinite',
        drift: 'drift 14s var(--ease-in-out) infinite',
        'drift-reverse': 'drift-reverse 18s var(--ease-in-out) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
