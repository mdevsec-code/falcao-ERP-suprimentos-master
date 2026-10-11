import { useId } from 'react';
import { cn } from '@/utils/cn';

export interface PipelineDiagramProps {
  steps: readonly string[];
  className?: string;
}

const WIDTH = 600;
const PAD = 36;
const LINE_Y = 46;
const PULSE = 90;
const CYCLE_S = 5;

/**
 * Fluxo de suprimentos como diagrama técnico: a linha se desenha ao montar,
 * e um pulso dourado percorre as etapas em loop, acendendo cada nó quando
 * passa por ele. Decorativo (as etapas também existem como texto acessível
 * em `sr-only`). Sem animação com prefers-reduced-motion (MotionConfig +
 * media query global do navegador desligam as CSS animations via Tailwind).
 */
export function PipelineDiagram({ steps, className }: PipelineDiagramProps) {
  const gradientId = useId().replace(/:/g, '');
  const span = WIDTH - PAD * 2;
  const xs = steps.map((_, i) => PAD + (steps.length === 1 ? 0 : (span * i) / (steps.length - 1)));
  const path = `M${PAD} ${LINE_Y} H${WIDTH - PAD}`;

  return (
    <div className={cn('w-full', className)}>
      <ol className="sr-only">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <svg
        viewBox={`0 0 ${WIDTH} 96`}
        className="h-auto w-full overflow-visible motion-reduce:[&_*]:!animate-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(var(--color-brand-gold-300))" stopOpacity="0" />
            <stop offset="60%" stopColor="rgb(var(--color-brand-gold-300))" stopOpacity="1" />
            <stop offset="100%" stopColor="rgb(var(--color-brand-gold-500))" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Trilho tracejado */}
        <path
          d={path}
          stroke="rgb(var(--color-border))"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          fill="none"
        />
        {/* Linha dourada que se desenha */}
        <path
          d={path}
          stroke="rgb(var(--color-brand-gold-500) / 0.55)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray={span}
          className="animate-draw-line"
          style={{ ['--dash' as string]: span }}
        />
        {/* Pulso viajante */}
        <path
          d={path}
          stroke={`url(#${gradientId})`}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${PULSE} ${span}`}
          className="animate-pulse-travel"
          style={{
            ['--travel-from' as string]: PULSE,
            ['--travel-to' as string]: -span,
            animationDelay: '1.2s',
            animationFillMode: 'backwards',
          }}
        />

        {steps.map((step, i) => {
          const x = xs[i] ?? PAD;
          // Momento (no ciclo) em que a frente do pulso chega a este nó.
          const arrival =
            1.2 + 0.06 * CYCLE_S + ((x - PAD + PULSE) / (span + PULSE)) * 0.84 * CYCLE_S;
          return (
            <g key={step}>
              <text
                x={x}
                y={LINE_Y - 20}
                textAnchor="middle"
                className="fill-brand-gold-700 font-mono"
                style={{ fontSize: 10, letterSpacing: '0.12em' }}
              >
                {String(i + 1).padStart(2, '0')}
              </text>
              <circle
                cx={x}
                cy={LINE_Y}
                r="7"
                stroke="rgb(var(--color-brand-gold-500))"
                strokeWidth="1.5"
                fill="rgb(var(--color-surface))"
                className="animate-node-lit"
                style={{ animationDelay: `${arrival - 0.6}s`, animationFillMode: 'backwards' }}
              />
              <circle cx={x} cy={LINE_Y} r="2" fill="rgb(var(--color-brand-gold-700))" />
              <text
                x={x}
                y={LINE_Y + 28}
                textAnchor="middle"
                className="fill-ink-soft"
                style={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}
              >
                {step}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
