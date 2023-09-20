"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe());
    await app.listen(3000);
    console.log("\x1b[33m%s\x1b[0m", "============================================");
    console.log("\x1b[33m%s\x1b[0m", "Application : http://localhost:3000");
    console.log("\x1b[33m%s\x1b[0m", "============================================");
    console.log("\x1b[31m%s\x1b[0m", "============================================");
    console.log("\x1b[31m%s\x1b[0m", "GQL Playground : http://localhost:3000/graphql");
    console.log("\x1b[31m%s\x1b[0m", "============================================");
}
bootstrap();
//# sourceMappingURL=main.js.map