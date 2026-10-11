import { cn } from '@/utils/cn';

export interface TitleBlockProps {
  rows: readonly { label: string; value: string }[];
  className?: string;
}

/**
 * "Carimbo" de prancha técnica: rótulos em mono, caixa-alta, separados por
 * linhas finas. Usado nas telas de entrada como assinatura visual.
 */
export function TitleBlock({ rows, className }: TitleBlockProps) {
  return (
    <dl
      className={cn(
        'grid grid-cols-[auto_1fr] overflow-hidden rounded-md border border-border bg-surface/70 font-mono text-2xs backdrop-blur-sm',
        className,
      )}
    >
      {rows.map((row, idx) => (
        <div
          key={row.label}
          className={cn('contents', idx > 0 && '[&>*]:border-t [&>*]:border-border')}
        >
          <dt className="border-r border-border px-3 py-1.5 uppercase tracking-[0.16em] text-muted">
            {row.label}
          </dt>
          <dd className="truncate px-3 py-1.5 uppercase tracking-[0.12em] text-ink-soft">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
