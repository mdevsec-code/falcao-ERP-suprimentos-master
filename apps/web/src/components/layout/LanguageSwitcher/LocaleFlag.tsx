import { type Locale } from '@/constants/i18n';
import { cn } from '@/utils/cn';

/**
 * Bandeira do idioma em SVG. Emoji de bandeira não existe no Windows (vira
 * "BR", "US", "CN" em letras soltas), então desenhamos as três aqui.
 * Decorativa: o nome do idioma sempre aparece ao lado.
 */
export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      aria-hidden="true"
      className={cn(
        'h-3.5 w-5 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10',
        className,
      )}
    >
      {locale === 'pt-BR' && (
        <>
          <rect width="24" height="16" fill="#009C3B" />
          <path d="M12 2.2 21.4 8 12 13.8 2.6 8Z" fill="#FFDF00" />
          <circle cx="12" cy="8" r="3.4" fill="#002776" />
          <path d="M8.7 7.3c2.2-.5 4.6-.2 6.5.9" stroke="#fff" strokeWidth=".6" fill="none" />
        </>
      )}
      {locale === 'en-US' && (
        <>
          <rect width="24" height="16" fill="#fff" />
          {[0, 2, 4, 6, 8, 10, 12].map((i) => (
            <rect key={i} y={(i * 16) / 13} width="24" height={16 / 13} fill="#B22234" />
          ))}
          <rect width="10.4" height={(16 / 13) * 7} fill="#3C3B6E" />
        </>
      )}
      {locale === 'zh-CN' && (
        <>
          <rect width="24" height="16" fill="#DE2910" />
          <path
            d="m4.8 2.2.86 2.64h2.78l-2.25 1.63.86 2.64-2.25-1.63-2.25 1.63.86-2.64L1.16 4.84h2.78Z"
            fill="#FFDE00"
          />
          {[
            [9, 1.6],
            [10.6, 3.4],
            [10.6, 5.8],
            [9, 7.6],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r=".7" fill="#FFDE00" />
          ))}
        </>
      )}
    </svg>
  );
}
