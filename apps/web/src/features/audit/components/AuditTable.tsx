import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import type { AuditAction } from '@falcao-erp/shared-types';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { AUDIT_ACTION_LABELS } from '@/constants/enums';
import { formatDateTime, relativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { entityLabel, type AuditLogEntryDto } from '../types';

const ACTION_BADGE_VARIANT: Record<AuditAction, BadgeVariant> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'danger',
};

interface AuditTableProps {
  rows: readonly AuditLogEntryDto[];
  isFetching?: boolean;
}

/** Trilha de auditoria; cada linha expande para mostrar o snapshot gravado. */
export function AuditTable({ rows, isFetching }: AuditTableProps) {
  const { t } = useTranslation('audit');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" aria-hidden="true" />
          <TableHead>{t('audit:table.when')}</TableHead>
          <TableHead>{t('audit:table.who')}</TableHead>
          <TableHead>{t('audit:table.action')}</TableHead>
          <TableHead>{t('audit:table.entity')}</TableHead>
          <TableHead>{t('audit:table.record')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((entry) => {
          const isOpen = expanded === entry.id;
          const hasSnapshot = entry.changes?.after !== undefined;
          return (
            <Fragment key={entry.id}>
              <TableRow className={cn(isOpen && 'bg-hover')}>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : entry.id)}
                    disabled={!hasSnapshot}
                    aria-expanded={isOpen}
                    aria-label={isOpen ? t('audit:table.collapse') : t('audit:table.expand')}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-ink-soft hover:bg-hover hover:text-ink disabled:opacity-30"
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-base',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <p className="text-ink">{relativeTime(entry.createdAt)}</p>
                  <p className="text-xs text-ink-soft">{formatDateTime(entry.createdAt)}</p>
                </TableCell>
                <TableCell>
                  <p className="font-medium text-ink">{entry.userName}</p>
                  <p className="text-xs text-ink-soft">{entry.userEmail}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={ACTION_BADGE_VARIANT[entry.action]} size="sm">
                    {AUDIT_ACTION_LABELS[entry.action]}
                  </Badge>
                </TableCell>
                <TableCell className="text-ink">{entityLabel(entry.entityType)}</TableCell>
                <TableCell>
                  <code className="font-mono text-xs text-ink-soft" title={entry.entityId}>
                    {snapshotTitle(entry) ?? `${entry.entityId.slice(0, 8)}…`}
                  </code>
                </TableCell>
              </TableRow>
              {isOpen && hasSnapshot && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="bg-bg/60">
                    <p className="mb-2 font-mono text-2xs uppercase tracking-[0.12em] text-brand-gold-700">
                      {t('audit:table.snapshot')}
                    </p>
                    <pre className="scrollbar-thin max-h-80 animate-fade-in overflow-auto rounded-md border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-ink-soft">
                      {JSON.stringify(entry.changes?.after, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** Nome legível do registro a partir do snapshot (nome fantasia, título, nome…), se houver. */
function snapshotTitle(entry: AuditLogEntryDto): string | null {
  const after = entry.changes?.after;
  if (!after || typeof after !== 'object') return null;
  const record = after as Record<string, unknown>;
  for (const key of ['nomeFantasia', 'title', 'nome', 'name']) {
    const value = record[key];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}
