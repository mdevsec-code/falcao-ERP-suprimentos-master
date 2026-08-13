import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { IStorageProvider, StoredFile } from "./storage-provider.interface";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly root: string;

  constructor(private readonly config: ConfigService) {
    this.root = this.config.get<string>("UPLOADS_DIR") ?? "./uploads";
  }

  async save(buffer: Buffer, options: { folder: string; fileName: string }): Promise<StoredFile> {
    const dir = join(this.root, options.folder);
    await mkdir(dir, { recursive: true });

    const uniqueName = `${randomUUID()}${extname(options.fileName)}`;
    const relativePath = join(options.folder, uniqueName).replace(/\\/g, "/");
    const absolutePath = join(this.root, relativePath);

    await writeFile(absolutePath, buffer);

    return {
      path: relativePath,
      url: `/uploads/${relativePath}`,
      size: buffer.length,
    };
  }

  async delete(path: string): Promise<void> {
    await unlink(join(this.root, path)).catch(() => undefined);
  }
}
