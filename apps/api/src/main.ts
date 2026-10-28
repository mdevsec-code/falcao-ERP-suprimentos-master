import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import "reflect-metadata";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Atrás de proxy (Hostinger/AWS), o IP real vem no X-Forwarded-For — o limite
  // de requisições dos links públicos de fornecedor depende dele.
  const trustProxy = config.get<number>("TRUST_PROXY") ?? 0;
  if (trustProxy > 0) app.set("trust proxy", trustProxy);

  app.setGlobalPrefix("api/v1");
  // Cabeçalhos de segurança; `cross-origin` permite ao Web (outra origem)
  // abrir os arquivos entregues por /files (links temporários).
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const corsOrigins = (config.get<string>("CORS_ORIGIN") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins.length > 1 ? corsOrigins : corsOrigins[0], credentials: true });

  const port = config.get<number>("PORT") ?? 3333;
  await app.listen(port, config.get<string>("HOST") ?? "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`Falcão ERP API rodando em http://localhost:${port}/api/v1`);
}

bootstrap();
