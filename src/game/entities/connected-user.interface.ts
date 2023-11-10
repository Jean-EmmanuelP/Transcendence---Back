interface ConnectedUser {
    socketId: string;
    userId: string;
    roomId: number;
}

interface Room {
    roomId: string;
    gameId: number;
    playerOne: string;
    playerOneReady: boolean;
    playerTwo: string;
    playerTwoReady: boolean;
    isLive: boolean;
}
