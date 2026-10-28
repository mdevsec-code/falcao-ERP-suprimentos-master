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
import { DOCUMENT_WRITE_ROLES } from "../../common/constants/module-roles";
import type { AuthenticatedUser } from "../../common/types/auth-request";
import { DocumentFieldsDto } from "./dto/document-fields.dto";
import { QueryDocumentsDto } from "./dto/query-documents.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { DocumentsService } from "./documents.service";

@Controller("documents")
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryDocumentsDto) {
    return this.documentsService.list(user, query);
  }

  @Get("stats")
  stats(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.stats(user);
  }

  @Get("tags")
  tags(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.tags(user);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.documentsService.getById(user, id);
  }

  @Roles(...DOCUMENT_WRITE_ROLES)
  @AuditLog("Document", "CREATE")
  @Post()
  @UseInterceptors(FileInterceptor("file"))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DocumentFieldsDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: MAX_UPLOAD_BYTES })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentsService.upload(user, dto, file);
  }

  @Roles(...DOCUMENT_WRITE_ROLES)
  @AuditLog("Document", "UPDATE")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(user, id, dto);
  }

  @Roles(...DOCUMENT_WRITE_ROLES)
  @AuditLog("Document", "DELETE")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.documentsService.remove(user, id);
  }
}
