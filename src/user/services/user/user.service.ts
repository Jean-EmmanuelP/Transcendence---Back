import {
	ConflictException,
	Injectable,
	UnauthorizedException,
	forwardRef,
	Inject,
} from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { CreateUserDto, Friendship } from "src/user/dto/create-user.dto";
import { FriendModel, UserModel } from "src/user/models/user.model";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as speakeasy from "speakeasy";
import * as QRCode from "qrcode";
import { RegisterDto } from "src/auth/dto/register.input";
import { LoginDto } from "src/auth/dto/login.input";
import { AuthResponse } from "src/user/interfaces/auth-response";
import { TempAuthResponse } from "src/user/interfaces/temp-response";
import { FileUpload } from "graphql-upload-ts";
import { UploadImageResponse } from "src/user/interfaces/upload-image-reponse";
import { Status } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { transporter } from "src/common/transporter";
import { ChatService } from "./../../../chat/services/chat/chat.service";
import { CreateDirectChannelInput } from "src/chat/services/chat/dtos/channel-dtos";
import { MatchModel } from "src/user/models/match.model";
import { UserStatsModel } from "src/user/models/stats.model";

@Injectable()
export class UserService {
	constructor(
		private readonly prisma: PrismaService,
		private jwtService: JwtService,
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService
	) { }

