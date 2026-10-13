import { config } from "dotenv";
// `.env` do app primeiro; depois o da raiz do monorepo.
config({ path: [".env", "../../.env"] });
import * as bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.upsert({
    where: { cnpj: "12.345.678/0001-90" },
    update: {},
    create: {
      name: "Falcão Engenharia",
      cnpj: "12.345.678/0001-90",
    },
  });

  const passwordHash = await bcrypt.hash("Falcao@123", 10);

  await prisma.user.upsert({
    where: { email: "admin@falcaoengenharia.com.br" },
    update: {},
    create: {
      companyId: company.id,
      name: "Administrador Falcão",
      email: "admin@falcaoengenharia.com.br",
      passwordHash,
      role: "ADMIN",
    },
  });

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@falcaoengenharia.com.br" },
  });

  const suppliers = [
    {
      razaoSocial: "Aço Forte Materiais de Construção Ltda",
      nomeFantasia: "Aço Forte",
      cnpj: "11.222.333/0001-44",
      categoria: "MATERIAIS_CONSTRUCAO" as const,
      cidade: "Belo Horizonte",
      estado: "MG",
      responsavel: "Carlos Mendes",
      contacts: [
        { type: "PHONE" as const, label: "Comercial", value: "(31) 3222-1000" },
        { type: "EMAIL" as const, label: "Vendas", value: "vendas@acoforte.com.br" },
      ],
    },
    {
      razaoSocial: "TerraMáquinas Equipamentos Pesados S.A.",
      nomeFantasia: "TerraMáquinas",
      cnpj: "22.333.444/0001-55",
      categoria: "EQUIPAMENTOS" as const,
      cidade: "Contagem",
      estado: "MG",
      responsavel: "Renata Silva",
      contacts: [{ type: "PHONE" as const, label: "Comercial", value: "(31) 3399-2020" }],
    },
    {
      razaoSocial: "Engenharia & Consultoria Vetor Ltda",
      nomeFantasia: "Vetor Consultoria",
      cnpj: "33.444.555/0001-66",
      categoria: "CONSULTORIA" as const,
      cidade: "São Paulo",
      estado: "SP",
      responsavel: "Fernanda Ramos",
      contacts: [{ type: "EMAIL" as const, label: "Contato", value: "contato@vetorconsultoria.com.br" }],
    },
    {
      razaoSocial: "Transportadora Rota Certa Ltda",
      nomeFantasia: "Rota Certa",
      cnpj: "44.555.666/0001-77",
      categoria: "TRANSPORTE_LOGISTICA" as const,
      cidade: "Betim",
      estado: "MG",
      responsavel: "João Pedro Alves",
      contacts: [{ type: "PHONE" as const, label: "Logística", value: "(31) 3512-8080" }],
    },
    {
      razaoSocial: "MãoDeObra Especializada Construtiva Ltda",
      nomeFantasia: "Construtiva RH",
      cnpj: "55.666.777/0001-88",
      categoria: "MAO_DE_OBRA" as const,
      cidade: "Belo Horizonte",
      estado: "MG",
      responsavel: "Ana Paula Costa",
      contacts: [{ type: "EMAIL" as const, label: "RH", value: "rh@construtivarh.com.br" }],
    },
    {
      razaoSocial: "TechField Sistemas para Engenharia Ltda",
      nomeFantasia: "TechField",
      cnpj: "66.777.888/0001-99",
      categoria: "TECNOLOGIA" as const,
      cidade: "São Paulo",
      estado: "SP",
      responsavel: "Bruno Tanaka",
      contacts: [{ type: "EMAIL" as const, label: "Suporte", value: "suporte@techfield.com.br" }],
    },
  ];

  for (const supplierData of suppliers) {
    const { contacts, ...supplierFields } = supplierData;
    const existing = await prisma.supplier.findUnique({
      where: { companyId_cnpj: { companyId: company.id, cnpj: supplierFields.cnpj } },
    });
    if (existing) continue;

    const supplier = await prisma.supplier.create({
      data: {
        ...supplierFields,
        companyId: company.id,
        contacts: { createMany: { data: contacts } },
      },
    });

    await prisma.supplierEvaluation.create({
      data: {
        supplierId: supplier.id,
        authorId: admin.id,
        score: 4,
        comment: "Bom histórico de entregas e qualidade.",
      },
    });
  }

  await seedOperations(company.id, admin.id, passwordHash);

  // eslint-disable-next-line no-console
  console.log("Seed concluído. Login: admin@falcaoengenharia.com.br / senha: Falcao@123");
}

/** `YYYY-MM-DD` de hoje + `offset` dias, como `Date` de coluna `@db.Date`. */
function day(offset: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + offset));
}

