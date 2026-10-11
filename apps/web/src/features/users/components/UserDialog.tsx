import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MIN_PASSWORD_LENGTH, Role } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { ALL_ROLES, ROLE_LABELS } from '@/constants/roles';
import {
  createUserSchema,
  editUserSchema,
  toEditInput,
  type CreateUserInput,
  type EditUserInput,
  type UserSummaryDto,
} from '../types';

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` = criar; um usuário = editar. */
  editingUser: UserSummaryDto | null;
  /** O próprio admin não pode trocar o próprio perfil nem se desativar. */
  isSelf: boolean;
  onCreate: (input: CreateUserInput) => void;
  onUpdate: (input: EditUserInput) => void;
  isSubmitting: boolean;
}

export function UserDialog({
  open,
  onOpenChange,
  editingUser,
  isSelf,
  onCreate,
  onUpdate,
  isSubmitting,
}: UserDialogProps) {
  const { t } = useTranslation('users');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? t('users:dialog.editTitle') : t('users:dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {editingUser
              ? t('users:dialog.editDescription', { email: editingUser.email })
              : t('users:dialog.createDescription')}
          </DialogDescription>
        </DialogHeader>

        {editingUser ? (
          <EditForm
            key={editingUser.id}
            open={open}
            user={editingUser}
            isSelf={isSelf}
            onSubmit={onUpdate}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        ) : (
          <CreateForm
            open={open}
            onSubmit={onCreate}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FormProps<T> {
  open: boolean;
  onSubmit: (input: T) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function CreateForm({ open, onSubmit, onCancel, isSubmitting }: FormProps<CreateUserInput>) {
  const { t } = useTranslation('users');
  const empty: CreateUserInput = { name: '', email: '', role: Role.REQUESTER, password: '' };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    mode: 'onTouched',
    defaultValues: empty,
  });

  useEffect(() => {
    if (open) reset(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `empty` é recriado a cada render
  }, [open, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        {...register('name')}
        label={t('users:form.name')}
        placeholder={t('users:form.namePlaceholder')}
        error={errors.name?.message}
        required
      />
      <Input
        {...register('email')}
        type="email"
        autoComplete="off"
        label={t('users:form.email')}
        placeholder={t('users:form.emailPlaceholder')}
        hint={t('users:form.emailHint')}
        error={errors.email?.message}
        required
      />
      <RoleSelect control={control} error={errors.role?.message} />
      <Input
        {...register('password')}
        type="password"
        autoComplete="new-password"
        label={t('users:form.initialPassword')}
        hint={t('users:form.passwordHint', { count: MIN_PASSWORD_LENGTH })}
        error={errors.password?.message}
        required
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {t('users:dialog.submitCreate')}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface EditFormProps extends FormProps<EditUserInput> {
  user: UserSummaryDto;
  isSelf: boolean;
}

function EditForm({ open, user, isSelf, onSubmit, onCancel, isSubmitting }: EditFormProps) {
  const { t } = useTranslation('users');
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    mode: 'onTouched',
    defaultValues: toEditInput(user),
  });

  useEffect(() => {
    if (open) reset(toEditInput(user));
  }, [open, user, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input
        {...register('name')}
        label={t('users:form.name')}
        error={errors.name?.message}
        required
      />
      <RoleSelect
        control={control}
        error={errors.role?.message}
        disabled={isSelf}
        hint={isSelf ? t('users:form.selfRoleHint') : undefined}
      />
      <Controller
        control={control}
        name="isActive"
        render={({ field }) => (
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
            <div>
              <Label htmlFor="user-active">{t('users:form.active')}</Label>
              <p className="text-xs text-ink-soft">
                {isSelf ? t('users:form.selfActiveHint') : t('users:form.activeHint')}
              </p>
            </div>
            <Switch
              id="user-active"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSelf}
            />
          </div>
        )}
      />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {t('common:actions.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {t('users:dialog.submitEdit')}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface RoleSelectProps {
  // `Control` genérico: serve aos dois formulários (ambos têm o campo `role`).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  error?: string;
  disabled?: boolean;
  hint?: string;
}

function RoleSelect({ control, error, disabled, hint }: RoleSelectProps) {
  const { t } = useTranslation('users');
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="user-role" required>
        {t('users:form.role')}
      </Label>
      <Controller
        control={control}
        name="role"
        render={({ field }) => (
          <Select value={field.value as string} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id="user-role" className={error ? 'border-danger' : undefined}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        <p className="text-xs text-ink-soft">{hint ?? t('users:form.roleHint')}</p>
      )}
    </div>
  );
}
