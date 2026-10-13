import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import type { IStorageProvider, StoredFile } from "./storage-provider.interface";
import { isAllowedUpload, uploadExtension } from "./upload-policy";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly root: string;

  constructor(private readonly config: ConfigService) {
    this.root = resolve(this.config.get<string>("UPLOADS_DIR") ?? "./uploads");
  }

  async save(buffer: Buffer, options: { folder: string; fileName: string }): Promise<StoredFile> {
    if (!isAllowedUpload(options.fileName)) {
      throw new BadRequestException("Tipo de arquivo não permitido.");
    }

    // A pasta vem de ids da URL — nunca deixe sair da raiz de uploads.
    const dir = this.insideRoot(options.folder);
    await mkdir(dir, { recursive: true });

    const uniqueName = `${randomUUID()}${uploadExtension(options.fileName)}`;
    const absolutePath = join(dir, uniqueName);
    const relativePath = relative(this.root, absolutePath).split(sep).join("/");

    await writeFile(absolutePath, buffer);

    return {
      path: relativePath,
      url: `/uploads/${relativePath}`,
      size: buffer.length,
    };
  }

  async delete(path: string): Promise<void> {
    await unlink(this.insideRoot(path)).catch(() => undefined);
  }

  /** Resolve `path` dentro da raiz; recusa `..`, caminhos absolutos e afins. */
  private insideRoot(path: string): string {
    const target = resolve(this.root, path);
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new BadRequestException("Caminho de arquivo inválido.");
    }
    return target;
  }
}
