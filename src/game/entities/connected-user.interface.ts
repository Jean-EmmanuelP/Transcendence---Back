interface ConnectedUser {
    socketId: string;
    userId: string;
    room: Room | null;
}

interface Room {
    roomId: string;
    gameId: number;
    playerOne: ConnectedUser | null;
    playerOneReady: boolean;
    playerTwo: ConnectedUser | null;
    playerTwoReady: boolean;
    isLive: boolean;
}
