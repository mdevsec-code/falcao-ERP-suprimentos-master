import { extname } from "node:path";

/**
 * Extensões aceitas em qualquer upload. Fica de fora tudo que o navegador
 * executaria ao abrir o arquivo servido por `/uploads` (HTML, SVG, JS…) —
 * um anexo malicioso viraria XSS armazenado.
 */
export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".heic",
  ".txt",
  ".csv",
  ".md",
  ".json",
  ".xml",
  ".log",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".odt",
  ".ods",
  ".dwg",
  ".dxf",
  ".zip",
]);

/** Abertos direto no navegador; o resto vai como download (`Content-Disposition: attachment`). */
export const INLINE_UPLOAD_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".txt"]);

export function uploadExtension(fileName: string): string {
  return extname(fileName).toLowerCase();
}

export function isAllowedUpload(fileName: string): boolean {
  return ALLOWED_UPLOAD_EXTENSIONS.has(uploadExtension(fileName));
}

/** Limite de qualquer upload (anexos, documentos, notas fiscais). */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
