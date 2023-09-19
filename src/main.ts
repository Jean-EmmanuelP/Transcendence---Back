import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
  console.log(
    "\x1b[33m%s\x1b[0m",
    "============================================"
  );
  console.log(
    "\x1b[33m%s\x1b[0m",
    "Application is running on: http://localhost:3000"
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
    "Check the GraphQL Playground : http://localhost:3000/graphql"
  );
  console.log(
    "\x1b[31m%s\x1b[0m",
    "============================================"
  );
}
bootstrap();
