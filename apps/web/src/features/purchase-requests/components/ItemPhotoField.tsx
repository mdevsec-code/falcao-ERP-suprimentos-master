import { useId, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Camera, ImageOff, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/services/http/errors';
import { PHOTO_ACCEPT, resizePhoto, uploadUrl } from '@/utils/image';
import { purchaseRequestsApi } from '../services/purchaseRequests.api';

interface ItemPhotoFieldProps {
  /** Foto já enviada para o item (caminho/endereço devolvidos pela API). */
  photoPath?: string;
  photoUrl?: string;
  /** Foto do produto do catálogo — aparece quando o item não tem a própria. */
  productPhotoUrl?: string | null;
  onChange: (photo: { path: string; url: string } | null) => void;
}

/**
 * Foto do item: no celular dá para tirar na hora ou escolher da galeria; a imagem é reduzida no navegador e
 * enviada na hora — o item guarda só o caminho.
 */
export function ItemPhotoField({
  photoPath,
  photoUrl,
  productPhotoUrl,
  onChange,
}: ItemPhotoFieldProps) {
  const { t } = useTranslation('purchaseRequests');
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const shown = photoPath ? uploadUrl(photoUrl) : uploadUrl(productPhotoUrl);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const photo = await purchaseRequestsApi.uploadItemPhoto(await resizePhoto(file));
      onChange(photo);
    } catch (error) {
      toast.error(getErrorMessage(error, t('purchaseRequests:photo.uploadError')));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-ink-soft">
        {t('purchaseRequests:photo.label')}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-ink-soft" aria-hidden="true" />
          ) : shown ? (
            <img
              src={shown}
              alt={t('purchaseRequests:photo.alt')}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff className="h-5 w-5 text-ink-soft" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-col items-start gap-1">
          <Button type="button" size="sm" variant="outline" asChild>
            <label htmlFor={inputId} className="cursor-pointer">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              {photoPath ? t('purchaseRequests:photo.change') : t('purchaseRequests:photo.add')}
            </label>
          </Button>
          <input
            id={inputId}
            type="file"
            accept={PHOTO_ACCEPT}
            className="sr-only"
            onChange={(event) => void handleFile(event)}
            disabled={uploading}
          />
          {photoPath && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              leftIcon={<X className="h-3.5 w-3.5" />}
              onClick={() => onChange(null)}
            >
              {t('purchaseRequests:photo.remove')}
            </Button>
          )}
          {!photoPath && productPhotoUrl && (
            <span className="text-2xs text-ink-soft">
              {t('purchaseRequests:photo.fromCatalog')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
