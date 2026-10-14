import { MAX_UPLOAD_BYTES } from "../storage/upload-policy";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import {
  REIMBURSEMENT_DECIDE_ROLES,
  REIMBURSEMENT_REQUEST_ROLES,
} from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { CreateReimbursementDto } from "./dto/create-reimbursement.dto";
import { DecideReimbursementDto } from "./dto/decide-reimbursement.dto";
import { QueryReimbursementsDto } from "./dto/query-reimbursements.dto";
import { ReimbursementsService } from "./reimbursements.service";

@Controller("reimbursements")
export class ReimbursementsController {
  constructor(private readonly reimbursementsService: ReimbursementsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryReimbursementsDto) {
    return this.reimbursementsService.list(user, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.reimbursementsService.stats(user);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.reimbursementsService.getById(user, id);
  }

  @Roles(...REIMBURSEMENT_REQUEST_ROLES)
  @AuditLog("Reimbursement", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReimbursementDto) {
    return this.reimbursementsService.create(user, dto);
  }

  @Roles(...REIMBURSEMENT_REQUEST_ROLES)
  @AuditLog("Reimbursement", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.reimbursementsService.remove(user, id);
  }

  @Roles(...REIMBURSEMENT_DECIDE_ROLES)
  @AuditLog("Reimbursement", "UPDATE")
  @Patch(":id/decision")
  decide(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: DecideReimbursementDto) {
    return this.reimbursementsService.decide(user, id, dto);
  }

  @Roles(...REIMBURSEMENT_REQUEST_ROLES)
  @Post(":id/attachments")
  @UseInterceptors(FileInterceptor("file"))
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.reimbursementsService.addAttachment(user, id, file);
  }

  @Roles(...REIMBURSEMENT_REQUEST_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id/attachments/:attachmentId")
  removeAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("attachmentId") attachmentId: string,
  ) {
    return this.reimbursementsService.removeAttachment(user, id, attachmentId);
  }
}
