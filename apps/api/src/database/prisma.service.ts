import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma";

/**
 * Every tenant-scoped model gets its `where`/`data` injected with the
 * caller's companyId at the query layer, so a missing filter in a
 * repository can never leak another company's rows.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ adapter: new PrismaPg(config.getOrThrow<string>("DATABASE_URL")) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  forCompany(companyId: string) {
    return this.$extends({
      query: {
        supplier: {
          findMany: ({ args, query }) => query(withWhere(args, companyId)),
          findFirst: ({ args, query }) => query(withWhere(args, companyId)),
          findUnique: ({ args, query }) => query(withWhere(args, companyId)),
          count: ({ args, query }) => query(withWhere(args, companyId)),
          update: ({ args, query }) => query(withWhere(args, companyId)),
          updateMany: ({ args, query }) => query(withWhere(args, companyId)),
          delete: ({ args, query }) => query(withWhere(args, companyId)),
          create: ({ args, query }) => query(withData(args, companyId)),
        },
        product: {
          findMany: ({ args, query }) => query(withWhere(args, companyId)),
          findFirst: ({ args, query }) => query(withWhere(args, companyId)),
          findUnique: ({ args, query }) => query(withWhere(args, companyId)),
          count: ({ args, query }) => query(withWhere(args, companyId)),
          update: ({ args, query }) => query(withWhere(args, companyId)),
          updateMany: ({ args, query }) => query(withWhere(args, companyId)),
          delete: ({ args, query }) => query(withWhere(args, companyId)),
          create: ({ args, query }) => query(withData(args, companyId)),
        },
        purchaseRequest: {
          findMany: ({ args, query }) => query(withWhere(args, companyId)),
          findFirst: ({ args, query }) => query(withWhere(args, companyId)),
          findUnique: ({ args, query }) => query(withWhere(args, companyId)),
          count: ({ args, query }) => query(withWhere(args, companyId)),
          update: ({ args, query }) => query(withWhere(args, companyId)),
          updateMany: ({ args, query }) => query(withWhere(args, companyId)),
          delete: ({ args, query }) => query(withWhere(args, companyId)),
          create: ({ args, query }) => query(withData(args, companyId)),
        },
        auditLog: {
          findMany: ({ args, query }) => query(withWhere(args, companyId)),
          count: ({ args, query }) => query(withWhere(args, companyId)),
          create: ({ args, query }) => query(withData(args, companyId)),
        },
      },
    });
  }
}

type QueryArgs = Record<string, unknown>;

function withWhere<T extends QueryArgs>(args: T, companyId: string): T {
  return { ...args, where: { ...(args.where as Record<string, unknown>), companyId } };
}

function withData<T extends QueryArgs>(args: T, companyId: string): T {
  return { ...args, data: { ...(args.data as Record<string, unknown>), companyId } };
}
