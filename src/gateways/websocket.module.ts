import { Module, forwardRef } from "@nestjs/common";
import { UserStatusGateway } from "./user-status.gateway";
import { UserModule } from "src/user/user.module";
import { PrismaService } from "prisma/services/prisma/prisma.service";

// dctcl
@Module({
    imports: [forwardRef(() => UserModule)],
    providers: [UserStatusGateway, PrismaService],
    exports: [UserStatusGateway]
})
export class WebSocketModule { }
