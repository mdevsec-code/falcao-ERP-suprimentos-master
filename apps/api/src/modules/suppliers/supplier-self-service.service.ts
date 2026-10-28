import { ForbiddenException, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { Prisma, type Supplier } from "@prisma/client";
import { buildSupplierSearchText, cnpjDigits, formatCnpjMask } from "@falcao-erp/shared-types";
import { PrismaService } from "../../database/prisma.service";
import { PublicSupplierIdentityDto } from "./dto/public-supplier-identity.dto";

/** Resposta 422 que a tela pública usa para mostrar o formulário de cadastro. */
export const REGISTRATION_REQUIRED_MESSAGE = "CNPJ não cadastrado. Preencha os dados da empresa para continuar.";

/**
 * Fornecedor que chega por um link público (cotação aberta ou catálogo) se
 * identifica pelo CNPJ. CNPJ conhecido → usa o cadastro existente. CNPJ novo →
 * cria o cadastro como *pendente* (inativo) até compras revisar.
 */
@Injectable()
export class SupplierSelfServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveOrRegister(
    companyId: string,
    dto: PublicSupplierIdentityDto,
  ): Promise<{ supplier: Supplier; created: boolean }> {
    const existing = await this.findByCnpj(companyId, dto.cnpj);
    if (existing) return { supplier: this.assertUsable(existing), created: false };

    const cadastro = dto.cadastro;
    if (!cadastro) throw new UnprocessableEntityException(REGISTRATION_REQUIRED_MESSAGE);

    const fields = {
      cnpj: formatCnpjMask(dto.cnpj),
      razaoSocial: cadastro.razaoSocial.trim(),
      nomeFantasia: cadastro.nomeFantasia.trim(),
      categoria: cadastro.categoria ?? "OUTROS",
      cidade: cadastro.cidade.trim(),
      estado: cadastro.estado,
    };
    try {
      const supplier = await this.prisma.supplier.create({
        data: {
          companyId,
          ...fields,
          searchText: buildSupplierSearchText(fields),
          responsavel: dto.nomeResponsavel.trim(),
          isActive: false,
          cadastroPendente: true,
          contacts: {
            create: [
              { type: "EMAIL", label: "Cadastro pelo link", value: cadastro.email.trim() },
              { type: "PHONE", label: "Cadastro pelo link", value: cadastro.telefone.trim() },
            ],
          },
        },
      });
      return { supplier, created: true };
    } catch (error) {
      // Dois envios simultâneos com o mesmo CNPJ: o segundo usa o cadastro do primeiro.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const raced = await this.findByCnpj(companyId, dto.cnpj);
        if (raced) return { supplier: this.assertUsable(raced), created: false };
      }
      throw error;
    }
  }

  /** O CNPJ pode estar gravado com ou sem máscara. */
  private findByCnpj(companyId: string, cnpj: string) {
    return this.prisma.supplier.findFirst({
      where: { companyId, cnpj: { in: [cnpjDigits(cnpj), formatCnpjMask(cnpj)] } },
    });
  }

  /** Fornecedor desativado por compras não volta a participar pelo link. */
  private assertUsable(supplier: Supplier): Supplier {
    if (!supplier.isActive && !supplier.cadastroPendente) {
      throw new ForbiddenException("Este cadastro está inativo. Entre em contato com o setor de compras.");
    }
    return supplier;
  }
}
