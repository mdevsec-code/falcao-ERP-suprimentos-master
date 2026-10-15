import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText, Sheet } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { getErrorMessage } from '@/services/http/errors';
import type { ExportFormat } from '@/utils/export/report';

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

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      await onExport(format);
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
