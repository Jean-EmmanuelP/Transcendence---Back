import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as passport from "passport";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { graphqlUploadExpress } from "graphql-upload-ts";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle("Transcendence API for Authentication")
    .setDescription(
      "Here you can see all the routes and what it will render to you, also how to use it!"
    )
    .setVersion("1.0")
    .addBearerAuth({
      type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    },
      'Authorization'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document, {
    swaggerOptions: {
      persistAuthorization: true
    }
  });

  app.useGlobalPipes(new ValidationPipe());
  app.use(passport.initialize());
  app.use(graphqlUploadExpress({ maxFileSize: 1000000, maxFiles: 10 }));

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
    "\x1b[33m%s\x1b[0m",
    "============================================"
  );
  console.log(
    "\x1b[33m%s\x1b[0m",
    "Swagger Documentation : http://localhost:3000/api"
  );
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
