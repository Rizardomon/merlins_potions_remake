import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix("api");
  // Atrás do proxy (Nginx/Traefik termina o TLS): sem isso o Express vê o IP do proxy e
  // trata a requisição como http.
  app.set("trust proxy", 1);
  app.enableCors({ origin: config.getOrThrow<string>("WEB_ORIGIN") });

  if (config.getOrThrow<boolean>("SWAGGER_ENABLED")) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Merlin's Potions Remake API")
      .setDescription("API do template NestJS + Next.js")
      .setVersion("0.1.0")
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = config.getOrThrow<number>("API_PORT");
  await app.listen(port, "0.0.0.0");
  // eslint-disable-next-line no-console
  console.log(`[merlins-potions-remake-server] up on :${port}/api`);
}

bootstrap();
