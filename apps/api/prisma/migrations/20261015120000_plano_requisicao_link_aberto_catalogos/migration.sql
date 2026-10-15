-- CreateEnum
CREATE TYPE "QuotationSupplierOrigin" AS ENUM ('CONVITE', 'LINK_ABERTO');

-- CreateEnum
CREATE TYPE "RequisitionPlanStatus" AS ENUM ('RASCUNHO', 'LANCADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "SupplierCatalogStatus" AS ENUM ('PENDENTE', 'REVISADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "SupplierCatalogItemStatus" AS ENUM ('PENDENTE', 'IMPORTADO', 'IGNORADO');

-- AlterEnum
ALTER TYPE "PriceEntrySource" ADD VALUE 'CATALOGO';

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "catalog_link_nonce" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "cadastro_pendente" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "product_price_entries" ADD COLUMN     "catalog_id" TEXT;

-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "link_aberto_nonce" TEXT,
ADD COLUMN     "plan_id" TEXT,
ALTER COLUMN "purchase_request_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "quotation_suppliers" ADD COLUMN     "origem" "QuotationSupplierOrigin" NOT NULL DEFAULT 'CONVITE';

-- CreateTable
CREATE TABLE "quotation_item_origins" (
    "id" TEXT NOT NULL,
    "quotation_item_id" TEXT NOT NULL,
    "purchase_request_item_id" TEXT NOT NULL,
    "quantidade" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "quotation_item_origins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_plans" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "obra" TEXT,
    "prazo_resposta" DATE NOT NULL,
    "observacoes" TEXT,
    "status" "RequisitionPlanStatus" NOT NULL DEFAULT 'RASCUNHO',
    "created_by_id" TEXT NOT NULL,
    "lancado_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requisition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisition_plan_requests" (
    "plan_id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,

    CONSTRAINT "requisition_plan_requests_pkey" PRIMARY KEY ("plan_id","purchase_request_id")
);

-- CreateTable
CREATE TABLE "supplier_catalogs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "status" "SupplierCatalogStatus" NOT NULL DEFAULT 'PENDENTE',
    "enviado_por" TEXT NOT NULL,
    "observacoes" TEXT,
    "file_name" TEXT,
    "file_path" TEXT,
    "mime_type" TEXT,
    "size" INTEGER,
    "revisado_por_id" TEXT,
    "revisado_em" TIMESTAMP(3),
    "motivo_recusa" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_catalog_items" (
    "id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "codigo_fornecedor" TEXT,
    "descricao" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "marca" TEXT,
    "referencia" TEXT,
    "preco" DECIMAL(12,2),
    "observacao" TEXT,
    "status" "SupplierCatalogItemStatus" NOT NULL DEFAULT 'PENDENTE',
    "product_id" TEXT,

    CONSTRAINT "supplier_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotation_item_origins_purchase_request_item_id_idx" ON "quotation_item_origins"("purchase_request_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_item_origins_quotation_item_id_purchase_request_i_key" ON "quotation_item_origins"("quotation_item_id", "purchase_request_item_id");

-- CreateIndex
CREATE INDEX "requisition_plans_company_id_idx" ON "requisition_plans"("company_id");

-- CreateIndex
CREATE INDEX "requisition_plans_company_id_status_idx" ON "requisition_plans"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "requisition_plans_company_id_numero_key" ON "requisition_plans"("company_id", "numero");

-- CreateIndex
CREATE INDEX "requisition_plan_requests_purchase_request_id_idx" ON "requisition_plan_requests"("purchase_request_id");

-- CreateIndex
CREATE INDEX "supplier_catalogs_company_id_idx" ON "supplier_catalogs"("company_id");

-- CreateIndex
CREATE INDEX "supplier_catalogs_company_id_status_idx" ON "supplier_catalogs"("company_id", "status");

-- CreateIndex
CREATE INDEX "supplier_catalogs_supplier_id_idx" ON "supplier_catalogs"("supplier_id");

-- CreateIndex
CREATE INDEX "supplier_catalog_items_catalog_id_idx" ON "supplier_catalog_items"("catalog_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotations_plan_id_key" ON "quotations"("plan_id");

-- AddForeignKey
ALTER TABLE "product_price_entries" ADD CONSTRAINT "product_price_entries_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "supplier_catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "requisition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_item_origins" ADD CONSTRAINT "quotation_item_origins_quotation_item_id_fkey" FOREIGN KEY ("quotation_item_id") REFERENCES "quotation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotation_item_origins" ADD CONSTRAINT "quotation_item_origins_purchase_request_item_id_fkey" FOREIGN KEY ("purchase_request_item_id") REFERENCES "purchase_request_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_plans" ADD CONSTRAINT "requisition_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_plans" ADD CONSTRAINT "requisition_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_plan_requests" ADD CONSTRAINT "requisition_plan_requests_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "requisition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisition_plan_requests" ADD CONSTRAINT "requisition_plan_requests_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalogs" ADD CONSTRAINT "supplier_catalogs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalogs" ADD CONSTRAINT "supplier_catalogs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalogs" ADD CONSTRAINT "supplier_catalogs_revisado_por_id_fkey" FOREIGN KEY ("revisado_por_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "supplier_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

