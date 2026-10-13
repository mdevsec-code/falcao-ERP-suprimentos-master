# Falcão ERP — Suprimentos

Sistema de gestão de suprimentos para engenharia: fornecedores, banco de produtos com histórico de preços, solicitações de compra com aprovações, contratos com aditivos, contas a pagar com fluxo de caixa, reembolsos, repositório central de documentos e agenda unificada.

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
- [Segurança](#segurança)
- [Padrão visual e de código](#padrão-visual-e-de-código)
- [Histórico de construção](#histórico-de-construção)
- [Estado atual e próximos passos](#estado-atual-e-próximos-passos)

## Funcionalidades

- **Autenticação e multi-tenancy** — login com JWT (access + refresh token), usuários vinculados a uma empresa (`Company`), controle de acesso por papel (RBAC).
- **Fornecedores** — cadastro completo (razão social, CNPJ, categoria, localização), contatos, avaliações de desempenho e upload de documentos (certificados, contratos, cotações).
- **Banco de produtos** — catálogo por empresa, fornecedor primário e alternativos, histórico de preços por fornecedor e unidade de medida.
- **Solicitações de compra** — fluxo de aprovação com múltiplos status (`aguardando aprovação → em compras → em cotação → pedido realizado → aguardando recebimento → finalizado`, ou rejeição), itens, comentários, anexos e trilha de aprovações.
- **Contratos** — contratos por fornecedor com vigência, janela de alerta de vencimento, régua visual do prazo, aditivos (alteram valor e/ou término e ficam no histórico), status (vigente, suspenso, encerrado, cancelado), anexos e execução financeira (lançado × pago × saldo).
- **Financeiro** — contas a pagar vinculadas a contrato, pedido de compra ou reembolso (herdando fornecedor e centro de custo), baixa com forma de pagamento, conciliação de nota fiscal, KPIs (a pagar, vencido, próximos 7 dias, pago no mês), fluxo de caixa previsto × pago por mês, ranking por centro de custo e exportação CSV.
- **Reembolsos** — pedido com várias despesas e comprovantes; o gestor aprova (gerando a conta a pagar) ou rejeita com motivo; quando o financeiro paga, o reembolso vira "pago". Cada colaborador vê o próprio histórico; gestão, financeiro e auditoria veem todos.
- **Documentos** — repositório central com categorias, etiquetas, validade (vencendo/vencido), vínculo com fornecedor/contrato e busca por conteúdo em arquivos de texto.
- **Agenda** — calendário mensal e lista dos próximos dias com eventos (entregas, recebimentos, visitas, reuniões, lembretes) mais os prazos dos outros módulos (vencimento de contas, fim de contratos, validade de documentos), filtrados pelo que cada papel pode ver, com visão por obra / centro de custo.
- **Auditoria** — log de criação/atualização/remoção por entidade, associado ao usuário e à empresa, com tela de consulta (filtros por ação, entidade, período e pessoa).
- **Usuários e perfil** — administração de usuários (criar, editar perfil de acesso, ativar/desativar, redefinir senha) e página "Meu perfil" com troca do próprio nome e senha.

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
│   │       └── modules/     # auth, users, companies, suppliers, products, purchase-requests,
│   │                        # contracts, finance, reimbursements, documents, agenda, audit, health, storage
│   └── web/                 # SPA React (mesmo padrão do Falcão Saúde Ocupacional)
│       └── src/
│           ├── app/         # App, Providers, Router (lazy + guardas de permissão), error boundaries
│           ├── components/  # ui/ (design system), layout/, feedback/, data-display/, charts/, common/, error/
│           ├── features/    # auth, dashboard, suppliers, products, purchase-requests, contracts,
│           │                #   finance, reimbursements, documents, agenda, users, audit, profile
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

Se você rodou o seed, os logins de exemplo são (todos com a senha `Falcao@123`):

| Email | Papel | Para testar |
|---|---|---|
| `admin@falcaoengenharia.com.br` | Administrador | tudo |
| `gestor@falcaoengenharia.com.br` | Gestor | aprovar reembolsos, contratos, consulta ao financeiro |
| `carlos@falcaoengenharia.com.br` | Solicitante | pedir reembolso; agenda e documentos sem acesso a contratos/financeiro |

O seed também cria contratos (um vencendo, um vencido), contas pagas e em aberto dos últimos meses, reembolsos, documentos e eventos de agenda com datas relativas a hoje.

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
- **Contract** / **ContractAmendment** — contrato por fornecedor e seus aditivos.
- **Payable** — conta a pagar, com origem (manual, pedido, contrato, reembolso), nota fiscal e baixa.
- **Reimbursement** — pedido de reembolso, com despesas (`ReimbursementItem`) e comprovantes.
- **Document** — documento do repositório central (etiquetas, validade, conteúdo indexado).
- **AgendaEvent** — evento da agenda (a agenda também agrega prazos de contas, contratos e documentos).
- **AuditLog** — trilha de auditoria genérica reutilizada por todos os módulos.

## Papéis de usuário

`ADMIN`, `MANAGER`, `BUYER`, `FINANCE`, `WAREHOUSE`, `REQUESTER`, `AUDITOR` — aplicados via guards de RBAC nos endpoints da API (papéis por módulo em `apps/api/src/common/constants/module-roles.ts`, espelhados no Web em `constants/permissions.ts`).

| Módulo | Consulta | Altera |
|---|---|---|
| Contratos | ADMIN, MANAGER, BUYER, FINANCE, AUDITOR | ADMIN, MANAGER, BUYER |
| Financeiro | ADMIN, MANAGER, FINANCE, AUDITOR | ADMIN, FINANCE |
| Reembolsos | todos (solicitantes veem só os próprios) | pedem: todos menos AUDITOR · decidem: ADMIN, MANAGER (nunca o próprio) |
| Documentos | todos | ADMIN, MANAGER, BUYER, FINANCE, WAREHOUSE |
| Agenda | todos (prazos só dos módulos que o papel consulta) | todos menos AUDITOR |

## API

- Prefixo global: `/api/v1`
- Autenticação: `Authorization: Bearer <accessToken>`, obtido em `POST /api/v1/auth/login`
- Renovação de sessão: `POST /api/v1/auth/refresh`
- A cada requisição o token é conferido contra o banco: usuário desativado perde o acesso na hora e mudança de perfil vale imediatamente.
- Usuários: `GET/POST /users`, `GET /users/stats`, `PATCH /users/:id`, `PATCH /users/:id/password` (ADMIN); `GET/PATCH /users/me`, `PATCH /users/me/password` (qualquer usuário)
- Auditoria: `GET /audit-logs`, `GET /audit-logs/stats` (ADMIN e AUDITOR)
- Contratos: `GET/POST /contracts`, `GET /contracts/stats`, `GET/PATCH /contracts/:id`, `PATCH /contracts/:id/status`, `POST /contracts/:id/amendments`
- Financeiro: `GET/POST /payables`, `GET /payables/stats`, `GET /payables/cash-flow`, `GET /payables/by-cost-center`, `GET /payables/cost-centers`, `GET/PATCH /payables/:id`, `PATCH /payables/:id/pay`, `PATCH /payables/:id/invoice`, `PATCH /payables/:id/cancel`
- Reembolsos: `GET/POST /reimbursements`, `GET /reimbursements/stats`, `GET/DELETE /reimbursements/:id`, `PATCH /reimbursements/:id/decision`, `POST /reimbursements/:id/attachments`, `DELETE /reimbursements/:id/attachments/:attachmentId`
- Documentos: `GET/POST /documents` (upload multipart), `GET /documents/stats`, `GET /documents/tags`, `GET/PATCH/DELETE /documents/:id`
- Agenda: `GET /agenda?from&to&obra`, `GET /agenda/obras`, `POST /agenda/events`, `PATCH/DELETE /agenda/events/:id`
- Saúde: `GET /health` (público — status da API e do banco)

## Segurança

- **Isolamento por empresa** no nível de consulta (`PrismaService.forCompany`) para todos os modelos de negócio; SQL bruto sempre parametrizado e com `company_id`.
- **Uploads**: o `LocalStorageProvider` recusa caminhos fora de `UPLOADS_DIR` e aceita só uma lista de extensões (PDF, imagens, Office, texto, CAD, ZIP) — HTML, SVG e JS são bloqueados. Os arquivos em `/uploads` saem com `X-Content-Type-Options: nosniff`; o que não é PDF, imagem ou texto é servido como download com `Content-Security-Policy: sandbox`.
- **Cabeçalhos** via `helmet`; CORS restrito a `CORS_ORIGIN`.
- **Força bruta**: login e refresh limitados a 10 tentativas por minuto por IP (`@nestjs/throttler`); o login leva o mesmo tempo para e-mail inexistente e senha errada (não revela quem tem conta).
- **Concorrência**: baixa de conta, cancelamento e decisão de reembolso são atualizações condicionais — dois cliques simultâneos não pagam duas vezes nem geram duas contas.
- **Validação**: `ValidationPipe` com `whitelist` + `forbidNonWhitelisted` (campos extras como `companyId` são rejeitados); erros conhecidos do Prisma viram 409/404/400 em vez de 500.
- **CSV**: a exportação neutraliza células que o Excel executaria como fórmula.
- **Dependências**: `overrides` no `package.json` raiz fixam versões corrigidas de `multer`, `body-parser`, `lodash` e `qs`.

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
7. **Administração** — usuários (API + tela), trilha de auditoria (API + tela), "Meu perfil", endpoint de saúde e redesenho das telas de entrada (login, 404, acesso negado, módulos "em breve") na linguagem "planta técnica" — malha milimetrada, carimbo de prancha e o fluxo de compra desenhado como diagrama vivo — mantendo tokens, cores e componentes. Correção: o `nest build` gerava `dist/` sem `main.js` quando o cache incremental do TypeScript existia.
8. **Contratos, Financeiro, Reembolsos, Documentos e Agenda** — os cinco módulos que faltavam, com schema, API, telas, i18n e dados de demonstração, integrados entre si: o aditivo altera o contrato, a aprovação de um reembolso gera a conta a pagar, o pagamento fecha o reembolso e os prazos aparecem na agenda. Componentes comuns novos: `SelectField`, `RowAction`, `UploadFileDialog`, `CostCenterInput`.
9. **Revisão geral e de segurança** — correção de *path traversal* no upload de anexos de solicitação (o arquivo era gravado antes de validar o id da URL, permitindo escrever fora de `uploads/`), bloqueio de uploads executáveis, cabeçalhos de segurança, limite de tentativas no login, login em tempo constante, condições de corrida em pagamentos e aprovações, erros do Prisma e do serve-static que viravam 500, injeção de fórmula no CSV, nomes de arquivo com acento corrompidos pelo multer e atualização de dependências vulneráveis (incluindo uma crítica).

## Estado atual e próximos passos

O projeto está funcional para desenvolvimento local (`npm run dev`), mas ainda **não está pronto para produção**. Faltam:

**Infraestrutura e entrega**
- Sem Dockerfile de produção para API/Web — o `docker-compose.yml` atual sobe apenas o Postgres de desenvolvimento.
- CI existe, mas não há CD (deploy automatizado).
- Sem ambiente de deploy configurado (hospedagem, variáveis de produção, HTTPS, etc.).
- Armazenamento de arquivos apenas local em disco (`UPLOADS_DIR`); não serve para múltiplas instâncias nem é durável em produção — a interface `IStorageProvider` já existe para plugar um provider em nuvem (ex. S3/Azure Blob) quando isso for priorizado.

**Qualidade**
- O Web tem testes unitários (formatação, KPIs, CSV, calendário, paridade de traduções); a API ainda não tem `*.spec.ts` versionados — os fluxos foram verificados com testes de fumaça contra um banco real durante o desenvolvimento.
- O CI (`.github/workflows/ci.yml`) roda lint, typecheck, testes e build — falta um job com Postgres para testes de integração.
- `npm audit` ainda aponta vulnerabilidades que só se resolvem com troca de versão maior: NestJS 10 → 11 (`@nestjs/core`, `path-to-regexp` do `serve-static`, `file-type`), React Router 6 → 7 e ferramentas de linha de comando do Prisma (`mysql2`, `deepmerge-ts`, não usadas em produção com Postgres).

**Segurança — pontos ainda abertos**
- Arquivos em `/uploads` são acessíveis por quem tiver a URL (nomes aleatórios, sem autenticação) — para dados sensíveis, servir por rota autenticada ou URLs assinadas.
- Tokens ficam no `localStorage` do navegador; cookies `httpOnly` reduziriam o impacto de um eventual XSS.
- Exigir segredos JWT longos (32+ caracteres) na validação de ambiente de produção.

**Gaps administrativos**
- `companies` ainda é só um serviço interno — não há tela para os dados da empresa.
- Sem fluxo de recuperação de senha por e-mail ("esqueci minha senha"); hoje um administrador redefine a senha.
- O Dashboard ainda mostra só indicadores de suprimentos — falta trazer KPIs de contratos, financeiro e reembolsos.
- A busca por conteúdo cobre apenas arquivos de texto; PDFs e documentos Office não são indexados.
