/**
 * O multer 1.x entrega `originalname` decodificado como latin1, o que
 * corrompe acentos ("relatório.pdf" vira "relatÃ³rio.pdf"). Reinterpreta
 * como UTF-8 — se o resultado tiver caractere inválido, mantém o original.
 */
export function decodeUploadName(originalName: string): string {
  const decoded = Buffer.from(originalName, "latin1").toString("utf8");
  return decoded.includes("�") ? originalName : decoded;
}
