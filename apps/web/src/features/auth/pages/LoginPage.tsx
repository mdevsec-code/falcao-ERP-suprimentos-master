import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, LogIn, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { FalcaoLogo } from '@/assets/logo/FalcaoLogo';
import falcaoMark from '@/assets/logo/falcao-mark.png';
import { brand } from '@/config/brand';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginInput } from '../types';
import { ROUTE_PATHS } from '@/constants/routes';

interface LocationState {
  from?: string;
}

export function LoginPage(): ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated } = useAuth();
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const sidePanelRoles = t('auth:login.sidePanel.roles', { returnObjects: true }) as string[];

  // Para onde ir depois de autenticar: a página que o usuário tentava
  // acessar antes de ser redirecionado ao login (`RequireAuth`), ou o
  // Dashboard se ele chegou aqui diretamente. Nunca volta para `/login`
  // (evita loop caso `from` aponte para a própria tela de login).
  const state = location.state as LocationState | null;
  const redirectTo =
    state?.from && state.from !== ROUTE_PATHS.LOGIN ? state.from : ROUTE_PATHS.DASHBOARD;

  const [credentialsError, setCredentialsError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  function handlePasswordKeyEvent(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(event.getModifierState('CapsLock'));
  }

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redirectTo é estável durante o ciclo de vida da tela de login
  }, [isAuthenticated, navigate]);

  async function attemptSignIn(email: string, password: string, rememberMe: boolean) {
    setCredentialsError(null);
    const result = await signIn(email, password, rememberMe);
    if (!result.ok) {
      setCredentialsError(result.error);
      toast.error(result.error);
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  const onSubmit = handleSubmit((data) =>
    attemptSignIn(data.email, data.password, data.rememberMe),
  );

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* ────────── Esquerda: painel decorativo (apenas ≥lg) ────────── */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900 to-brand-gold-900 p-10 lg:flex lg:flex-col lg:justify-between xl:p-12"
      >
        {/* Textura de grade sutil — dá profundidade sem competir com o conteúdo */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--color-neutral-0)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--color-neutral-0)) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        {/* Camadas de glow ambiente — cada uma deriva num ritmo diferente para sensação "viva" sem distrair */}
        <div
          className="pointer-events-none absolute -left-20 -top-20 h-[28rem] w-[28rem] animate-drift rounded-full opacity-70 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--color-brand-gold-500) / 0.28), transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-0 h-[24rem] w-[24rem] animate-drift-reverse rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--color-brand-gold-300) / 0.16), transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 animate-glow-pulse"
          style={{
            background:
              'radial-gradient(60% 50% at 30% 30%, rgb(var(--color-brand-gold-500) / 0.18), transparent 70%)',
          }}
        />

        {/* Vinheta — escurece as bordas para o conteúdo central respirar */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 100% at 50% 50%, transparent 55%, rgb(var(--color-neutral-900) / 0.35) 100%)',
          }}
        />

        <img
          src={falcaoMark}
          alt=""
          className="pointer-events-none absolute -bottom-16 -right-16 h-[26rem] w-auto animate-drift object-contain opacity-[0.07] grayscale invert"
        />

        <FalcaoLogo
          variant="wordmark"
          className="relative h-16 w-auto max-w-[280px] animate-fade-in drop-shadow-[0_0_24px_rgba(253,191,42,0.15)]"
          bgClassName="rounded-lg bg-white p-3 shadow-md ring-1 ring-black/5"
        />

        <div className="relative animate-slide-up space-y-4">
          <div className="space-y-2">
            <p className="font-display text-2xl font-semibold text-white">
              {t('auth:login.sidePanel.title')}
            </p>
            <p className="max-w-sm text-sm text-white/70">{t('auth:login.sidePanel.tagline')}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {sidePanelRoles.map((role, idx) => (
              <span
                key={role}
                className="animate-slide-up rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-2xs font-medium text-white/80 backdrop-blur-sm transition-colors hover:border-white/25 hover:bg-white/10"
                style={{ animationDelay: `${120 + idx * 60}ms`, animationFillMode: 'backwards' }}
              >
                {role}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-white/50">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>{t('auth:login.sidePanel.compliance')}</span>
          </div>
        </div>
      </aside>

      {/* ────────── Direita: formulário ────────── */}
      <main className="relative flex flex-col items-center justify-center overflow-hidden bg-bg px-4 py-10 sm:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-glow-pulse"
          style={{
            background:
              'radial-gradient(50% 40% at 50% 0%, rgb(var(--color-brand-gold-500) / 0.08), transparent 70%)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 animate-drift-reverse rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgb(var(--color-brand-gold-300) / 0.06), transparent 70%)',
          }}
        />

        <div className="absolute right-4 top-4 flex items-center gap-1 sm:right-6 sm:top-6">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        <div className="relative w-full max-w-md animate-scale-in">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-4 rounded-2xl opacity-60 blur-2xl"
            style={{
              background:
                'radial-gradient(60% 60% at 50% 40%, rgb(var(--color-brand-gold-500) / 0.12), transparent 70%)',
            }}
          />
          <Card className="relative overflow-hidden border-border shadow-lg">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-gold-300 via-brand-gold-500 to-brand-gold-300"
            />
            <CardHeader className="items-center text-center">
              <FalcaoLogo
                className="h-12 w-auto"
                bgClassName="rounded-md bg-white p-1.5 shadow-sm ring-1 ring-border"
              />
              <CardTitle className="mt-3">{t('auth:login.title')}</CardTitle>
              <CardDescription>{t('auth:login.subtitle')}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} noValidate className="space-y-4">
                <div
                  className="animate-slide-up"
                  style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}
                >
                  <Input
                    {...register('email')}
                    type="email"
                    label={t('auth:login.fields.email')}
                    placeholder={t('auth:login.fields.emailPlaceholder')}
                    autoComplete="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={errors.email?.message}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div
                  className="animate-slide-up"
                  style={{ animationDelay: '110ms', animationFillMode: 'backwards' }}
                >
                  <Input
                    {...register('password')}
                    type={showPwd ? 'text' : 'password'}
                    label={t('auth:login.fields.password')}
                    placeholder={t('auth:login.fields.passwordPlaceholder')}
                    autoComplete="current-password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    onKeyDown={handlePasswordKeyEvent}
                    onKeyUp={handlePasswordKeyEvent}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        aria-label={
                          showPwd
                            ? t('auth:login.actions.hidePassword')
                            : t('auth:login.actions.showPassword')
                        }
                        aria-pressed={showPwd}
                        className="text-ink-soft transition-colors hover:text-ink focus:outline-none focus-visible:text-ink"
                      >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    error={errors.password?.message}
                    disabled={isSubmitting}
                    required
                  />
                  {capsLockOn && (
                    <p className="mt-1.5 flex animate-slide-up items-center gap-1.5 text-xs text-warning">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {t('auth:login.fields.capsLockWarning')}
                    </p>
                  )}
                </div>

                <div
                  className="flex animate-slide-up items-center justify-between"
                  style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}
                >
                  <Label className="flex items-center gap-2 font-normal text-ink-soft">
                    <Controller
                      control={control}
                      name="rememberMe"
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                      )}
                    />
                    {t('auth:login.fields.rememberMe')}
                  </Label>

                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto px-0 text-xs"
                    onClick={() => toast.info(t('auth:login.actions.forgotPasswordUnavailable'))}
                  >
                    {t('auth:login.actions.forgotPassword')}
                  </Button>
                </div>

                {credentialsError && (
                  <p
                    role="alert"
                    className="animate-slide-up rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger"
                  >
                    {credentialsError}
                  </p>
                )}

                <div
                  className="animate-slide-up"
                  style={{ animationDelay: '210ms', animationFillMode: 'backwards' }}
                >
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    leftIcon={!isSubmitting ? <LogIn className="h-4 w-4" /> : undefined}
                  >
                    {t('auth:login.actions.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <p className="relative mt-6 text-2xs text-muted">{brand.copyright}</p>
      </main>
    </div>
  );
}

export default LoginPage;
