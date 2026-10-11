import { config } from "dotenv";
// `.env` do app primeiro; depois o da raiz do monorepo (onde o README manda criar).
config({ path: [".env", "../../.env"] });
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
