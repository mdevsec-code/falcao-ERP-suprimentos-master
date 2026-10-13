import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const prisma = prismaErrorStatus(exception);
    if (prisma) {
      response.status(prisma.status).json({
        error: { statusCode: prisma.status, message: prisma.message, timestamp: new Date().toISOString() },
      });
      return;
    }

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = isHttpException ? exception.getResponse() : null;
    const message =
      body && typeof body === "object" && "message" in body
        ? (body as { message: string | string[] }).message
        : isHttpException
          ? exception.message
          : "Erro interno do servidor.";

    if (!isHttpException) {
      this.logger.error(exception);
    }

    response.status(status).json({
      error: {
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Erros conhecidos (Prisma, Express, sistema de arquivos) que são culpa da requisição (corrida em campo
 * único, registro sumido, vínculo inválido) — sem isso viram 500.
 */
function prismaErrorStatus(exception: unknown): { status: number; message: string } | null {
  // Erros do Express/serve-static (http-errors) já trazem o status 4xx; arquivo inexistente é 404.
  const httpStatus = (exception as { status?: unknown })?.status;
  if (typeof httpStatus === "number" && httpStatus >= 400 && httpStatus < 500 && !(exception instanceof HttpException)) {
    return { status: httpStatus, message: "Requisição inválida." };
  }
  const code = (exception as { code?: unknown })?.code;
  if (typeof code !== "string") return null;
  switch (code) {
    case "ENOENT":
      return { status: HttpStatus.NOT_FOUND, message: "Arquivo não encontrado." };
    case "P2002":
      return { status: HttpStatus.CONFLICT, message: "Já existe um registro com estes dados." };
    case "P2025":
      return { status: HttpStatus.NOT_FOUND, message: "Registro não encontrado." };
    case "P2003":
      return { status: HttpStatus.BAD_REQUEST, message: "Referência inválida." };
    default:
      return null;
  }
}
