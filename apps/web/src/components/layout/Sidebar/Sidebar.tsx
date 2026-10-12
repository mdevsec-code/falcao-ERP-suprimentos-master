import { type ReactNode, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Truck,
  Boxes,
  ShoppingCart,
  ClipboardCheck,
  FileText,
  Wallet,
  ReceiptText,
  CalendarDays,
  FileStack,
  UserCog,
  ScrollText,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { FalcaoLogo } from '@/assets/logo/FalcaoLogo';
import { useUIStore } from '@/store/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { brand } from '@/config/brand';
import { ROUTE_PATHS } from '@/constants/routes';
import { PERMISSIONS, type Permission } from '@/constants/permissions';

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  enabled: boolean;
  requires?: Permission;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'sidebar.overview',
    items: [
      { label: 'nav.dashboard', to: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard, enabled: true },
    ],
  },
  {
    title: 'sidebar.supplies',
    items: [
      {
        label: 'nav.suppliers',
        to: ROUTE_PATHS.FORNECEDORES,
        icon: Truck,
        enabled: true,
        requires: PERMISSIONS.SUPPLIER_READ,
      },
      {
        label: 'nav.products',
        to: ROUTE_PATHS.PRODUTOS,
        icon: Boxes,
        enabled: true,
        requires: PERMISSIONS.PRODUCT_READ,
      },
      {
        label: 'nav.purchaseRequests',
        to: ROUTE_PATHS.SOLICITACOES,
        icon: ShoppingCart,
        enabled: true,
        requires: PERMISSIONS.PURCHASE_REQUEST_READ,
      },
      {
        label: 'nav.approvals',
        to: ROUTE_PATHS.APROVACOES,
        icon: ClipboardCheck,
        enabled: true,
        requires: PERMISSIONS.APPROVALS_READ,
      },
    ],
  },
  {
    title: 'sidebar.contractsFinance',
    items: [
      {
        label: 'nav.contracts',
        to: ROUTE_PATHS.CONTRATOS,
        icon: FileText,
        enabled: true,
        requires: PERMISSIONS.CONTRACT_READ,
      },
      {
        label: 'nav.finance',
        to: ROUTE_PATHS.FINANCEIRO,
        icon: Wallet,
        enabled: true,
        requires: PERMISSIONS.FINANCE_READ,
      },
      {
        label: 'nav.reimbursements',
        to: ROUTE_PATHS.REEMBOLSOS,
        icon: ReceiptText,
        enabled: true,
      },
    ],
  },
  {
    title: 'sidebar.organization',
    items: [
      { label: 'nav.agenda', to: ROUTE_PATHS.AGENDA, icon: CalendarDays, enabled: true },
      { label: 'nav.documents', to: ROUTE_PATHS.DOCUMENTOS, icon: FileStack, enabled: true },
    ],
  },
  {
    title: 'sidebar.admin',
    items: [
      {
        label: 'nav.users',
        to: ROUTE_PATHS.USUARIOS,
        icon: UserCog,
        enabled: true,
        requires: PERMISSIONS.USERS_MANAGE,
      },
      {
        label: 'nav.audit',
        to: ROUTE_PATHS.AUDITORIA,
        icon: ScrollText,
        enabled: true,
        requires: PERMISSIONS.AUDIT_READ,
      },
    ],
  },
];

