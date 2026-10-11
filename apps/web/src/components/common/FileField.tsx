import { useId, useRef, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatFileSize } from '@/utils/format';

export interface FileFieldProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  /** Tamanho máximo aceito, em bytes — acima disso o arquivo é recusado com erro. */
  maxSize?: number;
  error?: string | null;
  onError?: (message: string | null) => void;
  disabled?: boolean;
}

/**
 * Campo de arquivo no padrão visual dos inputs (borda tracejada dourada no
 * foco), com nome/tamanho do arquivo escolhido e checagem de tamanho no
 * cliente — evita subir 50 MB só para a API recusar.
 */
export function FileField({
  label,
  file,
  onFileChange,
  maxSize,
  error,
  onError,
  disabled,
}: FileFieldProps) {
  const { t } = useTranslation('common');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    if (selected && maxSize && selected.size > maxSize) {
      onError?.(t('file.tooLarge', { max: formatFileSize(maxSize) }));
      onFileChange(null);
      event.target.value = '';
      return;
    }
    onError?.(null);
    onFileChange(selected);
  }

  function clear() {
    onFileChange(null);
    onError?.(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold text-ink-soft">
        {label}
      </label>
      <label
        htmlFor={inputId}
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border bg-surface px-3 py-4',
          'transition-[border-color,background-color,box-shadow] duration-fast',
          'hover:border-brand-gold-500 hover:bg-brand-gold-50/40',
          'focus-within:border-brand-gold-500 focus-within:shadow-focus',
          error && 'border-danger',
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700 transition-transform duration-base group-hover:scale-110"
        >
          <FileUp className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          {file ? (
            <>
              <span className="block truncate text-sm font-medium text-ink">{file.name}</span>
              <span className="block text-xs text-ink-soft">{formatFileSize(file.size)}</span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium text-ink">{t('file.choose')}</span>
              {maxSize && (
                <span className="block text-xs text-ink-soft">
                  {t('file.maxSize', { max: formatFileSize(maxSize) })}
                </span>
              )}
            </>
          )}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="sr-only"
          onChange={handleChange}
          disabled={disabled}
        />
      </label>
      {file && (
        <button
          type="button"
          onClick={clear}
          className="inline-flex w-fit items-center gap-1 text-xs text-ink-soft hover:text-ink"
        >
          <X className="h-3 w-3" aria-hidden="true" />
          {t('file.remove')}
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
