-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('MATERIAIS_CONSTRUCAO', 'EQUIPAMENTOS', 'FERRAMENTAS', 'EPI', 'ELETRICA', 'HIDRAULICA', 'ACABAMENTO', 'OUTROS');

-- CreateEnum
CREATE TYPE "UnitOfMeasure" AS ENUM ('UN', 'KG', 'M', 'M2', 'M3', 'L', 'CX', 'PC', 'SC', 'TON');

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" "ProductCategory" NOT NULL,
    "marca" TEXT,
    "unidade" "UnitOfMeasure" NOT NULL,
    "lead_time_days" INTEGER,
    "observacoes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "primary_supplier_id" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_suppliers" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,

    CONSTRAINT "product_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_price_entries" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_price_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_company_id_idx" ON "products"("company_id");

-- CreateIndex
CREATE INDEX "products_company_id_categoria_idx" ON "products"("company_id", "categoria");

-- CreateIndex
CREATE UNIQUE INDEX "products_company_id_codigo_key" ON "products"("company_id", "codigo");

-- CreateIndex
CREATE INDEX "product_suppliers_product_id_idx" ON "product_suppliers"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_suppliers_product_id_supplier_id_key" ON "product_suppliers"("product_id", "supplier_id");

-- CreateIndex
CREATE INDEX "product_price_entries_product_id_idx" ON "product_price_entries"("product_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_primary_supplier_id_fkey" FOREIGN KEY ("primary_supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_entries" ADD CONSTRAINT "product_price_entries_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_price_entries" ADD CONSTRAINT "product_price_entries_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
