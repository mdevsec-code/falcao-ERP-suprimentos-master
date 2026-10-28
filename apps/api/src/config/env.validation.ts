import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),
  PORT: z.coerce.number().default(3333),
  /** Interface em que a API escuta. Em produção, atrás do Nginx: 127.0.0.1 (só o próprio servidor). */
  HOST: z.string().default("0.0.0.0"),
  JWT_SECRET: z.string().min(10, "JWT_SECRET é obrigatório"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string().min(10, "JWT_REFRESH_SECRET é obrigatório"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  UPLOADS_DIR: z.string().default("./uploads"),
  /** Uma ou mais origens do Web, separadas por vírgula (ex.: domínio da Hostinger + www). */
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  /**
   * Quantos proxies reversos ficam na frente da API (Nginx da Hostinger, ALB da AWS…).
   * Sem isso o limite por IP dos links públicos enxerga só o IP do proxy. 0 = acesso direto.
   */
  TRUST_PROXY: z.coerce.number().int().min(0).max(5).default(0),
  /** Endereço público do sistema — usado nos links dos e-mails (ex.: https://suprimentos.empresa.com.br). */
  APP_URL: z.string().url().optional(),
  /** SMTP para os e-mails de aprovação. Sem SMTP_HOST, nada é enviado (só fica no log). */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(465),
  /** `true` na porta 465 (SSL); `false` na 587 (STARTTLS). */
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  /** Remetente, ex.: "Falcão Suprimentos <suprimentos@empresa.com.br>". */
  MAIL_FROM: z.string().optional(),
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
