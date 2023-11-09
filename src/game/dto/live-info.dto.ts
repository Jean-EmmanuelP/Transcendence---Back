// live-info.dto.ts

export class LiveInfoDto {
    gameState: string;
    ball: {
        x: number;
        y: number;
        radius: number;
        directionX: number;
        directionY: number;
        directionAngle: number;
    };
    playerOne: {
        score: number;
        x: number;
        y: number;
        width: number;
        height: number;
        angle: number;
        attack: number;
    };
    playerTwo: {
        score: number;
        x: number;
        y: number;
        width: number;
        height: number;
        angle: number;
        attack: number;
    };
    playState: string;
}
