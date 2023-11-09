// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'path-to-your-prisma-service'; // Import your Prisma service
// import { Prisma } from '@prisma/client'; // Import the Prisma client and models

// @Injectable()
// export class GameHistoryService {
//     constructor(private readonly prisma: PrismaService) { }

//     async createGameHistory(data: Prisma.GameHistoryCreateInput): Promise<Prisma.GameHistory> {
//         return this.prisma.gameHistory.create({
//             data,
//         });
//     }

//     async getGameHistoryById(id: number): Promise<Prisma.GameHistory | null> {
//         return this.prisma.gameHistory.findUnique({
//             where: { id },
//         });
//     }

//     async updateGameHistory(id: number, data: Prisma.GameHistoryUpdateInput): Promise<Prisma.GameHistory> {
//         return this.prisma.gameHistory.update({
//             where: { id },
//             data,
//         });
//     }

//     async deleteGameHistory(id: number): Promise<Prisma.GameHistory> {
//         return this.prisma.gameHistory.delete({
//             where: { id },
//         });
//     }

//     async getAllGameHistories(): Promise<Prisma.GameHistory[]> {
//         return this.prisma.gameHistory.findMany();
//     }
// }
