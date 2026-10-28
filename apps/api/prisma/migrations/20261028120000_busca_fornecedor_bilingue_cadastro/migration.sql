-- Fornecedor: atividades e produtos/serviços em português e chinês, e texto de busca normalizado.
-- O texto de busca dos fornecedores existentes é preenchido pela API ao iniciar (SuppliersService.onModuleInit).
ALTER TABLE "suppliers" ADD COLUMN "atividades" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "atividades_zh" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "produtos_servicos" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "produtos_servicos_zh" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "search_text" TEXT NOT NULL DEFAULT '';

-- Empresa: link para o fornecedor fazer o próprio cadastro.
ALTER TABLE "companies" ADD COLUMN "supplier_signup_nonce" TEXT;
