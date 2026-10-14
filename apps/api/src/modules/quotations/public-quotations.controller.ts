import { Body, Controller, Get, Param, Post, Put } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/decorators/public.decorator";
import { PublicDeclineQuotationDto, PublicSubmitQuotationDto } from "./dto/quotation.dto";
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