	private async createUniquePseudo(
		firstName: string,
		lastName: string
	): Promise<string> {
		const normalisedFirstName = firstName
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "");
		const normalisedLastName = lastName
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "");

		let pseudoBase = `${normalisedFirstName.charAt(
			0
		)}${normalisedLastName}`.toLowerCase();
		let pseudo = pseudoBase;
		let counter = 0;
		const maxAttempts = 50;

		while (
			(await this.prisma.user.findUnique({ where: { pseudo } })) &&
			counter < maxAttempts
		) {
			const randomNum = Math.floor(Math.random() * 1000);
			pseudo = `${pseudoBase}${randomNum}`;
			counter++;
		}

		if (counter === maxAttempts) {
			throw new Error(
				"Unable to generate a unique pseudo after multiple attempts."
			);
		}

		return pseudo;
	}

	async findAll(): Promise<UserModel[]> {
		return this.prisma.user.findMany();
	}

	async updateUserPassword(id: string, password: string): Promise<void> {
		await this.prisma.user.update({
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
			const userOAuth = await this.prisma.oAuth.findUnique({
				where: { userId: user.id },
			});
			if (!userOAuth) {
				await this.prisma.oAuth.create({
					data: {
						accessToken: accessToken,
						tokenType: "Bearer",
						createdAt: Math.floor(Date.now() / 1000),
						user: {
							connect: { id: user.id },
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
				id: user.id,
				avatar: user.avatar,
				email: user.email,
				isTwoFactorEnabled: user.isTwoFactorEnabled,
				name: user.name,
				pseudo: user.pseudo,
				status: user.status,
			};
		}
		return {
			token: accessToken,
			twoFactorEnable: false,
			id: user.id,
			avatar: user.avatar,
			email: user.email,
			isTwoFactorEnabled: user.isTwoFactorEnabled,
			name: user.name,
			pseudo: user.pseudo,
			status: user.status,
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
			let pseudo = await this.createUniquePseudo(firstName, lastName);
			pseudo = pseudo.toLowerCase();
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

	/* Related to the game history and the rank actualization */
	async calculateElo(
		playerElo: number,
		opponentElo: number,
		result: number
	): Promise<number> {
		const k = 32;
		const expectedScore =
			1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
		return Math.round(playerElo + k * (result - expectedScore));
	}

	async getRanking(): Promise<UserModel[]> {
		return this.prisma.user.findMany({
			orderBy: {
				eloScore: "desc",
			},
		});
	}

	async getUserStats(userId: string): Promise<UserStatsModel> {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: {
				player1Matches: true,
				player2Matches: true,
			},
		});
		if (!user) throw new Error("User not found");

		let victories = 0;
		let losses = 0;

		user.player1Matches.forEach((match) => {
			if (match.winnerId === userId) victories++;
			else losses++;
		});

		user.player2Matches.forEach((match) => {
			if (match.winnerId === userId) victories++;
			else losses++;
		});

		const totalGames = victories + losses;
		const winRatio = totalGames > 0 ? Math.round((victories / totalGames) * 100) : 50;
		const lossRatio = totalGames > 0 ? Math.round((losses / totalGames) * 100) : 50;

		let currentStreak = 0;
		let longestStreak = 0;

		const matches = [...user.player1Matches, ...user.player2Matches].sort(
			(a, b) => a.date.getTime() - b.date.getTime()
		);

		for (const match of matches) {
			if (match.winnerId === user.id) {
				currentStreak++;
				longestStreak = Math.max(longestStreak, currentStreak);
			} else {
				currentStreak = 0;
			}
		}
		return {
			victories,
			losses,
			totalGames,
			winRatio,
			lossRatio,
			longestStreak,
		};
	}

	async updateEloScore(
		userId: string,
		newEloScore: number
	): Promise<UserModel> {
		return this.prisma.user.update({
			where: { id: userId },
			data: { eloScore: newEloScore },
		});
	}

	async recordMatchResult(
		player1Id: string,
		player2Id: string,
		winnerId: string
	) {
		try {
			/* 1. register the winner of the game and the new rank */
			const player1 = await this.findOne(player1Id);
			if (!player1) throw new Error("Player 1 was not found");
			const player2 = await this.findOne(player2Id);
			if (!player2) throw new Error("Player 2 was not found");
			const player1NewElo = await this.calculateElo(
				player1.eloScore,
				player2.eloScore,
				winnerId === player1Id ? 1 : 0
			);
			const player2NewElo = await this.calculateElo(
				player2.eloScore,
				player1.eloScore,
				winnerId === player2Id ? 1 : 0
			);

			await this.updateEloScore(player1Id, player1NewElo);
			await this.updateEloScore(player2Id, player2NewElo);

			/* 1. register the match to have a match history */
			const match = await this.prisma.match.create({
				data: {
					player1Id,
					player2Id,
					winnerId,
				},
			});
			if (!match) throw new Error("Match not registered correctly");

			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	async getUserMatchHistory(userId: string): Promise<MatchModel[]> {
		return this.prisma.match.findMany({
			where: {
				OR: [{ player1Id: userId }, { player2Id: userId }],
			},
			orderBy: {
				playedAt: "desc",
			},
			include: {
				player1: {
					select: {
						id: true,
						pseudo: true,
						avatar: true,
					},
				},
				player2: {
					select: {
						id: true,
						pseudo: true,
						avatar: true,
					},
				},
			},
		});
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

		if (updatedFriendship.count > 0) {
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

	async unFriend(
		senderId: string,
		receiverId: string,
		channelId: string
	): Promise<boolean> {
		try {
			await this.prisma.friendship.deleteMany({
				where: {
					senderId,
					receiverId,
					status: "ACCEPTED",
				},
			});
			await this.prisma.friendship.deleteMany({
				where: {
					receiverId: senderId,
					senderId: receiverId,
					status: "ACCEPTED",
				},
			});
			return (await this.chatService.deleteDirectChannel(senderId, receiverId, channelId));
		} catch (e) {
			console.log(e.message);
			return (false);
		}
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

	//   async getAllFriendOfUser(userId: string): Promise<FriendModel[]> {
	//     console.log(`Getting friends for user ID:`, userId);
	//     const sentFriendships = await this.prisma.friendship.findMany({
	//       where: {
	//         senderId: userId,
	//         status: "ACCEPTED",
	//       },
	//       include: {
	// 		sender: true,
	//         receiver: true,
	//       },
	//     });
	//     const receivedFriendships = await this.prisma.friendship.findMany({
	//       where: {
	//         receiverId: userId,
	//         status: "ACCEPTED",
	//       },
	//       include: {
	//         sender: true,
	//         receiver: true,
	//       },
	//     });
	// 	let friends: FriendModel[] = [];
	// 	sentFriendships.map(async (f) => {
	// 		const channel = await this.prisma.channel.findFirst({
	// 			where: {
	// 				isDirectMessage: true,
	// 				ChannelMember: {
	// 				some: {
	// 					OR: [
	// 					  { userId: f.senderId },
	// 					  { userId: f.receiverId },
	// 					]
	// 				  }
	// 			 } },
	// 			include: {
	// 			  ChannelMember: { include: { user: true } },
	// 			},
	// 		});

	// 		const res: FriendModel = {
	// 			id: f.sender.id,
	// 			email: f.sender.email,
	// 			name: f.sender.name,
	// 			pseudo: f.sender.pseudo,
	// 			avatar: f.sender.avatar,
	// 			status: f.sender.status,
	// 			channelId: channel.id
	// 		}
	//         friends.push(res);
	// 	});
	// 	receivedFriendships.map(async (f) => {
	// 		const channel = await this.prisma.channel.findFirst({
	// 			where: {
	// 				isDirectMessage: true,
	// 				ChannelMember: {
	// 				some: {
	// 					OR: [
	// 					  { userId: f.senderId },
	// 					  { userId: f.receiverId },
	// 					]
	// 				  }
	// 			 } },
	// 			include: {
	// 			  ChannelMember: { include: { user: true } },
	// 			},
	// 		});
	// 		const res: FriendModel = {
	// 			id: f.receiver.id,
	// 			email: f.receiver.email,
	// 			name: f.receiver.name,
	// 			pseudo: f.receiver.pseudo,
	// 			avatar: f.receiver.avatar,
	// 			status: f.receiver.status,
	// 			channelId: channel.id
	// 		}
	// 		friends.push(res);
	// 	});
	//     return friends;
	//   }

	async getAllFriendOfUser(userId: string): Promise<FriendModel[]> {
		console.log(`Getting friends for user ID:`, userId);
		const sentFriendships = await this.prisma.friendship.findMany({
			where: {
				senderId: userId,
				status: "ACCEPTED",
			},
			include: {
				sender: true,
				receiver: true,
			},
		});
		const receivedFriendships = await this.prisma.friendship.findMany({
			where: {
				receiverId: userId,
				status: "ACCEPTED",
			},
			include: {
				sender: true,
				receiver: true,
			},
		});
		let friends: FriendModel[] = [];
		for (const f of sentFriendships) {
			const channel = await this.prisma.channel.findFirst({
				where: {
					isDirectMessage: true,
					ChannelMember: {
						some: {
							OR: [{ userId: f.senderId }, { userId: f.receiverId }],
						},
					},
				},
				include: {
					ChannelMember: { include: { user: true } },
				},
			});

			const res: FriendModel = {
				id: f.receiver.id,
				email: f.receiver.email,
				name: f.receiver.name,
				pseudo: f.receiver.pseudo,
				avatar: f.receiver.avatar,
				status: f.receiver.status,
				channelId: channel.id,
			};

			friends.push(res);
		}
		for (const f of receivedFriendships) {
			const channel = await this.prisma.channel.findFirst({
				where: {
					isDirectMessage: true,
					ChannelMember: {
						some: {
							OR: [{ userId: f.senderId }, { userId: f.receiverId }],
						},
					},
				},
				include: {
					ChannelMember: { include: { user: true } },
				},
			});

			const res: FriendModel = {
				id: f.sender.id,
				email: f.sender.email,
				name: f.sender.name,
				pseudo: f.sender.pseudo,
				avatar: f.sender.avatar,
				status: f.sender.status,
				channelId: channel.id,
			};

			friends.push(res);
		}
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

	async searchUsersByNameOrPseudo(term: string): Promise<UserModel[]> {
		return await this.prisma.user.findMany({
			where: {
				OR: [
					{
						name: {
							contains: term,
							mode: "insensitive",
						},
					},
					{
						pseudo: {
							contains: term,
							mode: "insensitive",
						},
					},
				],
			},
			take: 5,
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

	async changePassword(
		id: string,
		currentPassword: string,
		newPassword: string
	): Promise<boolean> {
		try {
			const user = await this.findById(id);
			if (!user) throw new Error("User not found!");

			if (!(await bcrypt.compare(currentPassword, user.password))) {
				throw new Error("current password is incorrect!");
			}

			const hashedPassword = await bcrypt.hash(newPassword, 12);
			await this.prisma.user.update({
				where: { id },
				data: { password: hashedPassword },
			});
			return true;
		} catch (error) {
			console.log(error);
			return false;
		}
	}

	async getPendingSentFriendRequests(userId: string): Promise<Friendship[]> {
		return this.prisma.friendship.findMany({
			where: {
				senderId: userId,
				status: "PENDING",
			},
			include: {
				sender: true,
				receiver: true,
			},
		});
	}

	async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
		return this.prisma.friendship.findMany({
			where: {
				receiverId: userId,
				status: "PENDING",
			},
			include: {
				receiver: true,
				sender: true,
			},
		});
	}

	async deleteAccount(userId: string): Promise<boolean> {
		try {
			const deletingUser = await this.prisma.user.delete({
				where: { id: userId },
			});
			if (!deletingUser) throw new Error("The delete prisma user doesnt work!");
			return true;
		} catch (error) {
			console.error(error.message);
			return false;
		}
	}
}
