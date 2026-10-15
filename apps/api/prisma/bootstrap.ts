import { config } from "dotenv";
// `.env` do app primeiro; depois o da raiz do monorepo.
config({ path: [".env", "../../.env"] });
import * as bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { DEFAULT_DISCIPLINES, MIN_PASSWORD_LENGTH, cnpjDigits, formatCnpjMask, isValidCnpj } from "@falcao-erp/shared-types";

/**
 * Primeira instalação em produção: cria a empresa e o primeiro administrador
 * (o `seed` é só para desenvolvimento — dados fictícios e senha conhecida).
 *
 *   BOOTSTRAP_COMPANY_NAME="Falcão Construções e Engenharia" \
 *   BOOTSTRAP_COMPANY_CNPJ="00.000.000/0001-00" \
 *   BOOTSTRAP_ADMIN_NAME="Fulano" BOOTSTRAP_ADMIN_EMAIL="fulano@empresa.com.br" \
 *   BOOTSTRAP_ADMIN_PASSWORD="senha-forte" npm run prisma:bootstrap -w apps/api
 *
 * Pode rodar de novo sem duplicar nada; se o e-mail já existe, não mexe na senha.
 */
const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Defina a variável ${name}.`);
  return value;
}

async function main() {
  const companyName = required("BOOTSTRAP_COMPANY_NAME");
  const cnpj = required("BOOTSTRAP_COMPANY_CNPJ");
  const adminName = required("BOOTSTRAP_ADMIN_NAME");
  const adminEmail = required("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const adminPassword = required("BOOTSTRAP_ADMIN_PASSWORD");

  if (!isValidCnpj(cnpj)) throw new Error("BOOTSTRAP_COMPANY_CNPJ inválido (confira os dígitos).");
  if (adminPassword.length < Math.max(MIN_PASSWORD_LENGTH, 12)) {
    throw new Error("Use uma senha de administrador com pelo menos 12 caracteres.");
  }

  const masked = formatCnpjMask(cnpj);
  const company =
    (await prisma.company.findFirst({ where: { cnpj: { in: [masked, cnpjDigits(cnpj)] } } })) ??
    (await prisma.company.create({ data: { name: companyName, cnpj: masked } }));
  console.log(`Empresa: ${company.name} (${company.cnpj})`);

  const existingDisciplines = await prisma.discipline.count({ where: { companyId: company.id } });
  if (existingDisciplines === 0) {
    await prisma.discipline.createMany({
      data: DEFAULT_DISCIPLINES.map((nome, index) => ({ companyId: company.id, nome, ordem: index + 1 })),
    });
    console.log(`Disciplinas iniciais criadas: ${DEFAULT_DISCIPLINES.join(", ")}.`);
  }

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log(`Usuário ${adminEmail} já existe — senha mantida.`);
    return;
  }
  await prisma.user.create({
    data: {
      companyId: company.id,
      name: adminName,
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
    },
  });
  console.log(`Administrador criado: ${adminEmail}. Entre no sistema e troque a senha em "Meu perfil" se quiser.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
