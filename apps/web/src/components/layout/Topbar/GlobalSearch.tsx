import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Boxes, Search, Truck } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { useDebounce } from '@/hooks/useDebounce';
import { useSuppliers } from '@/features/suppliers/hooks/useSuppliers';
import { useProducts } from '@/features/products/hooks/useProducts';
import { routeTo } from '@/constants/routes';
import { formatCNPJ } from '@/utils/format';

const MAX_RESULTS = 5;
const MIN_QUERY_LENGTH = 2;

interface GlobalSearchProps {
  /** Foca o campo ao montar — só use após uma ação explícita do usuário (ex.: abrir a busca mobile). */
  focusOnMount?: boolean;
}

/**
 * Busca global da Topbar: fornecedores e produtos, direto na API (com
 * debounce). Atalho `Ctrl/⌘ + K` foca o campo.
 */
export function GlobalSearch({ focusOnMount }: GlobalSearchProps = {}) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus();
  }, [focusOnMount]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const debouncedQuery = useDebounce(query, 250);
  const q = debouncedQuery.trim();
  const enabled = q.length >= MIN_QUERY_LENGTH;
  const showResults = isOpen && enabled;

  const suppliers = useSuppliers({ search: q, page: 1, pageSize: MAX_RESULTS }, { enabled });
  const products = useProducts({ search: q, page: 1, pageSize: MAX_RESULTS }, { enabled });

  const supplierResults = enabled ? (suppliers.data?.data ?? []) : [];
  const productResults = enabled ? (products.data?.data ?? []) : [];
  const isFetching = suppliers.isFetching || products.isFetching;
  const hasResults = supplierResults.length > 0 || productResults.length > 0;

  function reset() {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function goTo(path: string) {
    reset();
    navigate(path);
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') reset();
        }}
        placeholder={t('search.placeholder')}
        leftIcon={<Search className="h-4 w-4" />}
        rightIcon={
          isFetching && enabled ? (
            <Spinner size="sm" />
          ) : (
            <kbd className="hidden rounded border border-border bg-hover px-1.5 font-mono text-2xs text-ink-soft 2xl:inline-block">
              Ctrl K
            </kbd>
          )
        }
        aria-label={t('search.ariaLabel')}
        autoComplete="off"
      />

      {showResults && (
        <div className="absolute left-0 right-0 top-full z-dropdown mt-1 max-h-80 animate-scale-in overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
          {!hasResults && !isFetching && (
            <p className="px-3 py-3 text-sm text-ink-soft">
              {t('search.noResults', { query: debouncedQuery })}
            </p>
          )}

          {!hasResults && isFetching && (
            <p className="px-3 py-3 text-sm text-ink-soft">{t('search.searching')}</p>
          )}

          {supplierResults.length > 0 && (
            <div className="border-b border-border p-1 last:border-b-0">
              <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-ink-soft">
                {t('nav.suppliers')}
              </p>
              {supplierResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goTo(routeTo.supplier(s.id))}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-hover"
                >
                  <Truck className="h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-ink">{s.nomeFantasia}</span>
                  <span className="shrink-0 font-mono text-xs text-ink-soft">
                    {formatCNPJ(s.cnpj)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {productResults.length > 0 && (
            <div className="p-1">
              <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wide text-ink-soft">
                {t('nav.products')}
              </p>
              {productResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goTo(routeTo.product(p.id))}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-hover"
                >
                  <Boxes className="h-3.5 w-3.5 shrink-0 text-ink-soft" aria-hidden="true" />
                  <span className="shrink-0 font-mono text-xs font-semibold text-ink">
                    {p.codigo}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink-soft">{p.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
