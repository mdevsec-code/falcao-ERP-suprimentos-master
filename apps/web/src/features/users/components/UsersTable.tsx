import { useTranslation } from 'react-i18next';
import { KeyRound, Pencil, Power } from 'lucide-react';
import type { Role } from '@falcao-erp/shared-types';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { RowAction } from '@/components/common/RowAction';
import { ROLE_LABELS } from '@/constants/roles';
import { formatDate, getInitials } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { UserSummaryDto } from '../types';

const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant> = {
  ADMIN: 'brand',
  MANAGER: 'accent',
  BUYER: 'info',
  FINANCE: 'info',
  WAREHOUSE: 'neutral',
  REQUESTER: 'outline',
  AUDITOR: 'warning',
};

interface UsersTableProps {
  rows: readonly UserSummaryDto[];
  currentUserId?: string;
  isFetching?: boolean;
  onEdit: (user: UserSummaryDto) => void;
  onResetPassword: (user: UserSummaryDto) => void;
  onToggleActive: (user: UserSummaryDto) => void;
}

export function UsersTable({
  rows,
  currentUserId,
  isFetching,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UsersTableProps) {
  const { t } = useTranslation('users');

  return (
    <Table className={cn('transition-opacity duration-base', isFetching && 'opacity-60')}>
      <TableHeader>
        <TableRow>
          <TableHead>{t('users:table.user')}</TableHead>
          <TableHead>{t('users:table.role')}</TableHead>
          <TableHead>{t('users:table.status')}</TableHead>
          <TableHead>{t('users:table.createdAt')}</TableHead>
          <TableHead className="text-right">{t('users:table.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id} className={cn(!user.isActive && 'opacity-70')}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 font-mono text-2xs uppercase tracking-wider text-brand-gold-700">
                          {t('users:table.you')}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-soft">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={ROLE_BADGE_VARIANT[user.role]} size="sm">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'success' : 'neutral'} size="sm">
                  {user.isActive ? t('common:status.active') : t('common:status.inactive')}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-ink-soft">
                {formatDate(user.createdAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <RowAction
                    label={t('users:table.editAria', { name: user.name })}
                    tooltip={t('common:actions.edit')}
                    onClick={() => onEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </RowAction>
                  <RowAction
                    label={t('users:table.resetPasswordAria', { name: user.name })}
                    tooltip={t('users:actions.resetPassword')}
                    onClick={() => onResetPassword(user)}
                  >
                    <KeyRound className="h-4 w-4" />
                  </RowAction>
                  <RowAction
                    label={
                      user.isActive
                        ? t('users:table.deactivateAria', { name: user.name })
                        : t('users:table.reactivateAria', { name: user.name })
                    }
                    tooltip={
                      isSelf
                        ? t('users:table.cannotDeactivateSelf')
                        : user.isActive
                          ? t('users:actions.deactivate')
                          : t('users:actions.reactivate')
                    }
                    onClick={() => onToggleActive(user)}
                    disabled={isSelf}
                    className={user.isActive ? 'text-danger hover:text-danger' : 'text-success'}
                  >
                    <Power className="h-4 w-4" />
                  </RowAction>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
