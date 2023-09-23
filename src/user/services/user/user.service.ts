import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/services/prisma/prisma.service";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { UserModel } from "src/user/models/user.model";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "src/auth/dto/register.input";
import { LoginDto } from "src/auth/dto/login.input";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async findAll(): Promise<UserModel[]> {
    return this.prisma.user.findMany();
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async create(data: CreateUserDto): Promise<UserModel> {
    return this.prisma.user.create({ data });
  }

  async upsertOAuthUser({
    email,
    firstName,
    lastName,
    avatar,
    accessToken,
  }: {
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    accessToken: string;
  }): Promise<UserModel> {
    let user = await this.findByEmail(email);

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email,
          name: `${firstName} ${lastName}`,
          avatar: avatar,
          oauth: {
            create: {
              accessToken: accessToken,
              tokenType: "Bearer",
              createdAt: Math.floor(Date.now() / 1000),
            },
          },
        },
      });
    } else {
      await this.prisma.oAuth.update({
        where: { userId: user.id },
        data: {
          accessToken: accessToken,
        },
      });
    }

    return user;
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    const { email, password: plainPassword } = loginDto;
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("User does not exist");
    }

    if (!(await bcrypt.compare(plainPassword, user.password))) {
      throw new UnauthorizedException("Invalid password");
    }

    const jwtPayload = { userId: user.id, email: user.email };
    const token = this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_SECRET,
    });
    return {
      message: "User authentication is validated!",
      user: {
        name: user.name,
        email: user.email,
      },
      access_token: token,
    };
  }

  async register(registerDto: RegisterDto): Promise<UserModel> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const { email, firstName, lastName } = registerDto;

    try {
      return await this.prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          password: hashedPassword,
        },
      });
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        throw new ConflictException("Email already registered");
      }
      throw error;
    }
  }
}
