import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { CONTRACT_READ_ROLES, CONTRACT_WRITE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { ChangeContractStatusDto } from "./dto/change-contract-status.dto";
import { CreateAmendmentDto } from "./dto/create-amendment.dto";
import { CreateContractDto } from "./dto/create-contract.dto";
import { QueryContractsDto } from "./dto/query-contracts.dto";
import { UpdateContractDto } from "./dto/update-contract.dto";
import { ContractsService } from "./contracts.service";

@Roles(...CONTRACT_READ_ROLES)
@Controller("contracts")
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryContractsDto) {
    return this.contractsService.list(user.companyId, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.stats(user.companyId);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.contractsService.getById(user.companyId, id);
  }

  @Roles(...CONTRACT_WRITE_ROLES)
  @AuditLog("Contract", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContractDto) {
    return this.contractsService.create(user.companyId, user.userId, dto);
  }

  @Roles(...CONTRACT_WRITE_ROLES)
  @AuditLog("Contract", "UPDATE")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(user.companyId, id, dto);
  }

  @Roles(...CONTRACT_WRITE_ROLES)
  @AuditLog("Contract", "UPDATE")
  @Patch(":id/status")
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ChangeContractStatusDto,
  ) {
    return this.contractsService.changeStatus(user.companyId, id, dto.status);
  }

  @Roles(...CONTRACT_WRITE_ROLES)
  @AuditLog("Contract", "UPDATE")
  @Post(":id/amendments")
  addAmendment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateAmendmentDto,
  ) {
    return this.contractsService.addAmendment(user.companyId, id, user.userId, dto);
  }
}
