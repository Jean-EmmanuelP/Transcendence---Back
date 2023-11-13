interface ConnectedUser {
    socketId: string;
    userId: string;
    username: string;
    roomId: string;
    isLive: boolean;
}

interface Room {
    roomId: string;
    gameId: number;
    intervalId: NodeJS.Timeout | null;

    playerOne: string;
    playerOneReady: boolean;
    playerTwo: string;
    playerTwoReady: boolean;
    isLive: boolean;
}
