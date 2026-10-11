# Falcão ERP — Suprimentos

Sistema de gestão de suprimentos para engenharia: cadastro de fornecedores, banco de produtos com histórico de preços e fluxo completo de solicitações de compra com aprovações, comentários e anexos.

Monorepo em TypeScript com API [NestJS](https://nestjs.com/) + [Prisma](https://www.prisma.io/) e frontend [React](https://react.dev/) + [Vite](https://vitejs.dev/).

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack técnica](#stack-técnica)
- [Estrutura do monorepo](#estrutura-do-monorepo)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Modelo de dados](#modelo-de-dados)
- [Papéis de usuário](#papéis-de-usuário)
- [API](#api)
- [Padrão visual e de código](#padrão-visual-e-de-código)
- [Histórico de construção](#histórico-de-construção)
- [Estado atual e próximos passos](#estado-atual-e-próximos-passos)

## Funcionalidades

- **Autenticação e multi-tenancy** — login com JWT (access + refresh token), usuários vinculados a uma empresa (`Company`), controle de acesso por papel (RBAC).
- **Fornecedores** — cadastro completo (razão social, CNPJ, categoria, localização), contatos, avaliações de desempenho e upload de documentos (certificados, contratos, cotações).
- **Banco de produtos** — catálogo por empresa, fornecedor primário e alternativos, histórico de preços por fornecedor e unidade de medida.
- **Solicitações de compra** — fluxo de aprovação com múltiplos status (`aguardando aprovação → em compras → em cotação → pedido realizado → aguardando recebimento → finalizado`, ou rejeição), itens, comentários, anexos e trilha de aprovações.
- **Auditoria** — log de criação/atualização/remoção por entidade, associado ao usuário e à empresa.

## Stack técnica

**API** (`apps/api`)
- NestJS 10 + TypeScript
- Prisma 7 (adapter `@prisma/adapter-pg`) sobre PostgreSQL
- Autenticação JWT (`@nestjs/jwt`, `passport-jwt`), hashing com `bcryptjs`
- Validação com `class-validator` / `class-transformer` e `zod`

**Web** (`apps/web`)
- React 18 + Vite 5 + TypeScript (strict, `noUncheckedIndexedAccess`)
- TanStack Query para data-fetching, React Hook Form + Zod para formulários
- Zustand para sessão e preferências de UI (tema, menu recolhido)
- i18next com três idiomas: português (padrão), inglês e chinês simplificado
- Tailwind CSS sobre design tokens em CSS + Radix UI + `lucide-react`, animações com Framer Motion, gráficos com Recharts
- Vitest + Testing Library, ESLint (com `jsx-a11y`) e Prettier

**Compartilhado** (`packages/shared-types`) — tipos TypeScript (DTOs, enums, paginação) usados por API e Web.

## Estrutura do monorepo

```
falcao-ERP-suprimentos-master/
├── apps/
│   ├── api/                 # API NestJS
│   │   ├── prisma/          # schema, migrations e seed
│   │   └── src/
│   │       ├── common/      # decorators, guards, filters, interceptors
│   │       └── modules/     # auth, companies, products, purchase-requests, suppliers, users, storage
│   └── web/                 # SPA React (mesmo padrão do Falcão Saúde Ocupacional)
│       └── src/
│           ├── app/         # App, Providers, Router (lazy + guardas de permissão), error boundaries
│           ├── components/  # ui/ (design system), layout/, feedback/, data-display/, charts/, common/, error/
│           ├── features/    # auth, dashboard, suppliers, products, purchase-requests
│           │                #   cada uma com components/ hooks/ pages/ services/ types.ts (+ lib/)
│           ├── constants/   # rotas, papéis, permissões (RBAC), enums traduzidos, i18n
│           ├── i18n/        # bootstrap do i18next + locales/{pt-BR,en-US,zh-CN}/*.json
│           ├── services/    # cliente HTTP (axios) com refresh token e ApiError
│           ├── store/       # Zustand: authStore, uiStore
│           ├── styles/      # tokens.css (cores, tipografia, sombras, motion), reset, tailwind
│           ├── hooks/ utils/ validators/ config/
├── packages/
│   └── shared-types/        # tipos TypeScript compartilhados entre API e Web
├── docker-compose.yml       # Postgres para desenvolvimento
└── package.json             # workspaces + scripts raiz
```

## Pré-requisitos

- Node.js >= 20
- Docker (para o PostgreSQL local) ou uma instância PostgreSQL própria

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# 3. Subir o banco de dados (Postgres via Docker)
npm run db:up

# 4. Rodar as migrations
npm run db:migrate

# 5. (Opcional) Popular o banco com dados de exemplo
npm run db:seed

# 6. Subir API e Web em modo desenvolvimento
npm run dev
```

- API disponível em `http://localhost:3333/api/v1`
- Web disponível em `http://localhost:5173`

Se você rodou o seed, o login de exemplo é:

| Email | Senha |
|---|---|
| `admin@falcaoengenharia.com.br` | `Falcao@123` |

## Variáveis de ambiente

Definidas em `.env` (veja `.env.example`):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `PORT` | Porta da API (padrão `3333`) |
| `JWT_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Segredo e expiração do access token |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Segredo e expiração do refresh token |
| `UPLOADS_DIR` | Diretório local para armazenamento de arquivos enviados |
| `CORS_ORIGIN` | Origem permitida no CORS da API (URL do Web) |
| `VITE_API_URL` | URL base da API consumida pelo Web |

> Nunca versione o arquivo `.env` — ele já está no `.gitignore`. Gere segredos fortes para `JWT_SECRET` e `JWT_REFRESH_SECRET` antes de qualquer deploy.

## Scripts disponíveis

Executados a partir da raiz do monorepo:

| Script | Descrição |
|---|---|
| `npm run dev` | Sobe API e Web simultaneamente (modo watch) |
| `npm run dev:api` / `npm run dev:web` | Sobe apenas a API ou apenas o Web |
| `npm run build` | Build de produção de `shared-types`, API e Web |
| `npm run lint` | Lint da API e do Web |
| `npm run typecheck` | Checagem de tipos de `shared-types`, API e Web |
| `npm run test` | Testes unitários do Web (Vitest) |
| `npm run format` / `npm run format:check` | Formata / verifica a formatação com Prettier |
| `npm run validate` | Typecheck + lint + formatação + testes + build (o mesmo que o CI roda) |
| `npm run db:up` / `npm run db:down` | Sobe/derruba o Postgres via Docker Compose |
| `npm run db:migrate` | Aplica migrations do Prisma |
| `npm run db:seed` | Popula o banco com dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio |

## Modelo de dados

Principais entidades (definidas em `apps/api/prisma/schema.prisma`):

- **Company** — tenant raiz; todo dado é isolado por empresa.
- **User** — usuário vinculado a uma empresa, com papel (`Role`) e refresh tokens.
- **Supplier** — fornecedor, com contatos, avaliações e documentos.
- **Product** — produto do catálogo, com fornecedor primário/alternativos e histórico de preços.
- **PurchaseRequest** — solicitação de compra, com itens, aprovações, comentários e anexos.
- **AuditLog** — trilha de auditoria genérica reutilizada por todos os módulos.

## Papéis de usuário

`ADMIN`, `MANAGER`, `BUYER`, `FINANCE`, `WAREHOUSE`, `REQUESTER`, `AUDITOR` — aplicados via guards de RBAC nos endpoints da API.

## API

- Prefixo global: `/api/v1`
- Autenticação: `Authorization: Bearer <accessToken>`, obtido em `POST /api/v1/auth/login`
- Renovação de sessão: `POST /api/v1/auth/refresh`

## Padrão visual e de código

O frontend segue o mesmo design system e as mesmas convenções da plataforma [Falcão Saúde Ocupacional](https://github.com/mdevsec-code/falcao-saude-ocupacional), para que os produtos Falcão tenham uma identidade única:

- **Identidade visual** — dourado e grafite extraídos da logo oficial, tipografia Fraunces (títulos), Inter (texto) e IBM Plex Mono (rótulos), tokens de cor/sombra/raio/movimento em `src/styles/tokens.css`, tema claro e escuro.
- **Componentes** — mesmo kit de UI (`Button`, `Input`, `Select`, `Dialog`, `Tabs`, `Badge`, `Card`…), `PageHeader` com *eyebrow*, `StatTile` para KPIs, `EmptyState`/`ErrorState`/`LoadingState`, `Sidebar` com pílula ativa animada e `Topbar` com breadcrumb, busca global, idioma e tema.
- **Animações** — transição entre páginas, entradas em `slide-up`/`scale-in` escalonadas, glows com *drift* na tela de login, contagem animada nos KPIs; tudo respeita `prefers-reduced-motion`.
- **Código** — componentes em PascalCase (`components/ui/Button/Button.tsx`), uma pasta por feature com `services/` (chamadas HTTP), `hooks/` (TanStack Query), `types.ts` (schemas Zod + conversões formulário ⇄ API), `components/` e `pages/`; textos sempre via i18n; permissões centralizadas em `constants/permissions.ts`, espelhando os `@Roles` da API.
- **Gráficos** — série única no dourado da marca, validada para contraste nos dois temas (ver `src/styles/tokens.css`).

## Histórico de construção

O projeto foi construído em fases incrementais, cada uma adicionando um módulo de negócio completo (schema + API + tela):

1. **Fundação** — multi-tenancy (`Company`/`User`), autenticação JWT com access + refresh token e RBAC por papel.
2. **Fase 1 — Fornecedores** — cadastro, contatos, avaliações de desempenho e upload de documentos, com armazenamento local de arquivos (`LocalStorageProvider`) por trás de uma interface (`IStorageProvider`) já preparada para trocar por um provider em nuvem sem alterar controllers/serviços.
3. **Fase 2 — Banco de produtos** — catálogo por empresa, fornecedor primário/alternativos e histórico de preços.
4. **Fase 3 — Solicitações de compra** — fluxo de aprovação com múltiplos status, itens, comentários, anexos e trilha de aprovações; interceptor de auditoria (`AuditLogInterceptor`) plugado nos módulos de negócio.
5. **Publicação** — versionamento do código com Git e envio para o repositório GitHub ([mdevsec-code/falcao-ERP-suprimentos-master](https://github.com/mdevsec-code/falcao-ERP-suprimentos-master)).
6. **Padronização com o Falcão Saúde Ocupacional** — frontend refeito sobre o design system, a estrutura de pastas e as convenções da plataforma de Saúde Ocupacional: tokens e componentes de UI, layout, animações, i18n (pt-BR/en-US/zh-CN), sessão em Zustand com "manter conectado", RBAC por permissões, KPIs e gráficos nas telas, Vitest, Prettier e CI. Correções feitas no caminho: a fila de Aprovações pedia `pageSize=200` (a API aceita no máximo 100) e falhava; o seletor de produto nos itens da solicitação não refletia a escolha; o `.env` da raiz não era lido pela API, pelo Prisma nem pelo Vite.

## Estado atual e próximos passos

O projeto está funcional para desenvolvimento local (`npm run dev`), mas ainda **não está pronto para produção**. Faltam:

**Infraestrutura e entrega**
- Sem Dockerfile de produção para API/Web — o `docker-compose.yml` atual sobe apenas o Postgres de desenvolvimento.
- CI existe, mas não há CD (deploy automatizado).
- Sem ambiente de deploy configurado (hospedagem, variáveis de produção, HTTPS, etc.).
- Armazenamento de arquivos apenas local em disco (`UPLOADS_DIR`); não serve para múltiplas instâncias nem é durável em produção — a interface `IStorageProvider` já existe para plugar um provider em nuvem (ex. S3/Azure Blob) quando isso for priorizado.

**Qualidade**
- O Web tem testes unitários (formatação, KPIs, paridade de traduções); a API ainda não tem `*.spec.ts` nem testes e2e.
- O CI (`.github/workflows/ci.yml`) roda lint, typecheck, testes e build — falta um job com Postgres para testes de integração.
- `multer@1.4.5-lts.1` (API) tem vulnerabilidades conhecidas, corrigidas na 2.x — atualizar.

**Funcionalidades de negócio pendentes**
Módulos já previstos na navegação do Web, mas ainda não implementados (marcados como "em breve" na interface):
- Contratos
- Financeiro
- Reembolsos
- Agenda
- Documentos (gestão central, além dos documentos de fornecedor)

**Gaps administrativos**
- Módulos `users` e `companies` existem apenas como serviços internos (usados pelo login) — não há controller/endpoints REST nem tela no Web para administrar usuários ou dados da empresa.
- Sem fluxo de recuperação de senha ("esqueci minha senha").
- `AuditLog` é gravado pelos módulos de negócio, mas não há endpoint nem tela para consultar o histórico de auditoria.
