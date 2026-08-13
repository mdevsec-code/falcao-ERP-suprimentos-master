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
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { AddCommentDto } from "./dto/add-comment.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { QueryPurchaseRequestsDto } from "./dto/query-purchase-requests.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import { PurchaseRequestsService } from "./purchase-requests.service";

const PARTICIPANT_ROLES = ["ADMIN", "MANAGER", "BUYER", "FINANCE", "WAREHOUSE", "REQUESTER"] as const;

@Controller("purchase-requests")
export class PurchaseRequestsController {
  constructor(private readonly purchaseRequestsService: PurchaseRequestsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPurchaseRequestsDto) {
    return this.purchaseRequestsService.list(user.companyId, user.userId, user.role, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.purchaseRequestsService.stats(user.companyId, user.userId, user.role);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseRequestsService.getById(user.companyId, id);
  }

  @Get(":id/timeline")
  getTimeline(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseRequestsService.getTimeline(user.companyId, id);
  }

  @Roles(...PARTICIPANT_ROLES)
  @AuditLog("PurchaseRequest", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseRequestDto) {
    return this.purchaseRequestsService.create(user.companyId, user.userId, dto);
  }

  @Roles(...PARTICIPANT_ROLES)
  @AuditLog("PurchaseRequest", "UPDATE")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdatePurchaseRequestDto,
  ) {
    return this.purchaseRequestsService.update(user.companyId, id, user.userId, user.role, dto);
  }

  @AuditLog("PurchaseRequest", "UPDATE")
  @Patch(":id/status")
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.purchaseRequestsService.transition(user.companyId, id, user.userId, user.role, dto);
  }

  @Roles(...PARTICIPANT_ROLES)
  @Post(":id/comments")
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.purchaseRequestsService.addComment(user.companyId, id, user.userId, dto);
  }

  @Roles(...PARTICIPANT_ROLES)
  @Post(":id/attachments")
  @UseInterceptors(FileInterceptor("file"))
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 10 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.purchaseRequestsService.addAttachment(user.companyId, id, user.userId, file);
  }

  @Roles(...PARTICIPANT_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id/attachments/:attachmentId")
  removeAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("attachmentId") attachmentId: string,
  ) {
    return this.purchaseRequestsService.removeAttachment(user.companyId, id, attachmentId);
  }
}
