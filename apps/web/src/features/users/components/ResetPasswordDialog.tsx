import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '@falcao-erp/shared-types';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { resetPasswordSchema, type ResetPasswordInput, type UserSummaryDto } from '../types';

interface ResetPasswordDialogProps {
  user: UserSummaryDto | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (password: string) => void;
  isSubmitting: boolean;
}

export function ResetPasswordDialog({
  user,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: ResetPasswordDialogProps) {
  const { t } = useTranslation('users');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) reset({ password: '', confirmPassword: '' });
  }, [user, reset]);

  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users:resetDialog.title')}</DialogTitle>
          <DialogDescription>
            {user && (
              <Trans
                i18nKey="users:resetDialog.description"
                values={{ name: user.name }}
                components={{ strong: <strong className="text-ink" /> }}
              />
            )}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((data) => onSubmit(data.password))}
          noValidate
          className="space-y-4"
        >
          <Input
            {...register('password')}
            type="password"
            autoComplete="new-password"
            label={t('users:resetDialog.newPassword')}
            leftIcon={<KeyRound className="h-4 w-4" />}
            hint={t('users:form.passwordHint', { count: MIN_PASSWORD_LENGTH })}
            error={errors.password?.message}
            required
          />
          <Input
            {...register('confirmPassword')}
            type="password"
            autoComplete="new-password"
            label={t('users:resetDialog.confirmPassword')}
            error={errors.confirmPassword?.message}
            required
          />
          <p className="rounded-md border border-brand-gold-100 bg-brand-gold-50 px-3 py-2 text-xs text-brand-gold-900">
            {t('users:resetDialog.sessionsNotice')}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('users:resetDialog.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
