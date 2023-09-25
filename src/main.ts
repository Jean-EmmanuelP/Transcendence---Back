import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as passport from "passport";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Transcendence API for Authentication")
    .setDescription(
      "Here you can see all the routes and what it will render to you, also how to use it!"
    )
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.use(passport.initialize());

  await app.listen(3000);
  console.log(
    "\x1b[33m%s\x1b[0m",
    "============================================"
  );
  console.log("\x1b[33m%s\x1b[0m", "Application : http://localhost:3000");
  console.log(
    "\x1b[33m%s\x1b[0m",
    "============================================"
  );

  console.log(
    "\x1b[31m%s\x1b[0m",
    "============================================"
  );
  console.log(
    "\x1b[31m%s\x1b[0m",
    "GQL Playground : http://localhost:3000/graphql"
  );
  console.log(
    "\x1b[31m%s\x1b[0m",
    "============================================"
  );
}
bootstrap();
