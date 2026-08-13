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
