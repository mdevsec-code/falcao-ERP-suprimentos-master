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
  Scale,
  FileText,
  Wallet,
  ReceiptText,
  CalendarDays,
  FileStack,
  UserCog,
  ScrollText,
  X,
  type LucideIcon,
  BookOpen,
  Layers,
  PenLine,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';
import { getInitials } from '@/utils/format';
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
  requires?: Permission;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'sidebar.overview',
    items: [{ label: 'nav.dashboard', to: ROUTE_PATHS.DASHBOARD, icon: LayoutDashboard }],
  },
  {
    title: 'sidebar.supplies',
    items: [
      {
        label: 'nav.suppliers',
        to: ROUTE_PATHS.FORNECEDORES,
        icon: Truck,
        requires: PERMISSIONS.SUPPLIER_READ,
      },
      {
        label: 'nav.products',
        to: ROUTE_PATHS.PRODUTOS,
        icon: Boxes,
        requires: PERMISSIONS.PRODUCT_READ,
      },
      {
        label: 'nav.purchaseRequests',
        to: ROUTE_PATHS.SOLICITACOES,
        icon: ShoppingCart,
        requires: PERMISSIONS.PURCHASE_REQUEST_READ,
      },
      {
        label: 'nav.approvals',
        to: ROUTE_PATHS.APROVACOES,
        icon: ClipboardCheck,
        requires: PERMISSIONS.APPROVALS_READ,
      },
      {
        label: 'nav.plans',
        to: ROUTE_PATHS.PLANOS,
        icon: Layers,
        requires: PERMISSIONS.QUOTATION_READ,
      },
      {
        label: 'nav.quotations',
        to: ROUTE_PATHS.COTACOES,
        icon: Scale,
        requires: PERMISSIONS.QUOTATION_READ,
      },
      {
        label: 'nav.catalogs',
        to: ROUTE_PATHS.CATALOGOS,
        icon: BookOpen,
        requires: PERMISSIONS.QUOTATION_READ,
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
        requires: PERMISSIONS.CONTRACT_READ,
      },
      {
        label: 'nav.finance',
        to: ROUTE_PATHS.FINANCEIRO,
        icon: Wallet,
        requires: PERMISSIONS.FINANCE_READ,
      },
      {
        label: 'nav.reimbursements',
        to: ROUTE_PATHS.REEMBOLSOS,
        icon: ReceiptText,
      },
    ],
  },
  {
    title: 'sidebar.organization',
    items: [
      { label: 'nav.agenda', to: ROUTE_PATHS.AGENDA, icon: CalendarDays },
      { label: 'nav.documents', to: ROUTE_PATHS.DOCUMENTOS, icon: FileStack },
    ],
  },
  {
    title: 'sidebar.admin',
    items: [
      {
        label: 'nav.users',
        to: ROUTE_PATHS.USUARIOS,
        icon: UserCog,
        requires: PERMISSIONS.USERS_MANAGE,
      },
      {
        label: 'nav.approvers',
        to: ROUTE_PATHS.APROVADORES,
        icon: PenLine,
        requires: PERMISSIONS.USERS_MANAGE,
      },
      {
        label: 'nav.audit',
        to: ROUTE_PATHS.AUDITORIA,
        icon: ScrollText,
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
              'bg-rail text-rail-text shadow-lg focus:outline-none',
              'data-[state=closed]:animate-slide-out-left data-[state=open]:animate-slide-in-left',
            )}
          >
            <DialogPrimitive.Title className="sr-only">{t('app.shortName')}</DialogPrimitive.Title>
            <SidebarBody isCompact={false} onNavigate={onNavigate} />
            <DialogPrimitive.Close
              className="absolute right-3 top-5 rounded-md p-1.5 text-rail-text-soft hover:bg-rail-surface hover:text-rail-text focus:outline-none focus-visible:shadow-focus"
              aria-label={t('actions.close')}
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <aside
      aria-label={mainNavAriaLabel}
      className={cn(
        'relative flex h-full min-h-0 flex-col bg-rail text-rail-text',
        isCompact ? 'w-[72px]' : 'w-64',
        'transition-[width] duration-slow ease-out',
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
  const { can, user } = useAuth();

  // Itens sem permissão somem da navegação (em vez de aparecerem desabilitados).
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.requires || can(item.requires)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      {/* Malha da prancha esmaecendo para baixo — textura, não conteúdo. */}
      <div
        aria-hidden="true"
        className="blueprint-grid-gold pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_55%)]"
      />
      {/* Fio dourado na borda direita, mais forte no topo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-brand-gold-300/50 via-rail-border to-rail-border"
      />

      <div
        className={cn(
          'relative flex items-center gap-3 px-4 pb-4 pt-5',
          isCompact && 'justify-center px-2',
        )}
      >
        <FalcaoLogo
          className="h-9 w-auto shrink-0"
          bgClassName="rounded-md bg-neutral-0 p-1 shadow-glow"
        />
        {!isCompact && (
          <div className="min-w-0 animate-fade-in">
            <p className="truncate font-display text-base font-semibold leading-tight text-rail-text">
              {t('app.shortName')}
            </p>
            <p className="truncate font-mono text-2xs uppercase tracking-[0.18em] text-brand-gold-300">
              {t('branding.supplies')}
            </p>
          </div>
        )}
      </div>

      <nav className="scrollbar-rail relative flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-5">
          {sections.map((section) => (
            <li key={section.title}>
              {isCompact ? (
                <div aria-hidden="true" className="mx-auto mb-2 h-px w-6 bg-rail-border" />
              ) : (
                <p className="mb-1.5 flex items-center gap-2 px-3 font-mono text-2xs uppercase tracking-[0.14em] text-rail-text-soft">
                  {t(section.title as never)}
                  <span aria-hidden="true" className="h-px flex-1 bg-rail-border" />
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
          'relative flex items-center gap-3 border-t border-rail-border px-4 py-3',
          isCompact && 'justify-center px-2',
        )}
      >
        {user && (
          <span
            aria-hidden="true"
            title={isCompact ? user.name : undefined}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-300 text-2xs font-bold text-accent-900"
          >
            {getInitials(user.name)}
          </span>
        )}
        {!isCompact && (
          <div className="min-w-0 flex-1">
            {user && <p className="truncate text-xs font-semibold text-rail-text">{user.name}</p>}
            <p className="truncate font-mono text-2xs text-rail-text-soft">
              {t('footer.version', { version: brand.version })}
            </p>
          </div>
        )}
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
  const { icon: Icon, label, to } = item;
  const { t } = useTranslation('common');

  const labelText = t(label as never);

  return (
    <NavLink
      to={to}
      end={to === ROUTE_PATHS.DASHBOARD}
      onClick={onNavigate}
      title={compact ? labelText : undefined}
      aria-label={compact ? labelText : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
          'transition-colors duration-fast focus:outline-none focus-visible:shadow-focus',
          compact && 'justify-center px-2',
          isActive
            ? 'text-rail-text'
            : 'text-rail-text-soft hover:bg-rail-surface hover:text-rail-text',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-md bg-gradient-to-r from-brand-gold-300/[0.16] to-brand-gold-300/[0.03] ring-1 ring-inset ring-brand-gold-300/20"
              transition={{ type: 'spring', stiffness: 500, damping: 34, mass: 0.9 }}
            >
              {/* Trilho dourado: o marcador da etapa atual na prancha. */}
              <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-gold-300 shadow-glow" />
            </motion.span>
          )}
          <Icon
            className={cn(
              'relative h-4 w-4 shrink-0 transition-transform duration-base ease-spring',
              isActive
                ? 'animate-pop-in text-brand-gold-300'
                : 'group-hover:translate-x-0.5 group-hover:text-rail-text',
            )}
            aria-hidden="true"
          />
          {!compact && <span className="relative flex-1 truncate">{labelText}</span>}
        </>
      )}
    </NavLink>
  );
}
