import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { CheckCircle2, CircleOff, Plus, ShieldCheck, Users } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { StatTile } from '@/components/data-display/StatTile';
import { CountUp } from '@/components/data-display/CountUp';
import { Pagination } from '@/components/data-display/Pagination';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';

import { useUserStats, useUsers } from '../hooks/useUsers';
import { useCreateUser, useResetUserPassword, useUpdateUser } from '../hooks/useUserMutations';
import { FiltersBar } from '../components/FiltersBar';
import { UsersTable } from '../components/UsersTable';
import { UserDialog } from '../components/UserDialog';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import type { UserFilters, UserSummaryDto } from '../types';

const PAGE_SIZE = 10;

export function UsersPage() {
  const { t } = useTranslation('users');
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<UserFilters>({});
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(filters.busca, 300);

  const stats = useUserStats();
  const list = useUsers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: filters.role,
    isActive: filters.status ? filters.status === 'active' : undefined,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummaryDto | null>(null);
  const [resetTarget, setResetTarget] = useState<UserSummaryDto | null>(null);
  const [toggleTarget, setToggleTarget] = useState<UserSummaryDto | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPassword = useResetUserPassword();

  function handleFilterChange(patch: Partial<UserFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }

  function handleClearAll() {
    setFilters({});
    setPage(1);
  }

  function openCreate() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEdit(user: UserSummaryDto) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  const rows = list.data?.data ?? [];
  const hasFilters = Boolean(filters.busca || filters.role || filters.status);
  const admins = stats.data?.byRole.find((r) => r.role === 'ADMIN')?.count ?? 0;

  return (
    <>
      <PageHeader
        eyebrow={t('users:page.eyebrow')}
        title={t('users:page.title')}
        description={t('users:page.description')}
        actions={
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t('users:actions.new')}
          </Button>
        }
      />

      <div className="space-y-8 px-6 py-8 sm:px-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.isLoading &&
            Array.from({ length: 4 }).map((_, idx) => (
              <Skeleton key={idx} className="h-[112px] w-full" />
            ))}
          {stats.data && (
            <>
              <StatTile
                label={t('users:kpi.total')}
                value={<CountUp value={stats.data.total} />}
                icon={<Users className="h-4 w-4" />}
              />
              <StatTile
                label={t('users:kpi.active')}
                value={<CountUp value={stats.data.active} />}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <StatTile
                label={t('users:kpi.inactive')}
                value={<CountUp value={stats.data.total - stats.data.active} />}
                icon={<CircleOff className="h-4 w-4" />}
              />
              <StatTile
                label={t('users:kpi.admins')}
                value={<CountUp value={admins} />}
                icon={<ShieldCheck className="h-4 w-4" />}
              />
            </>
          )}
        </section>

        <Separator />

        <FiltersBar filters={filters} onChange={handleFilterChange} onClearAll={handleClearAll} />

        {list.isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full" />
            ))}
          </div>
        )}

        {list.isError && (
          <ErrorState
            title={t('users:error.title')}
            description={t('users:error.description')}
            action={
              <Button variant="outline" onClick={() => void list.refetch()}>
                {t('common:actions.retry')}
              </Button>
            }
          />
        )}

        {list.data && rows.length === 0 && (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title={t('users:empty.title')}
            description={t('users:empty.description')}
            action={
              hasFilters ? (
                <Button variant="outline" onClick={handleClearAll}>
                  {t('common:filters.clearAll')}
                </Button>
              ) : undefined
            }
          />
        )}

        {list.data && rows.length > 0 && (
          <div className="space-y-4">
            <UsersTable
              rows={rows}
              currentUserId={currentUser?.id}
              isFetching={list.isFetching && !list.isLoading}
              onEdit={openEdit}
              onResetPassword={setResetTarget}
              onToggleActive={setToggleTarget}
            />
            <Pagination
              page={list.data.meta.page}
              pageSize={list.data.meta.pageSize}
              total={list.data.meta.total}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingUser={editingUser}
        isSelf={editingUser?.id === currentUser?.id}
        isSubmitting={createUser.isPending || updateUser.isPending}
        onCreate={(input) => createUser.mutate(input, { onSuccess: () => setDialogOpen(false) })}
        onUpdate={(patch) =>
          editingUser &&
          updateUser.mutate(
            { id: editingUser.id, patch },
            { onSuccess: () => setDialogOpen(false) },
          )
        }
      />

      <ResetPasswordDialog
        user={resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        isSubmitting={resetPassword.isPending}
        onSubmit={(password) =>
          resetTarget &&
          resetPassword.mutate(
            { id: resetTarget.id, password },
            { onSuccess: () => setResetTarget(null) },
          )
        }
      />

      <ConfirmDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={
          toggleTarget?.isActive
            ? t('users:confirm.deactivateTitle')
            : t('users:confirm.reactivateTitle')
        }
        description={
          <Trans
            i18nKey={
              toggleTarget?.isActive
                ? 'users:confirm.deactivateDescription'
                : 'users:confirm.reactivateDescription'
            }
            values={{ name: toggleTarget?.name ?? '' }}
            components={{ strong: <strong className="text-ink" /> }}
          />
        }
        destructive={toggleTarget?.isActive}
        confirmLabel={
          toggleTarget?.isActive ? t('users:actions.deactivate') : t('users:actions.reactivate')
        }
        isSubmitting={updateUser.isPending}
        onConfirm={() =>
          toggleTarget &&
          updateUser.mutate(
            { id: toggleTarget.id, patch: { isActive: !toggleTarget.isActive } },
            { onSuccess: () => setToggleTarget(null) },
          )
        }
      />
    </>
  );
}

export default UsersPage;
