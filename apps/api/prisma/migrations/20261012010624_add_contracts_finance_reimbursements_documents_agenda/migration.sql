-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('VIGENTE', 'SUSPENSO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PayableStatus" AS ENUM ('ABERTO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PayableSource" AS ENUM ('MANUAL', 'PEDIDO', 'CONTRATO', 'REEMBOLSO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BOLETO', 'PIX', 'TRANSFERENCIA', 'CARTAO', 'DINHEIRO');

-- CreateEnum
CREATE TYPE "ReimbursementStatus" AS ENUM ('ENVIADO', 'APROVADO', 'REJEITADO', 'PAGO');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRANSPORTE', 'COMBUSTIVEL', 'ALIMENTACAO', 'HOSPEDAGEM', 'MATERIAL', 'OUTROS');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('CONTRATO', 'NOTA_FISCAL', 'CERTIDAO', 'LICENCA', 'APOLICE', 'PROJETO', 'MANUAL', 'POLITICA', 'OUTRO');

-- CreateEnum
CREATE TYPE "AgendaEventType" AS ENUM ('ENTREGA', 'RECEBIMENTO', 'VISITA', 'REUNIAO', 'LEMBRETE', 'OUTRO');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "descricao" TEXT,
    "cost_center" TEXT,
    "valor_total" DECIMAL(14,2) NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "assinado_em" DATE,
    "alerta_dias" INTEGER NOT NULL DEFAULT 30,
    "status" "ContractStatus" NOT NULL DEFAULT 'VIGENTE',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_amendments" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor_delta" DECIMAL(14,2),
    "nova_data_fim" DATE,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payables" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "origem" "PayableSource" NOT NULL DEFAULT 'MANUAL',
    "supplier_id" TEXT,
    "contract_id" TEXT,
    "purchase_request_id" TEXT,
    "reimbursement_id" TEXT,
    "cost_center" TEXT,
    "valor" DECIMAL(14,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "status" "PayableStatus" NOT NULL DEFAULT 'ABERTO',
    "nota_fiscal" TEXT,
    "nota_fiscal_emissao" DATE,
    "pago_em" DATE,
    "valor_pago" DECIMAL(14,2),
    "forma_pagamento" "PaymentMethod",
    "observacoes" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursements" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "cost_center" TEXT,
    "status" "ReimbursementStatus" NOT NULL DEFAULT 'ENVIADO',
    "decided_by_id" TEXT,
    "decided_at" TIMESTAMP(3),
    "decision_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reimbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursement_items" (
    "id" TEXT NOT NULL,
    "reimbursement_id" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "categoria" "ExpenseCategory" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "reimbursement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reimbursement_attachments" (
    "id" TEXT NOT NULL,
    "reimbursement_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reimbursement_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" "DocumentCategory" NOT NULL DEFAULT 'OUTRO',
    "tags" TEXT[],
    "valido_ate" DATE,
    "conteudo" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "supplier_id" TEXT,
    "contract_id" TEXT,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_events" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "AgendaEventType" NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "dia_inteiro" BOOLEAN NOT NULL DEFAULT false,
    "obra" TEXT,
    "local" TEXT,
    "supplier_id" TEXT,
    "purchase_request_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_company_id_idx" ON "contracts"("company_id");

-- CreateIndex
CREATE INDEX "contracts_company_id_status_idx" ON "contracts"("company_id", "status");

-- CreateIndex
CREATE INDEX "contracts_company_id_data_fim_idx" ON "contracts"("company_id", "data_fim");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_company_id_numero_key" ON "contracts"("company_id", "numero");

-- CreateIndex
CREATE INDEX "contract_amendments_contract_id_idx" ON "contract_amendments"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "contract_amendments_contract_id_numero_key" ON "contract_amendments"("contract_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "payables_reimbursement_id_key" ON "payables"("reimbursement_id");

-- CreateIndex
CREATE INDEX "payables_company_id_idx" ON "payables"("company_id");

-- CreateIndex
CREATE INDEX "payables_company_id_status_idx" ON "payables"("company_id", "status");

-- CreateIndex
CREATE INDEX "payables_company_id_vencimento_idx" ON "payables"("company_id", "vencimento");

-- CreateIndex
CREATE INDEX "reimbursements_company_id_idx" ON "reimbursements"("company_id");

-- CreateIndex
CREATE INDEX "reimbursements_company_id_status_idx" ON "reimbursements"("company_id", "status");

-- CreateIndex
CREATE INDEX "reimbursements_company_id_requester_id_idx" ON "reimbursements"("company_id", "requester_id");

-- CreateIndex
CREATE INDEX "reimbursement_items_reimbursement_id_idx" ON "reimbursement_items"("reimbursement_id");

-- CreateIndex
CREATE INDEX "reimbursement_attachments_reimbursement_id_idx" ON "reimbursement_attachments"("reimbursement_id");

-- CreateIndex
CREATE INDEX "documents_company_id_idx" ON "documents"("company_id");

-- CreateIndex
CREATE INDEX "documents_company_id_categoria_idx" ON "documents"("company_id", "categoria");

-- CreateIndex
CREATE INDEX "documents_company_id_valido_ate_idx" ON "documents"("company_id", "valido_ate");

-- CreateIndex
CREATE INDEX "documents_contract_id_idx" ON "documents"("contract_id");

-- CreateIndex
CREATE INDEX "agenda_events_company_id_idx" ON "agenda_events"("company_id");

-- CreateIndex
CREATE INDEX "agenda_events_company_id_inicio_idx" ON "agenda_events"("company_id", "inicio");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_amendments" ADD CONSTRAINT "contract_amendments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_reimbursement_id_fkey" FOREIGN KEY ("reimbursement_id") REFERENCES "reimbursements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payables" ADD CONSTRAINT "payables_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursements" ADD CONSTRAINT "reimbursements_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_items" ADD CONSTRAINT "reimbursement_items_reimbursement_id_fkey" FOREIGN KEY ("reimbursement_id") REFERENCES "reimbursements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_attachments" ADD CONSTRAINT "reimbursement_attachments_reimbursement_id_fkey" FOREIGN KEY ("reimbursement_id") REFERENCES "reimbursements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reimbursement_attachments" ADD CONSTRAINT "reimbursement_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
