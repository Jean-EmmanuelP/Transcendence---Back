"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const apollo_1 = require("@nestjs/apollo");
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const user_service_1 = require("./user/services/user/user.service");
const user_module_1 = require("./user/user.module");
const prisma_service_1 = require("./prisma/services/prisma/prisma.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_service_1 = require("./auth/services/auth/auth.service");
const auth_module_1 = require("./auth/auth.module");
const jwt_1 = require("@nestjs/jwt");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: "schema.gql",
                installSubscriptionHandlers: true,
            }),
            user_module_1.UserModule,
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule
        ],
        providers: [jwt_1.JwtService, user_service_1.UserService, prisma_service_1.PrismaService, auth_service_1.AuthService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map