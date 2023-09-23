import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(passport.initialize());

  await app.listen(3000);
  console.log(
    "\x1b[33m%s\x1b[0m",
    "============================================"
  );
  console.log(
    "\x1b[33m%s\x1b[0m",
    "Application : http://localhost:3000"
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
