import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { PrismaService } from 'prisma/services/prisma/prisma.service';
import { PrismaModule } from 'prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';

//dctcl
@Module({
  imports: [forwardRef(() => UserModule), JwtModule],
  providers: [GameGateway, GameService],
})
export class GameModule { }
