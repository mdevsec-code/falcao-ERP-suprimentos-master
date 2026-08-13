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
- React 18 + Vite 5 + TypeScript
- TanStack Query para data-fetching, React Hook Form + Zod para formulários
- Tailwind CSS + Radix UI + `lucide-react`, gráficos com Recharts

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
│   └── web/                 # SPA React
│       └── src/
│           ├── features/    # auth, products, purchase-requests, suppliers, dashboard
│           ├── components/  # componentes de UI compartilhados
│           └── layouts/     # shell da aplicação, sidebar, navegação
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
