import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { PublicDeclineQuotationDto, PublicSubmitQuotationDto } from "./dto/quotation.dto";
import { PublicSupplierIdentityDto } from "../suppliers/dto/public-supplier-identity.dto";
import { QuotationsService } from "./quotations.service";

/**
 * Página do fornecedor: sem login, autorizada pelo token assinado do link.
 * Mostra só os itens e a própria resposta — nunca preços de concorrentes.
 */
@Public()
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller("public/quotations")
export class PublicQuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get(":token")
  view(@Param("token") token: string) {
    return this.quotationsService.publicView(token);
  }

  @Put(":token")
  submit(@Param("token") token: string, @Body() dto: PublicSubmitQuotationDto) {
    return this.quotationsService.publicSubmit(token, dto);
  }

  @Post(":token/decline")
  decline(@Param("token") token: string, @Body() dto: PublicDeclineQuotationDto) {
    return this.quotationsService.publicDecline(token, dto);
  }
}

/**
 * Link aberto da cotação (normalmente a de um plano de requisição): qualquer
 * fornecedor vê os itens, informa o CNPJ e recebe o próprio link de resposta.
 */
@Public()
@Controller("public/open-quotations")
export class PublicOpenQuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Get(":token")
  view(@Param("token") token: string) {
    return this.quotationsService.publicOpenView(token);
  }

  /** Mais restrito: pode criar cadastro de fornecedor. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(":token/join")
  join(@Param("token") token: string, @Body() dto: PublicSupplierIdentityDto) {
    return this.quotationsService.publicOpenJoin(token, dto);
  }
}
