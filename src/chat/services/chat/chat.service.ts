import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { PrismaService } from "prisma/services/prisma/prisma.service";
import { UserService } from "src/user/services/user/user.service";
import { UserStatusGateway } from "./../../../gateways/user-status.gateway";
import {
  ChannelOutputDTO,
  CreateDirectChannelOutput,
  DeleteMessageOutput,
  SendMessageOutput,
  UpdateMessageOutput,
  CreateDirectChannelInput,
  CreateChannelOutput,
  CreateChannelInput,
  OperationResult,
  ManageUserInput,
  UserAction,
} from "./dtos/channel-dtos";
import { MessageModel } from "./models/message.model";
import * as bcrypt from "bcrypt";

// implement all the socket connections at the end
// comment all the members here because we dont even user this relation...
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly userGateway: UserStatusGateway
  ) { }

  async createDirectChannel(
    input: CreateDirectChannelInput
  ): Promise<CreateDirectChannelOutput> {
    try {
      const sender = await this.userService.findById(input.userId1);
      const receiver = await this.userService.findById(input.userId2);

      const channel = await this.prisma.channel.create({
        data: {
          name: `${receiver.name}-${sender.name}`,
          isPrivate: true,
          isDirectMessage: true,
        },
      });
      // console.log(`Created Channel`, channel);
      const senderCreation = await this.prisma.channelMember.create({
        data: {
          userId: input.userId1,
          channelId: channel.id,
          joinedAt: new Date(),
        },
      });
      // console.log(`Created sender`, senderCreation);

      const receiverCreation = await this.prisma.channelMember.create({
        data: {
          userId: input.userId2,
          channelId: channel.id,
          joinedAt: new Date(),
        },
      });
      // console.log(`Created receiverCreation`, receiverCreation);
      //   this.userGateway.notifyDirectChannelCreated(input.userId1, input.userId2);
      await this.userGateway.notifyChannel(channel.id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteDirectChannel(
	senderId: string,
	receiverId: string,
	channelId: string
): Promise<boolean> {
	try {

		const messages = await this.prisma.message.findMany({
			where: {
				  channelId: channelId,
			},
		});

		  for (const message of messages) {
			await this.prisma.message.delete({
			  where: {
				id: message.id,
			  },
			});
		  }

		await this.prisma.channel.delete({
			where: {
				id: channelId
			}
		});
		this.userGateway.notifyUser(senderId);
		this.userGateway.notifyUser(receiverId);
		return (true);
	} catch (e) {
		console.log(e.message);
		return (false);
	}
}

  async sendMessage(
    channelId: string,
    userId: string,
    content: string
  ): Promise<SendMessageOutput> {
    try {
      const userInChannel = await this.prisma.channelMember.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (!userInChannel) {
        throw new Error("User is not a member of the channel!");
      }
      const isBanned = await this.prisma.channelBan.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      const isMuted = await this.prisma.channelMute.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (isBanned) {
        throw new Error(`User cannot send a message because he is banned!`);
      }
      if (isMuted) {
        const expiringDate = isMuted.expireAt;
        if (expiringDate.getTime() < Date.now()) {
          await this.prisma.channelMute.delete({
            where: { userId_channelId: { userId, channelId } },
          });
        } else {
          throw new Error("User cannot send a message because he is muted!");
        }
      }
      const message = await this.prisma.message.create({
        data: {
          content,
          userId,
          channelId,
        },
      });
      await this.userGateway.notifyChannel(channelId);
      return {
        success: true,
        message: { id: message.id, content: message.content },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // broadcast to all the channelMembers
  async updateMessageInvite(
    messageId: string,
    userId: string,
    content: string
  ): Promise<UpdateMessageOutput> {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!existingMessage) {
        throw new Error("Message not found");
      }
      const userInChannel = await this.prisma.channelMember.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });
      if (!userInChannel) {
        throw new Error("You are not a member of the channel");
      }

		await this.prisma.message.update({
			where: { id: messageId },
			data: { content: content },
		});
      await this.userGateway.notifyChannel(existingMessage.channelId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // broadcast to all the channelMembers
  async updateMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<UpdateMessageOutput> {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!existingMessage) {
        throw new Error("Message not found");
      }
      const channelId = existingMessage.channelId;
      const isBanned = await this.prisma.channelBan.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      const isMuted = await this.prisma.channelMute.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });

      if (isMuted) {
        const expiringDate = isMuted.expireAt;
        if (expiringDate.getTime() < Date.now()) {
          await this.prisma.channelMute.delete({
            where: { userId_channelId: { userId, channelId } },
          });
        } else {
          throw new Error("User cannot send a message because he is muted!");
        }
      }
      if (isBanned) {
        throw new Error("User cannot send a message because he is banned!");
      }
      if (existingMessage.userId !== userId) {
        throw new Error("You do not have permission to edit this message");
      }

      const userInChannel = await this.prisma.channelMember.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });
      if (!userInChannel) {
        throw new Error("You are not a member of the channel");
      }

      await this.prisma.message.update({
        where: { id: messageId },
        data: { content: newContent },
      });
      await this.userGateway.notifyChannel(existingMessage.channelId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // broadcast to all the channelMembers
  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<DeleteMessageOutput> {
    try {
      const existingMessage = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!existingMessage) {
        throw new Error("Message not found");
      }
      if (existingMessage.userId !== userId) {
        throw new Error("You do not have permission to edit this message");
      }

      // add a and in the condition to check if the user is in the channel and is not muted
      const isBanned = await this.prisma.channelBan.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });
      if (isBanned) {
        throw new Error("You are banned from the channel");
      }
      const isMuted = await this.prisma.channelMute.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });

      if (isMuted) {
        const expiringDate = isMuted.expireAt;
        if (expiringDate.getTime() < Date.now()) {
          await this.prisma.channelMute.delete({
            where: {
              userId_channelId: {
                userId,
                channelId: existingMessage.channelId,
              },
            },
          });
        } else {
          throw new Error("User cannot send a message because he is muted!");
        }
      }

      const userInChannel = await this.prisma.channelMember.findUnique({
        where: {
          userId_channelId: { userId, channelId: existingMessage.channelId },
        },
      });
      if (!userInChannel) {
        throw new Error("You are not a member of the channel");
      }
      await this.prisma.message.delete({ where: { id: messageId } });
      await this.userGateway.notifyChannel(existingMessage.channelId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async userHasBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const block = await this.prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });
      return !!block;
    } catch (error) {
      return false;
    }
  }

  async getMessages(
    userId: string,
    channelId: string
  ): Promise<MessageModel[] | undefined[]> {
    try {
      const isBanned = await this.prisma.channelBan.findUnique({
        where: { userId_channelId: { userId, channelId } },
      });
      if (isBanned) {
        throw new Error("You are banned from this channel");
      }
      let messages = await this.prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: "asc" },
        include: { user: true },
      });

      messages = (messages.filter(
        (async message => !await this.userHasBlocked(userId, message.user.id))
      ));
      return messages;
    } catch (error) {
      return [];
    }
  }

  async joinChannel(
    userId: string,
    channelId: string,
    passwordInput?: string
  ): Promise<OperationResult> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: { ChannelMember: true },
      });
      if (!channel) {
        throw new Error("There is no channel with this id");
      }

      if (channel.ChannelMember.some((member) => member.userId === userId)) {
        throw new Error("User is already a member of this channel");
      }

      if (channel.isPrivate && channel.password) {
        if (!passwordInput) {
          throw new Error("Password required to join this channel");
        }
        const isPasswordMatch = await bcrypt.compare(
          passwordInput,
          channel.password
        );
        if (!isPasswordMatch) {
          throw new Error("Incorrect password");
        }
      }

      await this.prisma.channelMember.create({
        data: {
          userId,
          channelId,
          joinedAt: new Date(),
        },
      });
      await this.userGateway.notifyChannel(channelId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // in the getUserChannels add the blocked function
  async getUserChannels(
    userId: string
  ): Promise<ChannelOutputDTO[] | undefined[]> {
    try {
      // check if ther user is ban
      const channelsUserIsMemberOf = await this.prisma.channel.findMany({
        where: { ChannelMember: { some: { userId } } },
        include: {
          members: true,
          owner: true,
          bans: true,
          ChannelMember: { include: { user: true } },
          admins: { include: { user: true } },
        },
      });

      // console.log(
      // `Retrieved Channels Before Filtering:`,
      //   channelsUserIsMemberOf
      // );
      const filteredChannels = channelsUserIsMemberOf.filter((channel) => {
        const notBanned = !channel.bans.some((ban) => ban.userId === userId);
        return notBanned;
      });
      // console.log(`Filtered Channels:`, filteredChannels);

      return filteredChannels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.isPrivate,
        isDirectMessage: channel.isDirectMessage,
        ownerId: channel.ownerId,
        owner: channel.owner,
        members: channel.ChannelMember.filter(
          (channelMember) => channelMember.userId !== userId
        ).map((channelMember) => ({
          id: channelMember.user.id,
          name: channelMember.user.name,
          pseudo: channelMember.user.pseudo,
          avatar: channelMember.user.avatar,
          status: channelMember.user.status,
        })),
        admins: channel.admins.map((admin) => ({
          id: admin.user.id,
          name: admin.user.name,
          pseudo: admin.user.pseudo,
          avatar: admin.user.avatar,
          status: admin.user.status,
        })),
      }));
    } catch (error) {
      // console.log(error);
      return [];
    }
  }

  async getAllChannels(
    userId: string
  ): Promise<ChannelOutputDTO[] | undefined[]> {
    try {
      // check if ther user is ban
      const channelsUserIsMemberOf = await this.prisma.channel.findMany({
        where: {
          NOT: {
            ChannelMember: {
              some: { userId }
            }
          },
        },
        include: {
          members: true,
          owner: true,
          bans: true,
          ChannelMember: { include: { user: true } },
          admins: { include: { user: true } },
        },
      });

      const filteredChannels = channelsUserIsMemberOf.filter((channel) => {
        const notBanned = !channel.bans.some((ban) => ban.userId === userId);
        return notBanned;
      });

      return filteredChannels.map((channel) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.isPrivate,
        isDirectMessage: channel.isDirectMessage,
        ownerId: channel.ownerId,
        owner: channel.owner,
        members: channel.ChannelMember.filter(
          (channelMember) => channelMember.userId !== userId
        ).map((channelMember) => ({
          id: channelMember.user.id,
          pseudo: channelMember.user.pseudo,
          name: channelMember.user.name,
          avatar: channelMember.user.avatar,
          status: channelMember.user.status,
        })),
        admins: channel.admins.map((admin) => ({
          id: admin.user.id,
          pseudo: admin.user.pseudo,
          name: admin.user.name,
          avatar: admin.user.avatar,
          status: admin.user.status,
        })),
      }));
    } catch (error) {
      // console.log(error);
      return [];
    }
  }

  async getChannel(
    userId: string,
    channelId: string
  ): Promise<ChannelOutputDTO | undefined> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: {
          id: channelId
        },
        include: {
          members: true,
          owner: true,
          bans: { include: { user: true } },
          mutes: { include: { user: true } },
          ChannelMember: { include: { user: true } },
          admins: { include: { user: true } },
        },
      });
      const notBanned = !channel.bans.some((ban) => ban.userId === userId);
      if (!notBanned)
        return (undefined);
      // console.log("-------------------------------");
      // console.log(channel);
      return ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.isPrivate,
        isDirectMessage: channel.isDirectMessage,
        ownerId: channel.ownerId,
        owner: channel.owner,
        bans: channel.bans,
        mutes: channel.mutes.map((channelMute) => ({
          userId: channelMute.userId,
          channelId: channelMute.channelId,
          expireAt: channelMute.expireAt,
          mutedBy: channelMute.mutedBy,
          user: {
            id: channelMute.user.id,
            pseudo: channelMute.user.pseudo,
            name: channelMute.user.name,
            avatar: channelMute.user.avatar,
            status: channelMute.user.status,
          }
        })),
        members: channel.ChannelMember.map((channelMember) => ({
          id: channelMember.user.id,
          pseudo: channelMember.user.pseudo,
          name: channelMember.user.name,
          avatar: channelMember.user.avatar,
          status: channelMember.user.status,
        })),
        admins: channel.admins.map((admin) => ({
          id: admin.user.id,
          pseudo: admin.user.pseudo,
          name: admin.user.name,
          avatar: admin.user.avatar,
          status: admin.user.status,
        })),
      });
    } catch (error) {
      // console.log(error);
      return undefined;
    }
  }

  async createChannel(
    input: CreateChannelInput,
    userId: string
  ): Promise<CreateChannelOutput> {
    try {
      const { name, isPrivate, password } = input;
      if (isPrivate && !password) {
        throw new Error("Password is required for private channels");
      }
      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

      const newChannel = await this.prisma.channel.create({
        data: {
          name,
          isPrivate,
          password: hashedPassword,
          ownerId: userId,
        },
        include: {
          admins: true,
          members: true,
        },
      });

      await this.prisma.channelMember.create({
        data: {
          userId,
          channelId: newChannel.id,
        },
      });

      await this.prisma.channelAdmin.create({
        data: {
          userId,
          channelId: newChannel.id,
        },
      });
      await this.userGateway.notifyChannel(newChannel.id);
      return { success: true, channel: newChannel };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async setChannelPassword(
    channelId: string,
    password: string | null,
    userId: string
  ): Promise<OperationResult> {
    try {
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });
      if (!channel) {
        throw new Error("Channel not found");
      }
      if (channel.ownerId !== userId) {
        throw new Error("User does not have permission to set password");
      }

      const hashedPassword = password ? await bcrypt.hash(password, 12) : null;
      if (hashedPassword) {
        await this.prisma.channel.update({
          where: { id: channelId },
          data: { password: hashedPassword, isPrivate: true },
        });
      } else {
        await this.prisma.channel.update({
          where: { id: channelId },
          data: { password: hashedPassword, isPrivate: false },
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // do the same logic like instagram
  // think about it and do it later
  async blockUser(
    blockerId: string,
    blockedId: string
  ): Promise<OperationResult> {
    try {
      if (blockerId === blockedId) {
        throw new Error("You cannot block yourself!");
      }
      const existingBlock = await this.prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });
      if (existingBlock) {
        return { success: false, error: "User already blocked" };
      }

      await this.prisma.blockedUser.create({
        data: {
          blockerId,
          blockedId,
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // revise this method
  // same thing
  async unblockUser(
    blockerId: string,
    blockedId: string
  ): Promise<OperationResult> {
    try {
      const existingBlock = await this.prisma.blockedUser.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });
      if (!existingBlock) {
        return { success: false, error: "Block does not exist" };
      }

      await this.prisma.blockedUser.delete({
        where: {
          blockerId_blockedId: {
            blockerId,
            blockedId,
          },
        },
      });

      return { success: true };
    } catch (error) {
      // console.log(error);
      return { success: false, error: error.message };
    }
  }

  async leaveChannel(userId: string, channelId: string) {
    try {
      // console.log(
      // "Function leaveChannel started with userId:",
      //   userId,
      //   " and channelId:",
      //   channelId
      // );

      // Get the initial channel data
      let theChannel = await this.prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          ChannelMember: true,
          admins: true,
        },
      });
      // console.log("Initial channel data:", JSON.stringify(theChannel));
      if (!theChannel) throw new Error("Channel not found");

      const isMember = theChannel.ChannelMember.some(
        (member) => member.userId === userId
      );
      // console.log("Is user a member of the channel:", isMember);
      if (!isMember) throw new Error(`User is not a member of the channel`);

      if (theChannel.ChannelMember.length <= 1) {
        // console.log("Only one member in the channel. Deleting channel...");
		const messages = await this.prisma.message.findMany({
			where: {
				  channelId: channelId,
			},
		});

		for (const message of messages) {
			await this.prisma.message.delete({
				where: {
				id: message.id,
				},
			});
		}
        await this.prisma.channel.delete({ where: { id: channelId } });
        // console.log("Channel deleted successfully!");
        this.userGateway.notifyUser(userId);
        return { success: true };
      }

      if (theChannel.ownerId === userId) {
        // console.log("User is the owner of the channel");
        let newOwnerId = null;
        if (theChannel.admins && theChannel.admins.length > 1) {
          // console.log("Finding new owner from admins excluding current owner");
          newOwnerId = theChannel.admins
            .filter((admin) => admin.userId !== userId) // Filtering out current owner
            .sort((a, b) => a.assignedAt.getTime() - b.assignedAt.getTime())[0]
            ?.userId;
          // console.log(
          // "Filtered admins: ",
          //   JSON.stringify(
          //     theChannel.admins.filter((admin) => admin.userId !== userId)
          //   )
          // );
        } else {
          // console.log(
          // "Finding new owner from channel members excluding current owner"
          // );
          newOwnerId = theChannel.ChannelMember.filter(
            (member) => member.userId !== userId
          ) // Filtering out current owner
            .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())[0]
            ?.userId;
        }
        // console.log("New owner ID:", newOwnerId);

        // Update the ownerId of the channel
        // console.log("Updating channel owner");
        await this.prisma.channel.update({
          where: { id: channelId },
          data: { ownerId: newOwnerId },
        });
        // console.log("Channel owner updated successfully");

        // Re-query to get updated channel data
        theChannel = await this.prisma.channel.findUnique({
          where: { id: channelId },
          include: {
            ChannelMember: true,
            admins: true,
          },
        });
        // console.log("Requeried channel data:", JSON.stringify(theChannel));

        // Check if the newOwnerId is already an admin
        const isNewOwnerAdmin = theChannel.admins.some(
          (admin) => admin.userId === newOwnerId
        );
        // console.log("Is new owner already an admin:", isNewOwnerAdmin);
        if (!isNewOwnerAdmin) {
          // If not, add the newOwnerId as an admin
          // console.log("Adding new owner as admin");
          await this.prisma.channelAdmin.create({
            data: {
              userId: newOwnerId,
              channelId,
              assignedAt: new Date(),
            },
          });
          // console.log("New owner added as admin successfully");
        }
      }

      // console.log("Deleting user from channel members and channel admins...");
      await this.prisma.channelMember.deleteMany({
        where: { userId, channelId },
      });
      await this.prisma.channelAdmin.deleteMany({
        where: { userId, channelId },
      });
      // console.log("User deleted from channel members and admins successfully!");
      this.userGateway.notifyUser(userId);
      await this.userGateway.notifyChannel(channelId);
      // console.log("leaveChannel function completed successfully!");
      return { success: true };
    } catch (error) {
      // console.log("Error in leaveChannel function:", error.message);
      return { success: false, error: error.message };
    }
  }

  async manageUser(
    operatorId: string,
    input: ManageUserInput
  ): Promise<OperationResult> {
    try {
      const { targetUserId, channelId, action, duration } = input;
      if (action === UserAction.UPADMIN || action === UserAction.DOWNADMIN) {
        const channel = await this.prisma.channel.findUnique({
          where: { id: input.channelId },
          include: {
            admins: true,
          },
        });
        if (channel.ownerId === targetUserId)
          throw new Error("You cannot manage the owner of the channel!");
        if (channel.ownerId !== operatorId)
          throw new Error(
            "Only the owner can add, or upgrade new administrator"
          );
        const isAlreadyAdmin = channel.admins.some(
          (admin) => admin.userId === targetUserId
        );
        if (isAlreadyAdmin && action === UserAction.UPADMIN)
          throw new Error("User is already an administrator!");
        if (action === UserAction.UPADMIN) {
          await this.prisma.channelAdmin.create({
            data: {
              userId: targetUserId,
              channelId,
            },
          });
        } else {
          await this.prisma.channelAdmin.delete({
            where: {
              userId_channelId: {
                userId: targetUserId,
                channelId,
              },
            },
          });
        }
      } else {
        const operator = await this.prisma.user.findUnique({
          where: { id: operatorId },
        });
        const targetUser = await this.prisma.user.findUnique({
          where: { id: targetUserId },
        });
        const channel = await this.prisma.channel.findUnique({
          where: { id: channelId },
        });
        if (channel.ownerId === targetUserId)
          throw new Error("You cannot manage the owner of the channel!");
        if (!operator || !targetUser || !channel) {
          throw new Error("User or channel not found!");
        }

        const isAdmin = await this.prisma.channelAdmin.findUnique({
          where: { userId_channelId: { userId: operatorId, channelId } },
        });

        if (!isAdmin) {
          throw new Error(
            "Permission denied: Operator is not an admin in the channel"
          );
        }

        switch (action) {
          case UserAction.ADD:
            await this.prisma.channelMember.create({
              data: {
                userId: targetUserId,
                channelId,
                joinedAt: new Date(),
              },
            });
            break;
          case UserAction.KICK:
            await this.prisma.channelMember.delete({
              where: { userId_channelId: { userId: targetUserId, channelId } },
            });
            break;
          case UserAction.BAN:
            await this.prisma.channelBan.create({
              data: {
                channelId,
                userId: targetUserId,
                bannedId: new Date(),
                expiresAt: duration
                  ? new Date(Date.now() + duration * 1000)
                  : null,
                bannedBy: operatorId,
              },
            });
            break;
          case UserAction.UNBAN:
            await this.prisma.channelBan.delete({
              where: { userId_channelId: { userId: targetUserId, channelId } },
            });
            break;
          case UserAction.UNMUTE:
            await this.prisma.channelMute.delete({
              where: { userId_channelId: { userId: targetUserId, channelId } },
            });
            break;
          case UserAction.MUTE:
            await this.prisma.channelMute.create({
              data: {
                mutedId: new Date(),
                mutedBy: operatorId, // Ensure operatorId is a string
                expireAt: duration ? new Date(Date.now() + duration * 1000) : null,
                channel: {
                  connect: {
                    id: channelId, // Ensure channelId is a string
                  },
                },
                user: {
                  connect: {
                    id: targetUserId, // Ensure targetUserId is a string
                  },
                },
              },
            });
            break;
          default:
            throw new Error("Invalid action");
        }
      }
      await this.userGateway.notifyChannel(channelId);
      this.userGateway.notifyUser(targetUserId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// do the block logic, implement the checks

/*
  NEED TO BE DONE
  error not handled in the back
*/
