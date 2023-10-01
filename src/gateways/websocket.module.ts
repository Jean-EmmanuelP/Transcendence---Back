import { Module } from "@nestjs/common";
import { UserStatusGateway } from "./user-status.gateway";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [UserModule],
    providers: [UserStatusGateway],
})
export class WebSocketModule {}