import { Module } from "@nestjs/common";
import { ContractsController } from "./contracts.controller";
import { ContractsRepository } from "./contracts.repository";
import { ContractsService } from "./contracts.service";

@Module({
  controllers: [ContractsController],
  providers: [ContractsService, ContractsRepository],
})
export class ContractsModule {}
