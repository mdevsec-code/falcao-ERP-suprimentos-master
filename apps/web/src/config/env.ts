import { z } from 'zod';

/**
 * Schema de validação das variáveis de ambiente. Falha em `import.meta.env`
 * ausente ou tipos errados — use `env` em vez de acessar `import.meta.env` direto.
 */
const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .url('VITE_API_URL deve ser uma URL válida')
    .default('http://localhost:3333/api/v1'),
  VITE_DEFAULT_LOCALE: z.string().min(2).max(10).default('pt-BR'),
  VITE_APP_NAME: z.string().min(1).default('Falcão Suprimentos'),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Verifique o arquivo .env.example.');
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;

/**
 * Origem da API sem o prefixo `/api/v1` — os arquivos enviados (documentos,
 * anexos) são servidos em `/uploads/...` na raiz do servidor.
 */
export const API_ORIGIN = env.VITE_API_URL.replace(/\/api\/v1\/?$/, '');
