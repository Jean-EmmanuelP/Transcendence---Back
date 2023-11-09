// game-info.dto.ts

export class GameInfoDto {
    gameState: string;
    playerOne: {
        id: String;
        score: number;
    };
    playerTwo: {
        id: string;
        score: number;
    };
    winner: string;
    startDate: Date;
    endDate: Date;
}
