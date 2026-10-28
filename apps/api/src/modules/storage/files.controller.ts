import { Controller, ForbiddenException, Get, Inject, NotFoundException, Query, Req, Res } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { stat } from "node:fs/promises";
import { Public } from "../../common/decorators/public.decorator";
import { FILE_URL_TTL_SECONDS, isValidFileSignature } from "../../common/utils/file-url";
import { STORAGE_PROVIDER, type IStorageProvider } from "./storage-provider.interface";
import { INLINE_UPLOAD_EXTENSIONS, uploadExtension } from "./upload-policy";

/**
 * Entrega os arquivos enviados pelo link temporário (`fileUrl`). Não pede login
 * — `<img>` e `<a>` do navegador não mandam o token —, mas só abre com a
 * assinatura válida e dentro da validade; quem recebeu o link passou pela regra
 * de acesso do registro na API. Substitui o antigo `/uploads` público.
 */
@Public()
@Throttle({ default: { limit: 600, ttl: 60_000 } })
@Controller("files")
export class FilesController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: IStorageProvider) {}

  @Get("*")
  async download(
    @Req() request: Request,
    @Res() response: Response,
    @Query("e") expiresAt?: string,
    @Query("s") signature?: string,
  ): Promise<void> {
    // O Express já decodifica o caminho; a assinatura cobre exatamente este texto.
    const path = (request.params as Record<string, string>)[0] ?? "";
    if (!path || !isValidFileSignature(path, expiresAt, signature)) {
      throw new ForbiddenException("Link do arquivo inválido ou expirado. Abra o arquivo de novo pelo sistema.");
    }
    const absolute = this.storage.localPath(path);
    const info = await stat(absolute).catch(() => null);
    if (!info?.isFile()) throw new NotFoundException("Arquivo não encontrado.");

    // Arquivos enviados por usuários: nunca deixe o navegador "adivinhar" o tipo
    // nem executar conteúdo; o que não é PDF/imagem/texto vira download.
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("Cache-Control", `private, max-age=${Math.min(3600, FILE_URL_TTL_SECONDS)}`);
    if (!INLINE_UPLOAD_EXTENSIONS.has(uploadExtension(absolute))) {
      response.setHeader("Content-Disposition", "attachment");
      response.setHeader("Content-Security-Policy", "sandbox");
    }
    response.sendFile(absolute, { dotfiles: "deny" });
  }
}
