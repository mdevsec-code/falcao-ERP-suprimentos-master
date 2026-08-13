import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import "reflect-metadata";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.enableCors({ origin: config.get<string>("CORS_ORIGIN"), credentials: true });

  const port = config.get<number>("PORT") ?? 3333;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Falcão ERP API rodando em http://localhost:${port}/api/v1`);
}

bootstrap();
