import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  forwardRef,
  Inject
} from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { CreateUserDto } from "src/user/dto/create-user.dto";
import { UserModel } from "src/user/models/user.model";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import { RegisterDto } from "src/auth/dto/register.input";
import { LoginDto } from "src/auth/dto/login.input";
import { AuthResponse } from "src/user/interfaces/auth-response";
import { TempAuthResponse } from "src/user/interfaces/temp-response";
import { UploadImageResponse } from "src/user/interfaces/upload-image-reponse";
import { Status } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { transporter } from "src/common/transporter";
import { ChatService } from './../../../chat/services/chat/chat.service';
import { CreateDirectChannelInput } from "src/chat/services/chat/dtos/channel-dtos";

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) {}

  private async createUniquePseudo(
    firstName: string,
    lastName: string
  ): Promise<string> {
    let counter = 1;
    let pseudo = `${firstName.charAt(0)}${lastName
      .substring(0, Math.min(7, lastName.length))
      .toLowerCase()}`;

    while (await this.prisma.user.findUnique({ where: { pseudo: pseudo } })) {
      pseudo = `${firstName.charAt(0)}${lastName
        .substring(0, Math.min(7, lastName.length))
        .toLowerCase()}${counter}`;
      counter++;
    }

    return pseudo;
  }

  async findAll(): Promise<UserModel[]> {
    return this.prisma.user.findMany();
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    this.prisma.user.update({
      where: {
        id,
      },
      data: {
        password,
      },
    });
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({
      where: { email: email },
    });
  }

  async findByPseudo(pseudo: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({
      where: { pseudo: pseudo },
    });
  }

  async findById(userId: string): Promise<UserModel | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
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
      const pseudo = await this.createUniquePseudo(firstName, lastName);
      user = await this.prisma.user.create({
        data: {
          email: email,
          name: `${firstName} ${lastName}`,
          avatar: avatar,
          pseudo,
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

  async validateUserCredentials(loginDto: LoginDto): Promise<TempAuthResponse> {
    const { email, password: plainPassword } = loginDto;
    const user = await this.findByEmail(email);
    if (!user || !(await bcrypt.compare(plainPassword, user.password))) {
      throw new UnauthorizedException("Invalid input");
    }

    const jwtPayloadTemp = {
      userId: user.id,
      isTemporary: true,
      name: user.name,
    };
    const tempToken = this.jwtService.sign(jwtPayloadTemp, {
      secret: process.env.JWT_SECRET,
    });

    const jwtPayload = {
      userId: user.id,
      email: user.email,
      pseudo: user.pseudo,
    };
    const accessToken = this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_SECRET,
    });

    if (user.isTwoFactorEnabled) {
      return {
        token: tempToken,
        twoFactorEnable: true,
      };
    }
    return {
      token: accessToken,
      twoFactorEnable: false,
    };
  }

  async validateTwoFactorCode(
    tempToken: string,
    twoFactorCode: string
  ): Promise<AuthResponse> {
    const { userId, isTemporary } = this.jwtService.verify(tempToken, {
      secret: process.env.JWT_SECRET,
    });

    if (!isTemporary) {
      throw new UnauthorizedException("Invalid token");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      !user ||
      !user.isTwoFactorEnabled ||
      !(await this.verifyTwoFactorToken(userId, twoFactorCode))
    ) {
      throw new UnauthorizedException("Invalid two factor code");
    }

    const jwtPayload = {
      userId: user.id,
      email: user.email,
      pseudo: user.pseudo,
    };
    const token = this.jwtService.sign(jwtPayload, {
      secret: process.env.JWT_SECRET,
    });

    const { name, avatar, email } = user;
    return {
      message: "User authentication is validated!",
      user: {
        name: name,
        avatar: avatar,
        email: email,
      },
      accessToken: token,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const { email, firstName, lastName } = registerDto;

    try {
      const pseudo = await this.createUniquePseudo(firstName, lastName);
      let user = await this.prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          pseudo,
          password: hashedPassword,
        },
      });
      const jwtPayload = {
        userId: user.id,
        email: user.email,
        pseudo: user.pseudo,
      };
      const token = this.jwtService.sign(jwtPayload, {
        secret: process.env.JWT_SECRET,
      });
      delete user.password;
      return {
        message: "User authentication is validated!",
        user: {
          name: user.name,
          avatar: user.avatar,
          email: user.email,
        },
        accessToken: token,
      };
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        throw new ConflictException("Email already registered");
      }
      throw error;
    }
  }

  async generateTwoFactorSecret(userId: string) {
    const secret = speakeasy.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32, isTwoFactorEnabled: true },
    });
    return QRCode.toDataURL(secret.otpauth_url);
  }

  async verifyTwoFactorToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
    });
    return verified;
  }

  async disable2FA(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: null, isTwoFactorEnabled: false },
    });
    if (user) {
      return true;
    }
    return false;
  }

  async updatePseudo(id: string, pseudo: string) {
    try {
      const existingUserWithPseudo = await this.prisma.user.findUnique({
        where: { pseudo },
      });
      if (existingUserWithPseudo && existingUserWithPseudo.id !== id) {
        console.error("Pseudo already exists for another user");
        return false;
      }
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { pseudo },
      });
      return !!updatedUser;
    } catch (error) {
      console.log("Error updating user pseudo: ", error);
      return false;
    }
  }

  async updateAvatar(
    userId: string,
    filename: string
  ): Promise<UploadImageResponse | Error> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: filename },
    });
    const { avatar, name } = user;
    if (user) {
      return {
        message: "Avatar updated successfully",
        user: {
          avatar,
          name,
        },
      };
    }
    throw new Error("User not found");
  }

  async findOne(userId: string): Promise<UserModel> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async sendFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<boolean> {
    if (senderId === receiverId) {
      throw new Error("You cannot send to yourself a friendrequests");
    }
    const existingRequestorReceived = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { AND: [{ senderId: senderId }, { receiverId: receiverId }] },
          { AND: [{ senderId: receiverId }, { receiverId: senderId }] },
        ],
      },
    });
    if (existingRequestorReceived.length > 0) {
      throw new Error("It already exists!");
    }
    try {
      const createdFriendship = await this.prisma.friendship.create({
        data: {
          senderId,
          receiverId,
          status: "PENDING",
        },
      });
      if (createdFriendship) {
        return true;
      }
      return false;
    } catch (error) {
      console.log("Erreur lors de la creation de la demande d'amitie");
      return false;
    }
  }

  async acceptFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<boolean> {
    const updatedFriendship = await this.prisma.friendship.updateMany({
      where: {
        senderId,
        receiverId,
        status: "PENDING",
      },
      data: {
        status: "ACCEPTED",
      },
    });
    
    if (updatedFriendship.count > 0)
    {
      const createChannelInput: CreateDirectChannelInput = {
        userId1: senderId,
        userId2: receiverId,

      };
      await this.chatService.createDirectChannel(createChannelInput);
      return true;
    }
    return false;
  }

  async rejectFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<boolean> {
    const deletedFriendship = await this.prisma.friendship.deleteMany({
      where: {
        senderId,
        receiverId,
        status: "PENDING",
      },
    });

    return deletedFriendship.count > 0;
  }

  async cancelSentFriendRequest(
    senderId: string,
    receiverId: string
  ): Promise<boolean> {
    const existingFriendship = await this.prisma.friendship.findMany({
      where: {
        AND: [
          { senderId: senderId },
          { receiverId: receiverId },
          { status: "PENDING" },
        ],
      },
    });

    if (existingFriendship.length === 0) {
      console.error(
        "Aucune demande d'ami en attente trouvée entre ces utilisateurs"
      );
      return false;
    }

    const deletedFriendship = await this.prisma.friendship.deleteMany({
      where: {
        AND: [
          { senderId: senderId },
          { receiverId: receiverId },
          { status: "PENDING" },
        ],
      },
    });

    return deletedFriendship.count > 0;
  }

  async getAllFriendOfUser(userId: string): Promise<UserModel[]> {
    console.log(`Getting friends for user ID:`, userId);
    const sentFriendships = await this.prisma.friendship.findMany({
      where: {
        senderId: userId,
        status: "ACCEPTED",
      },
      include: {
        receiver: true,
      },
    });
    console.log(`Sent friendship: ${JSON.stringify(sentFriendships)}`);

    const receivedFriendships = await this.prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: "ACCEPTED",
      },
      include: {
        sender: true,
      },
    });
    console.log(`Received friendship: ${JSON.stringify(receivedFriendships)}`);
    const friends = [
      ...sentFriendships.map((f) => {
        if (!f.receiver.name) {
          throw new Error(`User with ID ${f.receiver.id} has null name`);
        }
        return f.receiver;
      }),
      ...receivedFriendships.map((f) => {
        if (!f.sender.name) {
          throw new Error(`User with ID ${f.sender.id} has null name`);
        }
        return f.sender;
      }),
    ];
    console.log(`friends: `, friends);
    return friends;
  }

  async updateUserStatus(id: string, status: Status) {
    return await this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) throw new Error("User not found");

    const resetToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    const resetLink = `https://transcendence.com/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Transcendence" <transcendenceservice@gmail.com>`,
      to: user.email,
      subject: `Password Reset Request - Transcendence`,
      text: `Click on this link to reset your password: ${resetLink}`,
      html: `<p>Click on this link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log(`Message sent: %s`, info.messageId);
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as jwt.JwtPayload;
      const userId = payload.userId;

      const user = await this.findById(userId);
      if (!user) throw new Error("User not found!");

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.updateUserPassword(userId, hashedPassword);

      console.log(`Password reset successful!`);
    } catch (error) {
      console.log(`Error in resetPassword:`, error.message);
      throw error;
    }
  }
}
