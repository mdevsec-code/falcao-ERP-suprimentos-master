import { MAX_UPLOAD_BYTES } from "../storage/upload-policy";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApprovalStep } from "@falcao-erp/shared-types";
import type { Request } from "express";
import { AuditLog } from "../../common/decorators/audit-log.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { AddCommentDto } from "./dto/add-comment.dto";
import { SetStepApproversDto, SignPurchaseRequestDto } from "./dto/approval.dto";
import { ChangeStatusDto } from "./dto/change-status.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { QueryPurchaseRequestsDto } from "./dto/query-purchase-requests.dto";
import { UpdatePurchaseRequestDto } from "./dto/update-purchase-request.dto";
import { PurchaseRequestApprovalsService } from "./purchase-request-approvals.service";
import { MAX_PHOTO_BYTES, PurchaseRequestsService } from "./purchase-requests.service";

const PARTICIPANT_ROLES = ["ADMIN", "MANAGER", "BUYER", "FINANCE", "WAREHOUSE", "REQUESTER"] as const;

@Controller("purchase-requests")
export class PurchaseRequestsController {
  constructor(
    private readonly purchaseRequestsService: PurchaseRequestsService,
    private readonly approvalsService: PurchaseRequestApprovalsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryPurchaseRequestsDto) {
    return this.purchaseRequestsService.list(user, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.purchaseRequestsService.stats(user);
  }

  // ── Rotas fixas antes de ":id" ────────────────────────────────────────────

  /** Quem assina cada etapa (todos consultam; só o administrador altera). */
  @Get("approval-steps")
  approvalSteps(@CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.stepsConfig(user.companyId);
  }

  @Roles("ADMIN")
  @AuditLog("ApprovalStepApprover", "UPDATE")
  @Put("approval-steps/:step")
  setApprovalStep(
    @CurrentUser() user: AuthenticatedUser,
    @Param("step", new ParseEnumPipe(ApprovalStep)) step: ApprovalStep,
    @Body() dto: SetStepApproversDto,
  ) {
    return this.approvalsService.setStepApprovers(user.companyId, step, dto.userIds);
  }

  /** Assinatura guardada de quem está logado. */
  @Get("my-signature")
  mySignature(@CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.mySignature(user.userId);
  }

  @Delete("my-signature")
  clearMySignature(@CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.clearMySignature(user.userId);
  }

  /** Foto de um item, enviada antes de salvar a solicitação. */
  @Roles(...PARTICIPANT_ROLES)
  @Post("item-photos")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_PHOTO_BYTES } }))
  uploadItemPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(new ParseFilePipeBuilder().addMaxSizeValidator({ maxSize: MAX_PHOTO_BYTES }).build({ fileIsRequired: true }))
    file: Express.Multer.File,
  ) {
    return this.purchaseRequestsService.uploadItemPhoto(user.companyId, file);
  }

  // ── Solicitação ───────────────────────────────────────────────────────────

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.purchaseRequestsService.getById(user, id);
  }

  @Get(":id/timeline")
  getTimeline(@CurrentUser() user: AuthenticatedUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.purchaseRequestsService.getTimeline(user, id);
  }

  @Roles(...PARTICIPANT_ROLES)
  @AuditLog("PurchaseRequest", "CREATE")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseRequestDto) {
    return this.purchaseRequestsService.create(user, dto);
  }

  @Roles(...PARTICIPANT_ROLES)
  @AuditLog("PurchaseRequest", "UPDATE")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePurchaseRequestDto,
  ) {
    return this.purchaseRequestsService.update(user, id, dto);
  }

  @AuditLog("PurchaseRequest", "UPDATE")
  @Patch(":id/status")
  changeStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.purchaseRequestsService.transition(user, id, dto);
  }

  /** Assinatura digital da etapa atual (aprovar ou recusar). */
  @AuditLog("PurchaseRequest", "UPDATE")
  @Post(":id/sign")
  async sign(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SignPurchaseRequestDto,
    @Req() request: Request,
  ) {
    // Mesma regra de visibilidade das outras rotas antes de assinar.
    await this.purchaseRequestsService.findVisibleOrThrow(user, id);
    await this.approvalsService.sign(user, id, dto, {
      ip: request.ip,
      userAgent: request.headers["user-agent"],
    });
    return this.purchaseRequestsService.getById(user, id);
  }

  @Roles(...PARTICIPANT_ROLES)
  @Post(":id/comments")
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.purchaseRequestsService.addComment(user, id, dto);
  }

  @Roles(...PARTICIPANT_ROLES)
  @Post(":id/attachments")
  @UseInterceptors(FileInterceptor("file"))
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.purchaseRequestsService.addAttachment(user, id, file);
  }

  @Roles(...PARTICIPANT_ROLES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id/attachments/:attachmentId")
  removeAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("attachmentId", ParseUUIDPipe) attachmentId: string,
  ) {
    return this.purchaseRequestsService.removeAttachment(user, id, attachmentId);
  }
}
