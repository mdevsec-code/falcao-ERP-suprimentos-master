import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException("Empresa não encontrada.");
    }
    return company;
  }
}
