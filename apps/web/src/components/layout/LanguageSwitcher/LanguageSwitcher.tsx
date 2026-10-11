import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Globe } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { LOCALES, localeFlags, localeLabels, type Locale } from '@/constants/i18n';
import { cn } from '@/utils/cn';

interface LanguageSwitcherProps {
  /** Estilo compacto (ícone apenas) — usado na Topbar. Padrão: `true`. */
  iconOnly?: boolean;
  className?: string;
}

export function LanguageSwitcher({ iconOnly = true, className }: LanguageSwitcherProps): ReactNode {
  const { t, i18n } = useTranslation('common');
  const current = (i18n.resolvedLanguage ?? i18n.language ?? 'pt-BR') as Locale;
  const currentLocale: Locale = LOCALES.includes(current) ? current : 'pt-BR';

  function handleSelect(locale: Locale): void {
    if (locale === currentLocale) return;
    void i18n.changeLanguage(locale);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {iconOnly ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('languageSwitcher.selectLanguage')}
            className={className}
          >
            <Globe className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={cn('gap-1.5', className)}>
            <Globe className="h-3.5 w-3.5" />
            <span aria-hidden="true">{localeFlags[currentLocale]}</span>
            {localeLabels[currentLocale]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onSelect={() => handleSelect(locale)}>
            <span aria-hidden="true">{localeFlags[locale]}</span>
            <span className="flex-1">{localeLabels[locale]}</span>
            {currentLocale === locale && (
              <Check className="h-3.5 w-3.5 shrink-0 text-brand-gold-700" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
