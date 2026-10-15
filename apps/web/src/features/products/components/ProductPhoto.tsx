import { useId, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, ImageOff, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { PHOTO_ACCEPT, uploadUrl } from '@/utils/image';
import { useProductPhoto } from '../hooks/useProductMutations';

interface ProductPhotoProps {
  productId: string;
  photoUrl?: string | null;
  canEdit: boolean;
}

/** Foto do produto no catálogo — aparece nas solicitações quando o item não tem foto própria. */
export function ProductPhoto({ productId, photoUrl, canEdit }: ProductPhotoProps) {
  const { t } = useTranslation('products');
  const inputId = useId();
  const mutation = useProductPhoto(productId);
  const shown = uploadUrl(photoUrl);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) mutation.mutate(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-white">
        {mutation.isPending ? (
          <Loader2 className="h-6 w-6 animate-spin text-ink-soft" aria-hidden="true" />
        ) : shown ? (
          <img src={shown} alt={t('products:photo.alt')} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-6 w-6 text-ink-soft" aria-hidden="true" />
        )}
      </div>
      {canEdit && (
        <div className="flex flex-col items-start gap-1">
          <Button type="button" size="sm" variant="outline" asChild>
            <label htmlFor={inputId} className="cursor-pointer">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              {shown ? t('products:photo.change') : t('products:photo.add')}
            </label>
          </Button>
          <input
            id={inputId}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            onChange={handleFile}
            disabled={mutation.isPending}
          />
          {shown && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              leftIcon={<X className="h-3.5 w-3.5" />}
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(null)}
            >
              {t('products:photo.remove')}
            </Button>
          )}
          <span className="text-2xs text-ink-soft">{t('products:photo.hint')}</span>
        </div>
      )}
    </div>
  );
}
