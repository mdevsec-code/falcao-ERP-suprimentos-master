import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Check,
  KeyRound,
  Languages,
  Mail,
  Moon,
  Save,
  Sun,
  UserRound,
} from 'lucide-react';
import { MIN_PASSWORD_LENGTH } from '@falcao-erp/shared-types';

import { LocaleFlag } from '@/components/layout/LanguageSwitcher/LocaleFlag';
import { BlueprintBackdrop } from '@/components/brand/BlueprintBackdrop';
import { CornerBrackets } from '@/components/brand/CornerBrackets';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { LOCALES, localeLabels, localeShortLabels, type Locale } from '@/constants/i18n';
import { ROLE_LABELS } from '@/constants/roles';
import { formatDate, getInitials } from '@/utils/format';
import { cn } from '@/utils/cn';
import { newPasswordSchema, requiredText } from '@/validators/common';
import i18n from '@/i18n';

import { useChangePassword, useProfile, useUpdateProfileName } from '../hooks/useProfile';
import { passwordStrength } from '../lib/passwordStrength';
import { WechatCard } from '../components/WechatCard';

const nameSchema = z.object({ name: requiredText(3, 120) });
type NameInput = z.infer<typeof nameSchema>;

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, i18n.t('validation:required')),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: i18n.t('validation:passwordMismatch'),
    path: ['confirmPassword'],
  });
type PasswordInput = z.infer<typeof passwordFormSchema>;

const STRENGTH_TONE = ['bg-border', 'bg-danger', 'bg-warning', 'bg-brand-gold-500', 'bg-success'];

