export class CreateGameDto {
    playerOneId: string;
    playerTwoId: string;
    courtScale: number = 0.5;
    maxScore: number = 7;
}
