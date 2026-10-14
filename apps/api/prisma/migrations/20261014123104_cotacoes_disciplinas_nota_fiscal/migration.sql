-- CreateEnum
CREATE TYPE "PriceEntrySource" AS ENUM ('MANUAL', 'COTACAO');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('ABERTA', 'ENCERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "QuotationSupplierStatus" AS ENUM ('CONVIDADO', 'RESPONDIDO', 'RECUSOU');

-- AlterTable
ALTER TABLE "payables" ADD COLUMN     "nota_fiscal_chave" TEXT,
ADD COLUMN     "nota_fiscal_pdf_name" TEXT,
ADD COLUMN     "nota_fiscal_pdf_path" TEXT,
ADD COLUMN     "nota_fiscal_xml_name" TEXT,
ADD COLUMN     "nota_fiscal_xml_path" TEXT;

-- AlterTable
ALTER TABLE "product_price_entries" ADD COLUMN     "marca" TEXT,
ADD COLUMN     "origem" "PriceEntrySource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "quantity" DECIMAL(12,2),
ADD COLUMN     "quotation_id" TEXT,
ADD COLUMN     "referencia" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "discipline_id" TEXT,
ADD COLUMN     "referencia" TEXT;

-- AlterTable
ALTER TABLE "purchase_request_items" ADD COLUMN     "marca" TEXT,
ADD COLUMN     "referencia" TEXT;

-- CreateTable
CREATE TABLE "disciplines" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'ABERTA',
    "prazo_resposta" DATE NOT NULL,
    "observacoes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "encerrada_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_items" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "purchase_request_item_id" TEXT,
    "product_id" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "descricao" TEXT NOT NULL,
    "quantidade" DECIMAL(12,2) NOT NULL,
    "unidade" TEXT NOT NULL,
    "marca" TEXT,
    "referencia" TEXT,
    "vencedor_id" TEXT,

    CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_suppliers" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "status" "QuotationSupplierStatus" NOT NULL DEFAULT 'CONVIDADO',
    "link_nonce" TEXT NOT NULL,
    "respondido_em" TIMESTAMP(3),
    "respondido_por" TEXT,
    "prazo_entrega_dias" INTEGER,
    "condicao_pagamento" TEXT,
    "validade_proposta" DATE,
    "frete" DECIMAL(12,2),
    "observacoes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quotation_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation_prices" (
    "id" TEXT NOT NULL,
    "quotation_supplier_id" TEXT NOT NULL,
    "quotation_item_id" TEXT NOT NULL,
    "preco_unitario" DECIMAL(12,2),
    "marca" TEXT,
    "referencia" TEXT,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "observacao" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disciplines_company_id_idx" ON "disciplines"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "disciplines_company_id_nome_key" ON "disciplines"("company_id", "nome");

-- CreateIndex
CREATE INDEX "quotations_company_id_idx" ON "quotations"("company_id");

-- CreateIndex
CREATE INDEX "quotations_company_id_status_idx" ON "quotations"("company_id", "status");

-- CreateIndex
CREATE INDEX "quotations_purchase_request_id_idx" ON "quotations"("purchase_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_company_id_numero_key" ON "quotations"("company_id", "numero");

-- CreateIndex
CREATE INDEX "quotation_items_quotation_id_idx" ON "quotation_items"("quotation_id");

-- CreateIndex
CREATE INDEX "quotation_suppliers_quotation_id_idx" ON "quotation_suppliers"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_suppliers_quotation_id_supplier_id_key" ON "quotation_suppliers"("quotation_id", "supplier_id");

-- CreateIndex
CREATE INDEX "quotation_prices_quotation_item_id_idx" ON "quotation_prices"("quotation_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_prices_quotation_supplier_id_quotation_item_id_key" ON "quotation_prices"("quotation_supplier_id", "quotation_item_id");

-- CreateIndex
CREATE INDEX "products_company_id_discipline_id_idx" ON "products"("company_id", "discipline_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_discipline_id_fkey" FOREIGN KEY ("discipline_id") REFERENCES "disciplines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_entries" ADD CONSTRAINT "product_price_entries_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_purchase_request_item_id_fkey" FOREIGN KEY ("purchase_request_item_id") REFERENCES "purchase_request_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_items" ADD CONSTRAINT "quotation_items_vencedor_id_fkey" FOREIGN KEY ("vencedor_id") REFERENCES "quotation_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_suppliers" ADD CONSTRAINT "quotation_suppliers_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_suppliers" ADD CONSTRAINT "quotation_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_prices" ADD CONSTRAINT "quotation_prices_quotation_supplier_id_fkey" FOREIGN KEY ("quotation_supplier_id") REFERENCES "quotation_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_prices" ADD CONSTRAINT "quotation_prices_quotation_item_id_fkey" FOREIGN KEY ("quotation_item_id") REFERENCES "quotation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Disciplinas iniciais para as empresas já cadastradas (a lista é editável pela tela).
INSERT INTO "disciplines" ("id", "company_id", "nome", "ordem", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid(), c."id", d."nome", d."ordem", true, now(), now()
FROM "companies" c
CROSS JOIN (VALUES ('Civil', 1), ('Elétrica', 2), ('Mecânica', 3), ('Eletromecânica', 4), ('Hidráulica', 5), ('Instrumentação', 6)) AS d("nome", "ordem")
ON CONFLICT ("company_id", "nome") DO NOTHING;
