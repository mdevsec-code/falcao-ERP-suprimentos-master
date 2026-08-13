import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  PORT: z.coerce.number().default(3333),
  JWT_SECRET: z.string().min(10, "JWT_SECRET é obrigatório"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET é obrigatório"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  UPLOADS_DIR: z.string().default("./uploads"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Variáveis de ambiente inválidas:\n${parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  return parsed.data;
}
