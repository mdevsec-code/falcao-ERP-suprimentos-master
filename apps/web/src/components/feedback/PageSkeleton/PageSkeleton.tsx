import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Esqueleto de página de detalhe: mesmo recorte do `PageHeader` + bloco de
 * conteúdo, para o layout não "pular" quando os dados chegam.
 */
export function PageSkeleton({ tiles = 6 }: { tiles?: number }) {
  return (
    <>
      <div className="space-y-3 border-b border-border px-6 py-7 sm:px-8">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="space-y-6 px-6 py-8 sm:px-8">
        <Skeleton className="h-10 w-80 max-w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: tiles }).map((_, idx) => (
            <Skeleton key={idx} className="h-[76px] w-full" />
          ))}
        </div>
      </div>
    </>
  );
}
