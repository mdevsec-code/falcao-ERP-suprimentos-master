/**
 * Visual comum dos campos de formulário (Input, Textarea, Select): superfície
 * levemente afundada, borda que escurece no hover e anel dourado no foco.
 * Um lugar só para os três nunca saírem de sintonia.
 */
export const fieldSurface =
  'rounded-md border border-border bg-surface shadow-field ' +
  'transition-[border-color,box-shadow,background-color] duration-fast ease-out ' +
  'hover:border-neutral-300 dark:hover:border-neutral-700';

/** Foco quando o próprio elemento recebe o foco (textarea, trigger do select). */
export const fieldFocus =
  'focus:outline-none focus:border-brand-gold-500 focus:shadow-[var(--shadow-field),var(--shadow-focus)] ' +
  'data-[state=open]:border-brand-gold-500 data-[state=open]:shadow-[var(--shadow-field),var(--shadow-focus)]';

/** Foco quando o campo é um wrapper com o input dentro (Input com ícones). */
export const fieldFocusWithin =
  'focus-within:border-brand-gold-500 focus-within:shadow-[var(--shadow-field),var(--shadow-focus)]';

export const fieldError =
  'border-danger/70 hover:border-danger focus:border-danger focus-within:border-danger';

/** Rótulo: acende em dourado enquanto o campo do mesmo grupo tem foco. */
export const fieldLabel =
  'text-xs font-medium tracking-[0.01em] text-ink-soft transition-colors duration-fast ' +
  'group-focus-within/field:text-brand-gold-700';
