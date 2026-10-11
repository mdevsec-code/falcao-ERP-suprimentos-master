import { cn } from '@/utils/cn';

/**
 * Cantoneiras douradas nos quatro cantos de um cartão — referência às marcas
 * de enquadramento de pranchas técnicas. O pai precisa ser `relative`.
 */
export function CornerBrackets({ className }: { className?: string }) {
  const base = 'absolute h-4 w-4 border-brand-gold-500';
  return (
    <span aria-hidden="true" className={cn('pointer-events-none', className)}>
      <span className={cn(base, '-left-px -top-px rounded-tl-xl border-l-2 border-t-2')} />
      <span className={cn(base, '-right-px -top-px rounded-tr-xl border-r-2 border-t-2')} />
      <span className={cn(base, '-bottom-px -left-px rounded-bl-xl border-b-2 border-l-2')} />
      <span className={cn(base, '-bottom-px -right-px rounded-br-xl border-b-2 border-r-2')} />
    </span>
  );
}
