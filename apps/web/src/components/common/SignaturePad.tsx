import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eraser } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface SignaturePadHandle {
  /** PNG recortado no traço (data URL); `null` se nada foi desenhado. */
  toDataUrl: () => string | null;
  clear: () => void;
}

interface SignaturePadProps {
  /** Chamado sempre que o quadro passa de vazio para assinado (e vice-versa). */
  onChange?: (hasSignature: boolean) => void;
  className?: string;
}

const INK = '#14140f';

/**
 * Quadro de assinatura: dedo (celular/tablet), caneta ou mouse. Desenha em
 * resolução real da tela (devicePixelRatio) e exporta só a área assinada.
 */
export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
  { onChange, className },
  ref,
) {
  const { t } = useTranslation('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(ratio, ratio);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2.2;
    context.strokeStyle = INK;
  }, []);

  useEffect(() => {
    setupCanvas();
  }, [setupCanvas]);

  const markInk = (value: boolean) => {
    setHasInk((current) => {
      if (current !== value) onChange?.(value);
      return value;
    });
  };

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function start(event: React.PointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    last.current = point(event);
    const context = event.currentTarget.getContext('2d');
    if (context && last.current) {
      // Um toque sem arrastar também deixa marca (ponto).
      context.beginPath();
      context.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
      context.fillStyle = INK;
      context.fill();
    }
    markInk(true);
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const current = point(event);
    context.beginPath();
    context.moveTo(last.current.x, last.current.y);
    context.lineTo(current.x, current.y);
    context.stroke();
    last.current = current;
  }

  function end() {
    drawing.current = false;
    last.current = null;
  }

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    markInk(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    clear,
    toDataUrl: () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context || !hasInk) return null;
      // Recorta no traço (+ margem): imagem pequena e assinatura centralizada no PDF.
      const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (data[(y * width + x) * 4 + 3]! > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return null;
      const pad = 8;
      const sx = Math.max(0, minX - pad);
      const sy = Math.max(0, minY - pad);
      const sw = Math.min(width, maxX + pad) - sx;
      const sh = Math.min(height, maxY + pad) - sy;
      // Reduz assinaturas desenhadas em telas de alta densidade.
      const scale = Math.min(1, 600 / sw);
      const out = document.createElement('canvas');
      out.width = Math.max(1, Math.round(sw * scale));
      out.height = Math.max(1, Math.round(sh * scale));
      out.getContext('2d')?.drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height);
      return out.toDataURL('image/png');
    },
  }));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none rounded-md border-2 border-dashed border-brand-gold-300 bg-white"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          aria-label={t('common:signature.areaLabel')}
          role="img"
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-soft/70">
            {t('common:signature.placeholder')}
          </span>
        )}
        <span className="pointer-events-none absolute bottom-6 left-6 right-6 border-b border-ink-soft/40" />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          leftIcon={<Eraser className="h-3.5 w-3.5" />}
          onClick={clear}
          disabled={!hasInk}
        >
          {t('common:signature.clear')}
        </Button>
      </div>
    </div>
  );
});
