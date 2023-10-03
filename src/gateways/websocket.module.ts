import { Module, forwardRef } from "@nestjs/common";
import { UserStatusGateway } from "./user-status.gateway";
import { UserModule } from "src/user/user.module";

@Module({
    imports: [forwardRef(() => UserModule)],
    providers: [UserStatusGateway],
    exports: [UserStatusGateway]
})
export class WebSocketModule {}