/** Data/hora local de hoje + `offset` dias, às `hour`:`minute`. */
function at(offset: number, hour: number, minute = 0): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour, minute);
}

/**
 * Dados de demonstração de Contratos, Financeiro, Reembolsos, Documentos e
 * Agenda, com datas relativas a hoje. Só roda numa base sem contratos.
 */
async function seedOperations(companyId: string, adminId: string, passwordHash: string) {
  if ((await prisma.contract.count({ where: { companyId } })) > 0) return;

  const gestor = await prisma.user.upsert({
    where: { email: "gestor@falcaoengenharia.com.br" },
    update: {},
    create: {
      companyId,
      name: "Marina Lopes",
      email: "gestor@falcaoengenharia.com.br",
      passwordHash,
      role: "MANAGER",
    },
  });
  const solicitante = await prisma.user.upsert({
    where: { email: "carlos@falcaoengenharia.com.br" },
    update: {},
    create: {
      companyId,
      name: "Carlos Souza",
      email: "carlos@falcaoengenharia.com.br",
      passwordHash,
      role: "REQUESTER",
    },
  });

  const supplierByName = async (nomeFantasia: string) =>
    prisma.supplier.findFirstOrThrow({ where: { companyId, nomeFantasia } });
  const acoForte = await supplierByName("Aço Forte");
  const terra = await supplierByName("TerraMáquinas");
  const vetor = await supplierByName("Vetor Consultoria");
  const rota = await supplierByName("Rota Certa");

  const OBRA_ALFA = "Obra Residencial Alfa";
  const OBRA_GALPAO = "Obra Galpão Contagem";
  const ADM = "Administrativo";

  // ── Contratos ────────────────────────────────────────────
  const locacao = await prisma.contract.create({
    data: {
      companyId,
      supplierId: terra.id,
      numero: "CT-2026-001",
      objeto: "Locação de escavadeira hidráulica 20t",
      descricao: "Locação mensal com operador, manutenção preventiva inclusa.",
      costCenter: OBRA_ALFA,
      valorTotal: 186000,
      dataInicio: day(-200),
      dataFim: day(18),
      assinadoEm: day(-205),
      alertaDias: 30,
      createdById: adminId,
    },
  });
  await prisma.contractAmendment.create({
    data: {
      contractId: locacao.id,
      numero: 1,
      descricao: "Prorrogação por 60 dias e reajuste pelo IGP-M.",
      valorDelta: 24000,
      novaDataFim: day(18),
      authorId: adminId,
    },
  });
  const fornecimento = await prisma.contract.create({
    data: {
      companyId,
      supplierId: acoForte.id,
      numero: "CT-2026-002",
      objeto: "Fornecimento de aço CA-50 e CA-60",
      costCenter: OBRA_GALPAO,
      valorTotal: 342500,
      dataInicio: day(-90),
      dataFim: day(275),
      assinadoEm: day(-92),
      alertaDias: 45,
      createdById: adminId,
    },
  });
  const consultoria = await prisma.contract.create({
    data: {
      companyId,
      supplierId: vetor.id,
      numero: "CT-2025-014",
      objeto: "Consultoria em gestão de obras",
      costCenter: ADM,
      valorTotal: 96000,
      dataInicio: day(-380),
      dataFim: day(-12),
      assinadoEm: day(-381),
      alertaDias: 30,
      createdById: adminId,
    },
  });
  await prisma.contract.create({
    data: {
      companyId,
      supplierId: rota.id,
      numero: "CT-2025-009",
      objeto: "Transporte de materiais entre obras",
      costCenter: OBRA_ALFA,
      valorTotal: 54000,
      dataInicio: day(-400),
      dataFim: day(-35),
      status: "ENCERRADO",
      createdById: adminId,
    },
  });

  // ── Contas a pagar (pagas nos últimos meses + em aberto) ─
  const paid: Array<[string, string | null, string | null, number, number, string]> = [
    ["Locação escavadeira — parcela 1", terra.id, locacao.id, 31000, -150, OBRA_ALFA],
    ["Locação escavadeira — parcela 2", terra.id, locacao.id, 31000, -120, OBRA_ALFA],
    ["Locação escavadeira — parcela 3", terra.id, locacao.id, 31000, -90, OBRA_ALFA],
    ["Locação escavadeira — parcela 4", terra.id, locacao.id, 31000, -60, OBRA_ALFA],
    ["Aço CA-50 — lote 1", acoForte.id, fornecimento.id, 68500, -75, OBRA_GALPAO],
    ["Aço CA-50 — lote 2", acoForte.id, fornecimento.id, 72300, -40, OBRA_GALPAO],
    ["Consultoria — trimestre 3", vetor.id, consultoria.id, 24000, -100, ADM],
    ["Consultoria — trimestre 4", vetor.id, consultoria.id, 24000, -15, ADM],
    ["Frete Betim → Contagem", rota.id, null, 4800, -25, OBRA_GALPAO],
  ];
  for (const [descricao, supplierId, contractId, valor, offset, costCenter] of paid) {
    await prisma.payable.create({
      data: {
        companyId,
        descricao,
        origem: contractId ? "CONTRATO" : "MANUAL",
        supplierId,
        contractId,
        costCenter,
        valor,
        vencimento: day(offset),
        status: "PAGO",
        pagoEm: day(offset - 1),
        valorPago: valor,
        formaPagamento: "BOLETO",
        notaFiscal: `NF ${10000 + Math.abs(offset) * 7}`,
        notaFiscalEmissao: day(offset - 10),
        createdById: adminId,
      },
    });
  }

  const open: Array<[string, string | null, string | null, number, number, string, string | null]> = [
    ["Locação escavadeira — parcela 5", terra.id, locacao.id, 31000, -4, OBRA_ALFA, "NF 15542"],
    ["Aço CA-60 — lote 3", acoForte.id, fornecimento.id, 54200, 3, OBRA_GALPAO, null],
    ["Locação escavadeira — parcela 6", terra.id, locacao.id, 31000, 26, OBRA_ALFA, null],
    ["Frete de equipamentos", rota.id, null, 3900, 6, OBRA_ALFA, "NF 8811"],
    ["Licença anual de software de orçamento", null, null, 12800, 41, ADM, null],
    ["Aço CA-50 — lote 4", acoForte.id, fornecimento.id, 70100, 55, OBRA_GALPAO, null],
  ];
  for (const [descricao, supplierId, contractId, valor, offset, costCenter, notaFiscal] of open) {
    await prisma.payable.create({
      data: {
        companyId,
        descricao,
        origem: contractId ? "CONTRATO" : "MANUAL",
        supplierId,
        contractId,
        costCenter,
        valor,
        vencimento: day(offset),
        notaFiscal,
        createdById: adminId,
      },
    });
  }

  // ── Reembolsos ───────────────────────────────────────────
  await prisma.reimbursement.create({
    data: {
      companyId,
      requesterId: solicitante.id,
      titulo: "Visita técnica à obra Galpão Contagem",
      costCenter: OBRA_GALPAO,
      items: {
        createMany: {
          data: [
            { data: day(-3), categoria: "COMBUSTIVEL", descricao: "Abastecimento — 42 L", valor: 268.4 },
            { data: day(-3), categoria: "ALIMENTACAO", descricao: "Almoço com equipe", valor: 86.5 },
            { data: day(-2), categoria: "TRANSPORTE", descricao: "Pedágio ida e volta", valor: 32.8 },
          ],
        },
      },
    },
  });
  const aprovado = await prisma.reimbursement.create({
    data: {
      companyId,
      requesterId: solicitante.id,
      titulo: "Compra emergencial de EPI",
      costCenter: OBRA_ALFA,
      status: "APROVADO",
      decidedById: gestor.id,
      decidedAt: at(-6, 15),
      decisionComment: "Compra justificada pela vistoria.",
      items: {
        createMany: {
          data: [{ data: day(-9), categoria: "MATERIAL", descricao: "Luvas e óculos de proteção", valor: 412.9 }],
        },
      },
    },
  });
  await prisma.payable.create({
    data: {
      companyId,
      descricao: "Reembolso: Compra emergencial de EPI — Carlos Souza",
      origem: "REEMBOLSO",
      reimbursementId: aprovado.id,
      costCenter: OBRA_ALFA,
      valor: 412.9,
      vencimento: day(1),
      createdById: gestor.id,
    },
  });
  await prisma.reimbursement.create({
    data: {
      companyId,
      requesterId: gestor.id,
      titulo: "Hospedagem — auditoria de fornecedor em São Paulo",
      costCenter: ADM,
      items: {
        createMany: {
          data: [
            { data: day(-12), categoria: "HOSPEDAGEM", descricao: "Hotel — 2 diárias", valor: 780 },
            { data: day(-12), categoria: "TRANSPORTE", descricao: "Táxi aeroporto", valor: 118 },
          ],
        },
      },
    },
  });

  // ── Documentos (arquivos de texto reais em UPLOADS_DIR) ──
  const uploadsDir = process.env.UPLOADS_DIR ?? "./uploads";
  await mkdir(join(uploadsDir, "documents"), { recursive: true });
  const documents: Array<{
    titulo: string;
    categoria: "CERTIDAO" | "LICENCA" | "APOLICE" | "POLITICA" | "CONTRATO";
    tags: string[];
    validoAte: Date | null;
    fileName: string;
    content: string;
    supplierId?: string;
    contractId?: string;
  }> = [
    {
      titulo: "Certidão negativa de débitos federais — Aço Forte",
      categoria: "CERTIDAO",
      tags: ["fiscal", "fornecedor"],
      validoAte: day(12),
      fileName: "cnd-aco-forte.txt",
      content: "Certidão negativa de débitos relativos a tributos federais. Contribuinte: Aço Forte Materiais de Construção Ltda.",
      supplierId: acoForte.id,
    },
    {
      titulo: "Alvará de construção — Obra Residencial Alfa",
      categoria: "LICENCA",
      tags: ["obra alfa", "prefeitura"],
      validoAte: day(140),
      fileName: "alvara-obra-alfa.txt",
      content: "Alvará de construção nº 2026/0451 emitido pela Prefeitura de Belo Horizonte para a Obra Residencial Alfa.",
    },
    {
      titulo: "Apólice de seguro de equipamentos",
      categoria: "APOLICE",
      tags: ["seguro", "equipamentos"],
      validoAte: day(-5),
      fileName: "apolice-equipamentos.txt",
      content: "Apólice de seguro de equipamentos pesados, cobertura contra roubo, incêndio e danos elétricos.",
    },
    {
      titulo: "Política de compras e alçadas de aprovação",
      categoria: "POLITICA",
      tags: ["compras", "governança"],
      validoAte: null,
      fileName: "politica-de-compras.md",
      content: "# Política de compras\n\nCompras acima de R$ 50.000,00 exigem três cotações e aprovação da diretoria.",
    },
    {
      titulo: "Contrato assinado — locação de escavadeira",
      categoria: "CONTRATO",
      tags: ["obra alfa", "locação"],
      validoAte: null,
      fileName: "contrato-ct-2026-001.txt",
      content: "Contrato de locação de escavadeira hidráulica 20t entre Falcão Engenharia e TerraMáquinas.",
      supplierId: terra.id,
      contractId: locacao.id,
    },
  ];
  for (const doc of documents) {
    const relativePath = `documents/${randomUUID()}${extname(doc.fileName)}`;
    const buffer = Buffer.from(doc.content, "utf8");
    await writeFile(join(uploadsDir, relativePath), buffer);
    await prisma.document.create({
      data: {
        companyId,
        titulo: doc.titulo,
        categoria: doc.categoria,
        tags: doc.tags,
        validoAte: doc.validoAte,
        conteudo: doc.content,
        fileName: doc.fileName,
        filePath: relativePath,
        mimeType: doc.fileName.endsWith(".md") ? "text/markdown" : "text/plain",
        size: buffer.length,
        supplierId: doc.supplierId,
        contractId: doc.contractId,
        uploadedById: adminId,
      },
    });
  }

  // ── Agenda ───────────────────────────────────────────────
  const events: Array<{
    titulo: string;
    tipo: "ENTREGA" | "RECEBIMENTO" | "VISITA" | "REUNIAO" | "LEMBRETE";
    inicio: Date;
    fim?: Date;
    diaInteiro?: boolean;
    obra?: string;
    local?: string;
    supplierId?: string;
  }> = [
    { titulo: "Entrega de aço CA-60 (lote 3)", tipo: "ENTREGA", inicio: at(2, 8), fim: at(2, 11), obra: OBRA_GALPAO, local: "Portão 2", supplierId: acoForte.id },
    { titulo: "Visita técnica — TerraMáquinas", tipo: "VISITA", inicio: at(5, 14), fim: at(5, 16), obra: OBRA_ALFA, supplierId: terra.id },
    { titulo: "Reunião de alinhamento de compras", tipo: "REUNIAO", inicio: at(1, 9, 30), fim: at(1, 10, 30), local: "Sala de reuniões" },
    { titulo: "Recebimento de EPIs", tipo: "RECEBIMENTO", inicio: at(-2, 10), obra: OBRA_ALFA, local: "Almoxarifado" },
    { titulo: "Renovar certidões dos fornecedores", tipo: "LEMBRETE", inicio: at(9, 0), diaInteiro: true },
    { titulo: "Inventário do almoxarifado", tipo: "LEMBRETE", inicio: at(14, 0), diaInteiro: true, obra: OBRA_GALPAO },
  ];
  for (const event of events) {
    await prisma.agendaEvent.create({ data: { companyId, createdById: adminId, ...event } });
  }
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
