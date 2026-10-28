import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText, Languages, Sheet } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { LOCALES, localeShortLabels, type Locale } from '@/constants/i18n';
import { getErrorMessage } from '@/services/http/errors';
import {
  loadExportLanguages,
  saveExportLanguages,
  withExportLanguages,
  type ExportLanguages,
} from '@/utils/export/language';
import type { ExportFormat } from '@/utils/export/report';
import { cn } from '@/utils/cn';

export interface ExportMenuProps {
  onExport: (format: ExportFormat) => Promise<void>;
  /** Formatos oferecidos (padrão: os três). */
  formats?: readonly ExportFormat[];
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

const ICONS = { pdf: FileText, xlsx: FileSpreadsheet, csv: Sheet } as const;

/** Botão "Exportar" padrão — o mesmo menu (PDF, Excel, CSV) em todas as telas. */
export function ExportMenu({
  onExport,
  formats = ['pdf', 'xlsx', 'csv'],
  disabled,
  label,
  size = 'md',
}: ExportMenuProps) {
  const { t } = useTranslation('common');
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [languages, setLanguages] = useState<ExportLanguages>(loadExportLanguages);

  const chooseLanguages = (next: ExportLanguages) => {
    setLanguages(next);
    saveExportLanguages(next);
  };

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await withExportLanguages(languages, () => onExport(format));
    } catch (error) {
      toast.error(getErrorMessage(error, t('common:export.error')));
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          disabled={disabled}
          isLoading={busy !== null}
          leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
        >
          {label ?? t('common:export.button')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => {
          const Icon = ICONS[format];
          return (
            <DropdownMenuItem key={format} onSelect={() => void run(format)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {t(`common:export.formats.${format}`)}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-1.5">
          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
          {t('common:export.language.title')}
        </DropdownMenuLabel>
        <LanguageRow
          label={t('common:export.language.first')}
          options={LOCALES}
          selected={languages.primary}
          onSelect={(primary) =>
            primary &&
            chooseLanguages({
              primary,
              secondary: languages.secondary === primary ? null : languages.secondary,
            })
          }
        />
        <LanguageRow
          label={t('common:export.language.second')}
          options={[null, ...LOCALES.filter((locale) => locale !== languages.primary)]}
          noneLabel={t('common:export.language.none')}
          selected={languages.secondary}
          onSelect={(secondary) => chooseLanguages({ ...languages, secondary })}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Uma linha de escolha (1º ou 2º idioma); o menu fica aberto para escolher o formato depois. */
function LanguageRow({
  label,
  options,
  selected,
  noneLabel,
  onSelect,
}: {
  label: string;
  options: readonly (Locale | null)[];
  selected: Locale | null;
  noneLabel?: string;
  onSelect: (locale: Locale | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 px-2 pb-1">
      <span className="w-14 shrink-0 text-xs text-ink-soft">{label}</span>
      {options.map((locale) => {
        const checked = locale === selected;
        return (
          <DropdownMenuItem
            key={locale ?? 'none'}
            role="menuitemradio"
            aria-checked={checked}
            onSelect={(event) => {
              event.preventDefault();
              onSelect(locale);
            }}
            className={cn(
              'rounded border px-1.5 py-0.5 text-xs',
              checked
                ? 'border-brand-gold-500 bg-brand-gold-50 font-semibold'
                : 'border-border text-ink-soft',
            )}
          >
            {locale ? localeShortLabels[locale] : noneLabel}
          </DropdownMenuItem>
        );
      })}
    </div>
  );
}
