import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';

/** O Radix Select não aceita `value=""` — "nenhum" usa este sentinela. */
const NONE = '__none';

export interface SelectFieldProps {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
  /** Com rótulo, oferece a opção vazia (campo opcional); escolhê-la emite `''`. */
  noneLabel?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
}

/**
 * Select rotulado para formulários (react-hook-form via `Controller`), com o
 * mesmo layout de rótulo/erro/dica do `Input`.
 */
export function SelectField({
  id,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder,
  noneLabel,
  required,
  disabled,
  error,
  hint,
}: SelectFieldProps) {
  const current = value ? value : noneLabel ? NONE : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Select
        value={current}
        onValueChange={(v) => onChange(v === NONE ? '' : v)}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          onBlur={onBlur}
          aria-invalid={!!error || undefined}
          className={error ? 'border-danger' : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="text-xs text-ink-soft">{hint}</p>
      )}
    </div>
  );
}
