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
        // Barra lateral grafite
        rail: {
          DEFAULT: 'rgb(var(--color-rail-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-rail-surface) / <alpha-value>)',
          border: 'rgb(var(--color-rail-border) / <alpha-value>)',
          text: 'rgb(var(--color-rail-text) / <alpha-value>)',
          'text-soft': 'rgb(var(--color-rail-text-soft) / <alpha-value>)',
        },
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
        glow: 'var(--shadow-glow)',
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
        spring: 'var(--ease-spring)',
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
        // Barra que cresce da esquerda (réguas e medidores; use com origin-left).
        'grow-x': {
          from: { transform: 'scaleX(0)' },
          to: { transform: 'scaleX(1)' },
        },
        // ── Linguagem "planta técnica" (login e telas de entrada) ──
        // Traço que se desenha: requer stroke-dasharray = comprimento do path.
        'draw-line': {
          from: { strokeDashoffset: 'var(--dash, 1000)' },
          to: { strokeDashoffset: '0' },
        },
        // Pulso dourado que percorre o fluxo de ponta a ponta, em loop.
        // Com stroke-dasharray "L P" (L = tamanho do pulso, P = comprimento do
        // path): offset L = pulso inteiro antes do início; -P = depois do fim.
        'pulse-travel': {
          '0%': { strokeDashoffset: 'var(--travel-from, 80)', opacity: '0' },
          '6%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { strokeDashoffset: 'var(--travel-to, -1000)', opacity: '0' },
        },
        // Etapa do fluxo acendendo quando o pulso passa por ela.
        'node-lit': {
          '0%, 100%': { fill: 'rgb(var(--color-surface))' },
          '12%, 30%': { fill: 'rgb(var(--color-brand-gold-300))' },
        },
        'blink-caret': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        // ── Linguagem do app (overhaul) ──
        // Entrada de bloco: sobe, ganha nitidez. Escalonar com .stagger.
        rise: {
          from: { transform: 'translateY(10px)', opacity: '0', filter: 'blur(4px)' },
          // fill-mode `backwards` (não both): ao terminar devolve o transform ao hover.
          to: { transform: 'none', opacity: '1', filter: 'none' },
        },
        // Reflexo que atravessa o botão primário no hover.
        shine: {
          from: { transform: 'translateX(-120%) skewX(-20deg)' },
          to: { transform: 'translateX(220%) skewX(-20deg)' },
        },
        // Barra de carregamento indeterminada (NavigationProgress).
        'progress-sweep': {
          '0%': { transform: 'translateX(-100%) scaleX(0.3)' },
          '50%': { transform: 'translateX(20%) scaleX(0.6)' },
          '100%': { transform: 'translateX(110%) scaleX(0.3)' },
        },
        // Anel que se expande a partir de um ponto (pendência / ao vivo).
        'ping-soft': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        // Ícone que "encaixa" ao ativar (trilho da Sidebar, sucesso).
        'pop-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        // Malha da planta deslizando devagar (fundo do cabeçalho de página).
        'grid-pan': {
          from: { backgroundPosition: '0 0' },
          to: { backgroundPosition: '24px 24px' },
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
        'grow-x': 'grow-x 0.9s var(--ease-out) both',
        'draw-line': 'draw-line 1.4s var(--ease-out) both',
        'pulse-travel': 'pulse-travel 5s var(--ease-in-out) infinite',
        'node-lit': 'node-lit 5s var(--ease-in-out) infinite',
        'blink-caret': 'blink-caret 1.1s steps(1) infinite',
        rise: 'rise 0.55s var(--ease-out) backwards',
        shine: 'shine 0.9s var(--ease-out)',
        'progress-sweep': 'progress-sweep 1.2s var(--ease-in-out) infinite',
        'ping-soft': 'ping-soft 2s var(--ease-out) infinite',
        'pop-in': 'pop-in 0.35s var(--ease-spring) both',
        'grid-pan': 'grid-pan 6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
