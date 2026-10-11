import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { GlobalSearch } from './GlobalSearch';
import { useUIStore } from '@/store/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROUTE_PATHS, ROUTE_NAV_KEYS } from '@/constants/routes';
import { ROLE_LABELS } from '@/constants/roles';
import { getInitials } from '@/utils/format';
import { cn } from '@/utils/cn';

interface Crumb {
  label: string;
  href: string;
}

/**
 * Trilha de navegação a partir da URL: o primeiro segmento vira o nome do
 * módulo (`/fornecedores` → "Fornecedores") e os seguintes viram "Novo",
 * "Editar" ou "Detalhes" (ids não são legíveis, então não aparecem crus).
 */
function useBreadcrumb(): Crumb[] {
  const { pathname } = useLocation();
  const { t } = useTranslation('common');
  const segments = pathname.split('/').filter(Boolean);
  const [first, ...rest] = segments;
  if (!first) return [];

  const base = `/${first}`;
  const navKey = ROUTE_NAV_KEYS[base];
  const crumbs: Crumb[] = [{ label: navKey ? t(`nav.${navKey}` as never) : first, href: base }];

  let href = base;
  for (const segment of rest) {
    href += `/${segment}`;
    const label =
      segment === 'novo'
        ? t('breadcrumb.new')
        : segment === 'editar'
          ? t('breadcrumb.edit')
          : t('breadcrumb.details');
    crumbs.push({ label, href });
  }
  return crumbs;
}

export function Topbar(): ReactNode {
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const crumbs = useBreadcrumb();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const toggleMobileNav = useUIStore((s) => s.toggleMobileNav);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { user, isAuthenticated, signOut } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  async function handleSignOut(): Promise<void> {
    await signOut();
    navigate(ROUTE_PATHS.LOGIN);
  }

  if (!isDesktop && mobileSearchOpen) {
    return (
      <header className="sticky top-0 z-sticky flex items-center gap-2 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md">
        <div className="flex-1">
          <GlobalSearch focusOnMount />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSearchOpen(false)}
          aria-label={t('topbar.closeSearch')}
        >
          <X className="h-4 w-4" />
        </Button>
      </header>
    );
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-sticky flex items-center gap-3 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-md sm:px-6',
      )}
    >
      {isDesktop ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? t('topbar.expandMenu') : t('topbar.collapseMenu')}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileNav}
          aria-label={t('topbar.openMenu')}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      <nav aria-label={t('breadcrumb.ariaLabel')} className="hidden min-w-0 sm:block">
        <ol className="flex items-center gap-1.5 text-sm text-ink-soft">
          <li>
            <Link to={ROUTE_PATHS.DASHBOARD} className="hover:text-ink">
              {t('nav.home')}
            </Link>
          </li>
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <li key={c.href} className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden="true" className="text-muted">
                  /
                </span>
                {isLast ? (
                  <span aria-current="page" className="truncate font-medium text-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link to={c.href} className="truncate hover:text-ink">
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <span className="font-display text-base font-semibold text-ink sm:hidden">Falcão</span>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden w-72 lg:block 2xl:w-96">
          <GlobalSearch />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileSearchOpen(true)}
          aria-label={t('actions.search')}
        >
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('topbar.notifications')}>
              <Bell className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>{t('topbar.notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <p className="px-2 py-6 text-center text-sm text-ink-soft">
              {t('topbar.noNotifications')}
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

        <LanguageSwitcher />

        <ThemeToggle />

        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleSignOut()}
            leftIcon={<LogOut className="h-4 w-4" />}
            aria-label={t('topbar.signOut')}
            className="hidden md:inline-flex"
          >
            <span className="hidden xl:inline">{t('topbar.signOut')}</span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('topbar.account')}
              className="ml-1 rounded-full focus:outline-none focus-visible:shadow-focus"
            >
              <Avatar>
                <AvatarFallback>{getInitials(user?.name ?? 'Falcão')}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-2">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-soft">{user?.email}</p>
              {user && (
                <p className="mt-1 truncate text-2xs uppercase tracking-wider text-brand-gold-700">
                  {ROLE_LABELS[user.role]} · {user.companyName}
                </p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(ROUTE_PATHS.PERFIL)}>
              <UserRound className="h-4 w-4" />
              {t('topbar.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleSignOut()}>
              <LogOut className="h-4 w-4" />
              {t('topbar.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
