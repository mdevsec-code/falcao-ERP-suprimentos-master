-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('AGUARDANDO_APROVACAO', 'EM_COMPRAS', 'EM_COTACAO', 'PEDIDO_REALIZADO', 'AGUARDANDO_RECEBIMENTO', 'FINALIZADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES');

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "justification" TEXT,
    "cost_center" TEXT,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_items" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "product_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "estimated_price" DECIMAL(12,2),

    CONSTRAINT "purchase_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_approvals" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "action" "ApprovalAction" NOT NULL,
    "from_status" "PurchaseRequestStatus" NOT NULL,
    "to_status" "PurchaseRequestStatus" NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_request_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_comments" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_attachments" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchase_requests_company_id_idx" ON "purchase_requests"("company_id");

-- CreateIndex
CREATE INDEX "purchase_requests_company_id_status_idx" ON "purchase_requests"("company_id", "status");

-- CreateIndex
CREATE INDEX "purchase_requests_company_id_requester_id_idx" ON "purchase_requests"("company_id", "requester_id");

-- CreateIndex
CREATE INDEX "purchase_request_items_purchase_request_id_idx" ON "purchase_request_items"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_request_approvals_purchase_request_id_idx" ON "purchase_request_approvals"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_request_comments_purchase_request_id_idx" ON "purchase_request_comments"("purchase_request_id");

-- CreateIndex
CREATE INDEX "purchase_request_attachments_purchase_request_id_idx" ON "purchase_request_attachments"("purchase_request_id");

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_items" ADD CONSTRAINT "purchase_request_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_approvals" ADD CONSTRAINT "purchase_request_approvals_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_approvals" ADD CONSTRAINT "purchase_request_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_comments" ADD CONSTRAINT "purchase_request_comments_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_comments" ADD CONSTRAINT "purchase_request_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_attachments" ADD CONSTRAINT "purchase_request_attachments_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_attachments" ADD CONSTRAINT "purchase_request_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
