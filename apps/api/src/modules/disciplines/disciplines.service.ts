import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { DisciplineDto } from "@falcao-erp/shared-types";
import { PrismaService } from "../../database/prisma.service";
import { CreateDisciplineDto, UpdateDisciplineDto } from "./dto/discipline.dto";

@Injectable()
export class DisciplinesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string, includeInactive: boolean): Promise<DisciplineDto[]> {
    const disciplines = await this.prisma.forCompany(companyId).discipline.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
    return disciplines.map((d) => ({
      id: d.id,
      nome: d.nome,
      ordem: d.ordem,
      isActive: d.isActive,
      productCount: d._count.products,
    }));
  }

  async create(companyId: string, dto: CreateDisciplineDto): Promise<DisciplineDto> {
    await this.assertNameFree(companyId, dto.nome);
    const client = this.prisma.forCompany(companyId);
    const last = await client.discipline.findFirst({ orderBy: { ordem: "desc" } });
    const discipline = await client.discipline.create({
      data: { companyId, nome: dto.nome.trim(), ordem: dto.ordem ?? (last ? last.ordem + 1 : 1) },
    });
    return { id: discipline.id, nome: discipline.nome, ordem: discipline.ordem, isActive: discipline.isActive, productCount: 0 };
  }

  async update(companyId: string, id: string, dto: UpdateDisciplineDto): Promise<DisciplineDto> {
    const client = this.prisma.forCompany(companyId);
    const existing = await client.discipline.findFirst({ where: { id } });
    if (!existing) throw new NotFoundException("Disciplina não encontrada.");
    if (dto.nome && dto.nome.trim().toLowerCase() !== existing.nome.toLowerCase()) {
      await this.assertNameFree(companyId, dto.nome, id);
    }
    await client.discipline.update({
      where: { id },
      data: { nome: dto.nome?.trim(), ordem: dto.ordem, isActive: dto.isActive },
    });
    const [updated] = (await this.list(companyId, true)).filter((d) => d.id === id);
    return updated;
  }

  private async assertNameFree(companyId: string, nome: string, ignoreId?: string): Promise<void> {
    const clash = await this.prisma.forCompany(companyId).discipline.findFirst({
      where: { nome: { equals: nome.trim(), mode: "insensitive" }, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
    });
    if (clash) throw new ConflictException("Já existe uma disciplina com este nome.");
  }
}
