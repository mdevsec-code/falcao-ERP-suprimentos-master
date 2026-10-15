-- CreateEnum
CREATE TYPE "ApprovalStep" AS ENUM ('TECNICO', 'COMPRAS', 'CUSTOS', 'GERENTE_GERAL');

-- CreateEnum
CREATE TYPE "SignatureDecision" AS ENUM ('APROVADO', 'RECUSADO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "signature_data" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "photo_path" TEXT;

-- AlterTable
ALTER TABLE "purchase_requests" ADD COLUMN     "current_step" "ApprovalStep",
ADD COLUMN     "numero" INTEGER,
ADD COLUMN     "requester_contact" TEXT;

-- Solicitações que já existiam: número pela ordem de criação, por empresa.
UPDATE "purchase_requests" AS pr SET "numero" = n.rn
FROM (SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at, id) AS rn FROM "purchase_requests") AS n
WHERE pr.id = n.id;
ALTER TABLE "purchase_requests" ALTER COLUMN "numero" SET NOT NULL;

-- As que aguardam aprovação começam pela primeira etapa de assinatura.
UPDATE "purchase_requests" SET "current_step" = 'TECNICO' WHERE status = 'AGUARDANDO_APROVACAO';

-- AlterTable
ALTER TABLE "purchase_request_items" ADD COLUMN     "data_necessaria" DATE,
ADD COLUMN     "especificacao" TEXT,
ADD COLUMN     "local_uso" TEXT,
ADD COLUMN     "peso_total" DECIMAL(12,3),
ADD COLUMN     "photo_path" TEXT,
ADD COLUMN     "setor_solicitante" TEXT;

-- CreateTable
CREATE TABLE "approval_step_approvers" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "step" "ApprovalStep" NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_step_approvers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_request_signatures" (
    "id" TEXT NOT NULL,
    "purchase_request_id" TEXT NOT NULL,
    "step" "ApprovalStep" NOT NULL,
    "decision" "SignatureDecision" NOT NULL,
    "user_id" TEXT NOT NULL,
    "signer_name" TEXT NOT NULL,
    "signature_data" TEXT NOT NULL,
    "comment" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_request_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "approval_step_approvers_company_id_step_idx" ON "approval_step_approvers"("company_id", "step");

-- CreateIndex
CREATE UNIQUE INDEX "approval_step_approvers_company_id_step_user_id_key" ON "approval_step_approvers"("company_id", "step", "user_id");

-- CreateIndex
CREATE INDEX "purchase_request_signatures_purchase_request_id_idx" ON "purchase_request_signatures"("purchase_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_request_signatures_purchase_request_id_step_key" ON "purchase_request_signatures"("purchase_request_id", "step");

-- CreateIndex
CREATE INDEX "purchase_requests_company_id_current_step_idx" ON "purchase_requests"("company_id", "current_step");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_company_id_numero_key" ON "purchase_requests"("company_id", "numero");

-- AddForeignKey
ALTER TABLE "approval_step_approvers" ADD CONSTRAINT "approval_step_approvers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_step_approvers" ADD CONSTRAINT "approval_step_approvers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_signatures" ADD CONSTRAINT "purchase_request_signatures_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_request_signatures" ADD CONSTRAINT "purchase_request_signatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

