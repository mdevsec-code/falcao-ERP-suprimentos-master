import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { API_ORIGIN } from '@/config/env';
import { formatDateTime, formatFileSize } from '@/utils/format';

export interface FileListItem {
  id: string;
  fileName: string;
  size: number;
  url: string;
  uploadedByName: string;
  uploadedAt: string;
  /** Rótulo extra antes dos metadados (ex.: categoria do documento). */
  tag?: ReactNode;
}

export interface FileListProps {
  items: readonly FileListItem[];
  /** Sem `onRemove`, o botão de remover não aparece (usuário sem permissão). */
  onRemove?: (item: FileListItem) => void;
}

/** Lista de arquivos enviados à API (`/uploads/...`) com link de download. */
export function FileList({ items, onRemove }: FileListProps) {
  const { t } = useTranslation('common');

  return (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={item.id}
          className="group flex animate-slide-up items-center justify-between gap-3 rounded-md border border-border bg-surface p-3 transition-shadow duration-base hover:shadow-sm"
          style={{ animationDelay: `${idx * 40}ms`, animationFillMode: 'backwards' }}
        >
          <a
            href={`${API_ORIGIN}${item.url}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700"
            >
              <FileText className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink group-hover:text-brand-gold-700">
                {item.fileName}
              </span>
              <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-soft">
                {item.tag}
                {item.tag && <span aria-hidden="true">·</span>}
                <span>{formatFileSize(item.size)}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {t('file.uploadedBy', {
                    name: item.uploadedByName,
                    date: formatDateTime(item.uploadedAt),
                  })}
                </span>
              </span>
            </span>
          </a>
          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <a
                href={`${API_ORIGIN}${item.url}`}
                target="_blank"
                rel="noreferrer"
                aria-label={t('file.downloadAria', { name: item.fileName })}
              >
                <Download className="h-4 w-4" />
              </a>
            </Button>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-danger hover:text-danger"
                onClick={() => onRemove(item)}
                aria-label={t('file.removeAria', { name: item.fileName })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