export function ProfilePage() {
  const { t, i18n: i18nInstance } = useTranslation('profile');
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const profile = useProfile();
  const updateName = useUpdateProfileName();
  const changePassword = useChangePassword();

  const current = (i18nInstance.resolvedLanguage ?? i18nInstance.language) as Locale;
  const currentLocale: Locale = LOCALES.includes(current) ? current : 'pt-BR';

  const nameForm = useForm<NameInput>({
    resolver: zodResolver(nameSchema),
    mode: 'onTouched',
    defaultValues: { name: user?.name ?? '' },
  });

  useEffect(() => {
    if (user?.name) nameForm.reset({ name: user.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só quando o nome da sessão muda
  }, [user?.name]);

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordFormSchema),
    mode: 'onTouched',
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control: passwordForm.control, name: 'newPassword' });
  const strength = passwordStrength(newPassword ?? '');

  if (!user) return null;

  return (
    <div className="pb-10">
      {/* ───────── Capa ───────── */}
      <section className="relative overflow-hidden border-b border-border bg-bg">
        <BlueprintBackdrop registrationMarks={false} />
        <div className="relative flex flex-col gap-6 px-6 pb-8 pt-10 sm:flex-row sm:items-end sm:px-8">
          <div className="relative animate-scale-in">
            <Avatar className="h-24 w-24 shadow-lg ring-4 ring-surface">
              <AvatarFallback className="font-display text-3xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <span
              aria-hidden="true"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-gold-500 text-white ring-4 ring-bg"
            >
              <UserRound className="h-3.5 w-3.5" />
            </span>
          </div>
          <div
            className="min-w-0 animate-slide-up space-y-2"
            style={{ animationDelay: '80ms', animationFillMode: 'backwards' }}
          >
            <p className="flex items-center gap-3 font-mono text-2xs uppercase tracking-[0.22em] text-brand-gold-700">
              <span className="h-px w-8 bg-brand-gold-500" aria-hidden="true" />
              {t('profile:page.eyebrow')}
            </p>
            <h1 className="truncate font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
              <Badge variant="brand" size="sm">
                {ROLE_LABELS[user.role]}
              </Badge>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {user.companyName}
              </span>
              {profile.data && (
                <span className="font-mono text-2xs uppercase tracking-[0.14em] text-muted">
                  {t('profile:page.memberSince', { date: formatDate(profile.data.createdAt) })}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          {/* Dados pessoais */}
          <Card
            className="animate-slide-up"
            style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
          >
            <CardHeader>
              <CardTitle className="text-base">{t('profile:personal.title')}</CardTitle>
              <CardDescription>{t('profile:personal.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={nameForm.handleSubmit((data) => updateName.mutate(data.name))}
                noValidate
                className="space-y-4"
              >
                <Input
                  {...nameForm.register('name')}
                  label={t('profile:personal.name')}
                  error={nameForm.formState.errors.name?.message}
                  required
                />
                <Input
                  value={user.email}
                  label={t('profile:personal.email')}
                  hint={t('profile:personal.emailHint')}
                  disabled
                  readOnly
                  name="email"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    leftIcon={<Save className="h-3.5 w-3.5" />}
                    isLoading={updateName.isPending}
                    disabled={!nameForm.formState.isDirty}
                  >
                    {t('profile:personal.save')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card
            className="animate-slide-up"
            style={{ animationDelay: '180ms', animationFillMode: 'backwards' }}
          >
            <CardHeader>
              <CardTitle className="text-base">{t('profile:preferences.title')}</CardTitle>
              <CardDescription>{t('profile:preferences.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700">
                    {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {t('profile:preferences.darkTheme')}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {t('profile:preferences.darkThemeHint')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggle}
                  aria-label={t('profile:preferences.darkTheme')}
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-gold-50 text-brand-gold-700">
                    <Languages className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-ink">
                    {t('profile:preferences.language')}
                  </p>
                </div>
                <div
                  role="radiogroup"
                  aria-label={t('profile:preferences.language')}
                  className="flex flex-wrap gap-2"
                >
                  {LOCALES.map((locale) => {
                    const selected = locale === currentLocale;
                    return (
                      <button
                        key={locale}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => void i18nInstance.changeLanguage(locale)}
                        className={cn(
                          'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors duration-fast',
                          'focus:outline-none focus-visible:shadow-focus',
                          selected
                            ? 'border-brand-gold-500 bg-brand-gold-50 text-brand-gold-900'
                            : 'border-border text-ink hover:bg-hover',
                        )}
                      >
                        <LocaleFlag locale={locale} />
                        <span title={localeLabels[locale]}>{localeShortLabels[locale]}</span>
                        {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avisos no WeChat */}
          <WechatCard />
        </div>

        {/* Segurança */}
        <div
          className="relative h-fit animate-slide-up rounded-xl border border-border bg-surface p-6 shadow-sm"
          style={{ animationDelay: '240ms', animationFillMode: 'backwards' }}
        >
          <CornerBrackets />
          <div className="mb-5 space-y-1">
            <p className="font-mono text-2xs uppercase tracking-[0.22em] text-muted">
              {t('profile:security.eyebrow')}
            </p>
            <h2 className="font-display text-xl font-semibold text-ink">
              {t('profile:security.title')}
            </h2>
            <p className="text-sm text-ink-soft">{t('profile:security.description')}</p>
          </div>

          <form
            onSubmit={passwordForm.handleSubmit((data) =>
              changePassword.mutate(
                { currentPassword: data.currentPassword, newPassword: data.newPassword },
                { onSuccess: () => passwordForm.reset() },
              ),
            )}
            noValidate
            className="space-y-4"
          >
            <Input
              {...passwordForm.register('currentPassword')}
              type="password"
              autoComplete="current-password"
              label={t('profile:security.currentPassword')}
              leftIcon={<KeyRound className="h-4 w-4" />}
              error={passwordForm.formState.errors.currentPassword?.message}
              required
            />
            <div className="space-y-2">
              <Input
                {...passwordForm.register('newPassword')}
                type="password"
                autoComplete="new-password"
                label={t('profile:security.newPassword')}
                error={passwordForm.formState.errors.newPassword?.message}
                required
              />
              <div aria-live="polite">
                <div className="flex gap-1" aria-hidden="true">
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={cn(
                        'h-1 flex-1 rounded-full transition-colors duration-base',
                        strength >= level ? STRENGTH_TONE[strength] : 'bg-border',
                      )}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {newPassword
                    ? t(`profile:security.strength.${strength}` as never)
                    : t('profile:security.requirement', { count: MIN_PASSWORD_LENGTH })}
                </p>
              </div>
            </div>
            <Input
              {...passwordForm.register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              label={t('profile:security.confirmPassword')}
              error={passwordForm.formState.errors.confirmPassword?.message}
              required
            />
            <p className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-ink-soft">
              {t('profile:security.notice')}
            </p>
            <Button type="submit" variant="primary" fullWidth isLoading={changePassword.isPending}>
              {t('profile:security.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
