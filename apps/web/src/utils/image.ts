import { API_ORIGIN } from '@/config/env';

/** Tipos que o navegador desenha e o servidor aceita como foto. */
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Reduz a foto (celular tira 4000 px / 5 MB) para no máximo `maxSize` px no
 * lado maior, em JPEG — sobe rápido na internet da obra e pesa pouco no disco
 * e no PDF. Se o navegador não conseguir desenhar, devolve o arquivo original.
 */
export async function resizePhoto(file: File, maxSize = 1600, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    // Fundo branco: PNG transparente vira JPEG sem fundo preto.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** Endereço completo de um arquivo enviado (`/uploads/…` fica na API). */
export function uploadUrl(path: string | null | undefined): string | null {
  return path ? `${API_ORIGIN}${path}` : null;
}

/**
 * Baixa uma imagem e devolve em data URL JPEG, reduzida (para embutir no PDF).
 * `null` se não der para baixar — o documento sai sem a foto, não quebra.
 */
export async function imageDataUrl(url: string, maxSize = 400): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const bitmap = await createImageBitmap(await response.blob());
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}
