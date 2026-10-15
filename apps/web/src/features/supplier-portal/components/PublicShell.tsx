import type { ReactNode } from 'react';
import { LinkIcon } from 'lucide-react';

import { FalcaoLogo } from '@/assets/logo/FalcaoLogo';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Skeleton } from '@/components/ui/Skeleton';
import { brand } from '@/config/brand';

interface PublicShellProps {
  /** Subtítulo do cabeçalho ("Portal de cotação", "Envio de catálogo"…). */
  portal: string;
  children: ReactNode;
}

/** Moldura das páginas públicas do fornecedor (sem login): marca, idioma e tema. */
export function PublicShell({ portal, children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <FalcaoLogo className="h-9 w-9" />
            <div>
              <p className="font-display text-base font-semibold text-ink">{brand.name}</p>
              <p className="text-2xs uppercase tracking-[0.14em] text-ink-soft">{portal}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

export function PublicLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function PublicInvalidLink({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
      <LinkIcon className="mx-auto h-8 w-8 text-ink-soft" aria-hidden="true" />
      <h1 className="mt-3 font-display text-xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{description}</p>
    </div>
  );
}
