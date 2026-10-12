import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, FileSearch, FileText, Pencil, Trash2 } from 'lucide-react';
import type { DocumentValidity } from '@falcao-erp/shared-types';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { RowAction } from '@/components/common/RowAction';
import { CENTRAL_DOCUMENT_CATEGORY_LABELS } from '@/constants/enums';
import { routeTo } from '@/constants/routes';
import { API_ORIGIN } from '@/config/env';
import { formatDate, formatDateOnly, formatFileSize } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { DocumentDto } from '../types';

const VALIDITY_BADGE: Record<Exclude<DocumentValidity, 'SEM_VALIDADE'>, BadgeVariant> = {
  OK: 'success',
  VENCENDO: 'warning',
  VENCIDO: 'danger',
};

interface DocumentsTableProps {
  rows: readonly DocumentDto[];
  isFetching?: boolean;
  canManage: (document: DocumentDto) => boolean;
  onEdit: (document: DocumentDto) => void;
  onRemove: (document: DocumentDto) => void;
  onTagClick: (tag: string) => void;
}

export function DocumentsTable({
  rows,
  isFetching,
  canManage,
  onEdit,
  onRemove,
  onTagClick,
}: DocumentsTableProps) {
  const { t } = useTranslation('documents');

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('documents:table.document')}</TableHead>
          <TableHead>{t('documents:table.category')}</TableHead>
          <TableHead>{t('documents:table.validity')}</TableHead>
          <TableHead>{t('documents:table.links')}</TableHead>
          <TableHead className="text-right">{t('documents:table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="max-w-md">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700"
                  aria-hidden="true"
                >
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <a
                    href={`${API_ORIGIN}${doc.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-ink hover:text-brand-gold-700 hover:underline"
                  >
                    {doc.titulo}
                  </a>
                  <p className="flex items-center gap-1.5 truncate text-xs text-ink-soft">
                    <span className="truncate font-mono">{doc.fileName}</span>
                    <span>· {formatFileSize(doc.size)}</span>
                    {doc.conteudoIndexado && (
                      <FileSearch
                        className="h-3.5 w-3.5 shrink-0 text-brand-gold-700"
                        aria-label={t('documents:table.indexed')}
                      />
                    )}
                  </p>
                  {doc.tags.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {doc.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => onTagClick(tag)}
                          className="rounded-full border border-dashed border-border px-2 py-0.5 font-mono text-[10px] text-ink-soft transition-colors duration-fast hover:border-brand-gold-500 hover:text-brand-gold-700"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-muted">
                    {t('documents:table.uploadedBy', {
                      name: doc.uploadedByName,
                      date: formatDate(doc.createdAt),
                    })}
                  </p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" size="sm">
                {CENTRAL_DOCUMENT_CATEGORY_LABELS[doc.categoria]}
              </Badge>
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {doc.validade === 'SEM_VALIDADE' ? (
                <span className="text-xs text-ink-soft">{t('documents:table.noExpiry')}</span>
              ) : (
                <div className="space-y-1">
                  <Badge variant={VALIDITY_BADGE[doc.validade]} size="sm">
                    {t(`documents:validity.${doc.validade}` as never)}
                  </Badge>
                  <p className="text-xs tabular-nums text-ink-soft">
                    {formatDateOnly(doc.validoAte)}
                  </p>
                </div>
              )}
            </TableCell>
            <TableCell className="text-xs text-ink-soft">
              {doc.contractId && doc.contractNumero && (
                <Link
                  to={routeTo.contract(doc.contractId)}
                  className="block font-mono hover:text-brand-gold-700 hover:underline"
                >
                  {doc.contractNumero}
                </Link>
              )}
              {doc.supplierId && doc.supplierName && (
                <Link
                  to={routeTo.supplier(doc.supplierId)}
                  className="block hover:text-brand-gold-700 hover:underline"
                >
                  {doc.supplierName}
                </Link>
              )}
              {!doc.contractId && !doc.supplierId && '—'}
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-0.5">
                <RowAction
                  label={t('documents:actions.download')}
                  tooltip={t('documents:actions.download')}
                  onClick={() => window.open(`${API_ORIGIN}${doc.url}`, '_blank', 'noopener')}
                >
                  <Download className="h-4 w-4" />
                </RowAction>
                {canManage(doc) && (
                  <>
                    <RowAction
                      label={t('common:actions.edit')}
                      tooltip={t('common:actions.edit')}
                      onClick={() => onEdit(doc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </RowAction>
                    <RowAction
                      label={t('common:actions.remove')}
                      tooltip={t('common:actions.remove')}
                      onClick={() => onRemove(doc)}
                      className="text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </RowAction>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
