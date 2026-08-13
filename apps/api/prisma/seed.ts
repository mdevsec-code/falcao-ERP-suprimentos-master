import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient({
  adapter: new PrismaPg(process.env.DATABASE_URL as string),
});

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

  // eslint-disable-next-line no-console
  console.log("Seed concluído. Login: admin@falcaoengenharia.com.br / senha: Falcao@123");
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
