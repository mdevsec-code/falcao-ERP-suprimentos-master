import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { BlueprintBackdrop } from '@/components/brand/BlueprintBackdrop';
import { CornerBrackets } from '@/components/brand/CornerBrackets';
import { PipelineDiagram } from '@/components/brand/PipelineDiagram';
import { TitleBlock } from '@/components/brand/TitleBlock';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { FalcaoLogo } from '@/assets/logo/FalcaoLogo';
import { brand } from '@/config/brand';
import { formatDate } from '@/utils/format';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginInput } from '../types';
import { ROUTE_PATHS } from '@/constants/routes';

interface LocationState {
  from?: string;
}

/** Entrada escalonada: cada bloco sobe um pouco depois do anterior. */
function stagger(ms: number) {
  return { animationDelay: `${ms}ms`, animationFillMode: 'backwards' as const };
}

export function LoginPage(): ReactNode {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated } = useAuth();
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const steps = t('auth:login.pipeline.steps', { returnObjects: true }) as string[];

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
  const issuedAt = useMemo(() => formatDate(new Date()) ?? '', []);

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
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <BlueprintBackdrop spotlight />

      {/* ───────── Barra superior ───────── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-10 sm:py-6">
        <div className="flex animate-fade-in items-center gap-3">
          <FalcaoLogo
            className="h-9 w-auto"
            bgClassName="rounded-md bg-white p-1 shadow-sm ring-1 ring-border"
          />
          <div className="leading-tight">
            <p className="font-display text-lg font-semibold text-ink">{brand.shortName}</p>
            <p className="font-mono text-2xs uppercase tracking-[0.2em] text-brand-gold-700">
              {t('common:branding.supplies')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* ───────── Conteúdo ───────── */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-20 pt-4 sm:px-10 lg:min-h-[calc(100vh-8rem)] lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pt-0">
        {/* Esquerda: manifesto + fluxo */}
        <section className="space-y-8" aria-labelledby="login-headline">
          <div className="space-y-5">
            <p
              className="flex animate-slide-up items-center gap-3 font-mono text-2xs uppercase tracking-[0.22em] text-brand-gold-700"
              style={stagger(40)}
            >
              <span className="h-px w-8 bg-brand-gold-500" aria-hidden="true" />
              {t('auth:login.hero.eyebrow')}
            </p>
            <h1
              id="login-headline"
              className="animate-slide-up font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl xl:text-6xl"
              style={stagger(100)}
            >
              {t('auth:login.hero.titleStart')}{' '}
              <span className="relative whitespace-nowrap italic text-brand-gold-700">
                {t('auth:login.hero.titleAccent')}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 300 12"
                  preserveAspectRatio="none"
                  className="absolute -bottom-1 left-0 h-2.5 w-full"
                >
                  <path
                    d="M2 8 C 80 2, 180 2, 298 7"
                    fill="none"
                    stroke="rgb(var(--color-brand-gold-300))"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="300"
                    className="animate-draw-line"
                    style={{ ['--dash' as string]: 300, animationDelay: '600ms' }}
                  />
                </svg>
              </span>
            </h1>
            <p className="max-w-lg animate-slide-up text-base text-ink-soft" style={stagger(160)}>
              {t('auth:login.hero.description')}
            </p>
          </div>

          <figure
            className="relative hidden animate-slide-up rounded-lg border border-dashed border-border bg-surface/50 px-5 pb-4 pt-7 backdrop-blur-sm sm:block"
            style={stagger(240)}
          >
            <figcaption className="absolute -top-2.5 left-4 bg-bg px-2 font-mono text-2xs uppercase tracking-[0.2em] text-muted">
              {t('auth:login.pipeline.caption')}
            </figcaption>
            <PipelineDiagram steps={steps} />
          </figure>

          <TitleBlock
            className="hidden max-w-sm animate-slide-up lg:grid"
            rows={[
              { label: t('auth:login.titleBlock.project'), value: brand.name },
              {
                label: t('auth:login.titleBlock.sheet'),
                value: t('auth:login.titleBlock.sheetValue'),
              },
              { label: t('auth:login.titleBlock.revision'), value: `v${brand.version}` },
              { label: t('auth:login.titleBlock.issued'), value: issuedAt },
            ]}
          />
        </section>

        {/* Direita: formulário */}
        <section
          className="relative mx-auto w-full max-w-md animate-scale-in lg:mx-0"
          style={stagger(120)}
          aria-labelledby="login-title"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
            style={{
              background:
                'radial-gradient(60% 55% at 50% 40%, rgb(var(--color-brand-gold-300) / 0.18), transparent 70%)',
            }}
          />
          <div className="relative rounded-xl border border-border bg-surface/90 p-7 shadow-lg backdrop-blur-md sm:p-9">
            <CornerBrackets />

            <div className="mb-7 space-y-2">
              <p className="font-mono text-2xs uppercase tracking-[0.22em] text-muted">
                {t('auth:login.formEyebrow')}
              </p>
              <h2 id="login-title" className="font-display text-3xl font-semibold text-ink">
                {t('auth:login.title')}
              </h2>
              <p className="text-sm text-ink-soft">{t('auth:login.subtitle')}</p>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-5">
              <div className="animate-slide-up" style={stagger(220)}>
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

              <div className="animate-slide-up" style={stagger(270)}>
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
                style={stagger(320)}
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

              <div className="animate-slide-up pt-1" style={stagger(370)}>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  rightIcon={
                    !isSubmitting ? (
                      <ArrowRight className="h-4 w-4 transition-transform duration-base group-hover:translate-x-0.5" />
                    ) : undefined
                  }
                  className="group"
                >
                  {t('auth:login.actions.submit')}
                </Button>
              </div>
            </form>

            <div className="mt-7 flex items-center gap-2 border-t border-dashed border-border pt-4 text-xs text-ink-soft">
              <ShieldCheck
                className="h-3.5 w-3.5 shrink-0 text-brand-gold-700"
                aria-hidden="true"
              />
              <span>{t('auth:login.compliance')}</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex flex-col items-center justify-between gap-1 px-5 pb-6 font-mono text-2xs uppercase tracking-[0.14em] text-muted sm:flex-row sm:px-10 lg:absolute lg:inset-x-0 lg:bottom-0">
        <span>{brand.copyright}</span>
        <span className="hidden sm:inline">{t('auth:login.footerTag')}</span>
      </footer>
    </div>
  );
}

export default LoginPage;