export function Sidebar(): ReactNode {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isCompact = isDesktop && collapsed;
  const { t } = useTranslation('common');
  const mainNavAriaLabel = t('sidebar.mainNavAriaLabel');
  const { pathname } = useLocation();

  // Fecha o drawer automaticamente ao navegar (evita ficar aberto sobre a nova página).
  useEffect(() => {
    if (!isDesktop) setMobileNavOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const onNavigate = !isDesktop ? () => setMobileNavOpen(false) : undefined;

  if (!isDesktop) {
    return (
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-0 z-modal-backdrop bg-neutral-900/50 backdrop-blur-sm',
              'data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in',
            )}
          />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              'fixed inset-y-0 left-0 z-modal flex h-full w-72 max-w-[85vw] flex-col',
              'border-r border-border bg-surface shadow-lg focus:outline-none',
              'data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left',
            )}
          >
            <DialogPrimitive.Title className="sr-only">{t('app.shortName')}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              className="absolute right-3 top-3 rounded-md p-1.5 text-ink-soft hover:bg-hover hover:text-ink focus:outline-none focus-visible:shadow-focus"
              aria-label={t('actions.close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
            <SidebarBody isCompact={false} onNavigate={onNavigate} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <aside
      aria-label={mainNavAriaLabel}
      className={cn(
        'flex h-full min-h-0 flex-col border-r border-border bg-surface',
        isCompact ? 'w-[68px]' : 'w-64',
        'transition-[width] duration-base ease-out',
      )}
    >
      <SidebarBody isCompact={isCompact} />
    </aside>
  );
}

interface SidebarBodyProps {
  isCompact: boolean;
  onNavigate?: () => void;
}

function SidebarBody({ isCompact, onNavigate }: SidebarBodyProps): ReactNode {
  const { t } = useTranslation('common');
  const { can } = useAuth();

  // Itens sem permissão somem da navegação (em vez de aparecerem
  // desabilitados) — "Em breve" fica reservado para módulos que ainda
  // não existem, para não sugerir que o usuário vai ganhar acesso.
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.requires || can(item.requires)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2.5 border-b border-border px-4 py-4',
          isCompact && 'justify-center px-2',
        )}
      >
        <FalcaoLogo className="h-9 w-auto shrink-0" bgClassName="rounded-md bg-neutral-0 p-1" />
        {!isCompact && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{t('app.shortName')}</p>
            <p className="truncate text-2xs uppercase tracking-wider text-ink-soft">
              {t('branding.supplies')}
            </p>
          </div>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-5">
          {sections.map((section) => (
            <li key={section.title}>
              {!isCompact && (
                <p className="mb-1.5 px-3 font-mono text-2xs uppercase tracking-[0.12em] text-ink-soft">
                  {t(section.title as never)}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <SidebarLink item={item} compact={isCompact} onNavigate={onNavigate} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className={cn(
          'border-t border-border px-4 py-3 text-2xs text-ink-soft',
          isCompact && 'px-2 text-center',
        )}
      >
        {isCompact
          ? `v${brand.version.split('.').slice(0, 2).join('.')}`
          : t('footer.version', { version: brand.version })}
      </div>
    </>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  compact: boolean;
  onNavigate?: () => void;
}

function SidebarLink({ item, compact, onNavigate }: SidebarLinkProps): ReactNode {
  const { icon: Icon, label, to, enabled } = item;
  const { t } = useTranslation('common');

  const baseClasses = cn(
    'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium',
    'transition-colors duration-fast',
    compact && 'justify-center px-2',
  );

  const labelText = t(label as never);

  if (!enabled) {
    return (
      <div
        aria-disabled="true"
        className={cn(baseClasses, 'cursor-not-allowed text-ink-soft opacity-70')}
        title={compact ? `${labelText} · ${t('sidebar.comingSoon')}` : t('sidebar.comingSoon')}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {!compact && (
          <>
            <span className="flex-1 truncate">{labelText}</span>
            <Badge variant="outline" size="sm" className="text-2xs">
              {t('sidebar.comingSoon')}
            </Badge>
          </>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end={to === ROUTE_PATHS.DASHBOARD}
      onClick={onNavigate}
      title={compact ? labelText : undefined}
      className={({ isActive }) =>
        cn(baseClasses, 'relative', isActive ? 'text-brand-gold-900' : 'text-ink hover:bg-hover')
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-md bg-brand-gold-50"
              transition={{ type: 'spring', stiffness: 500, damping: 34, mass: 0.9 }}
            />
          )}
          <Icon
            className={cn(
              'relative h-4 w-4 shrink-0',
              isActive ? 'text-brand-gold-700' : 'text-ink-soft',
            )}
            aria-hidden="true"
          />
          {!compact && <span className="relative flex-1 truncate">{labelText}</span>}
        </>
      )}
    </NavLink>
  );
}
