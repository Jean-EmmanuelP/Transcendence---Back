import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Server } from 'socket.io';
import { GameService } from './game.service';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
	namespace: 'game',
	cors: {
		origin: '*',
		credentials: true,
	},
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

	@WebSocketServer() server: Server;
	private _id: number = 0;

	/* socketId to the User object */
	private _users: Map<string, ConnectedUser> = new Map<string, ConnectedUser>();
	/* token to the socketId */
	private _tokens: Map<string, string> = new Map<string, string>();
	/* roomId to the Room object */
	private _rooms: Map<string, Room> = new Map<string, Room>();

	/* This is the user that is waiting for a match */
	private _waitingUser: Socket | null = null;

	constructor(private gameService: GameService) { }

	/**
	 * @attention When the user reconnects I have to do something
	 */
	handleConnection(@ConnectedSocket() socket: Socket, ...args: any[]) {
		console.log('[Connection] Client connected: ', socket.id, ' ', this._id++);

		const token = socket.handshake.query.token;
		if (token === undefined) {
			console.log('[Connection] Client has no token');
			socket.disconnect();
			return;
		}

		if (this._tokens.has(token.toString())) {
			// Some hard code here, will do it later
			this._users.get(token.toString()).socketId = socket.id;
			console.log("[Connection] Client reconnected: ", socket.id);
		} else {
			this._users.set(token.toString(), {
				userId: token.toString(),
				socketId: socket.id,
				roomId: -1,
			});
		}
	}

	/**
	 * @brief This method is called when the user disconnects from the server
	 * 
	 * @attention	If it is not a proper go out, then I have to give some time
	 * @attention   If it was in the middle of the game, I have to assign the win
	 * 				automatically
	 * 
	 * @todo Stop the game before disconnecting
	 */
	handleDisconnect(@ConnectedSocket() socket: Socket) {
		console.log('[Connection] Client disconnected: ', socket.id);

		const token = socket.handshake.query.token;
		if (token === undefined) {
			socket.disconnect();
			return;
		}

		const user = this._users.get(token.toString());

		if (user === undefined) {
			if (this._waitingUser !== null && this._waitingUser.id === socket.id) {
				this._waitingUser = null;
			}
			if (user.roomId !== -1) {
				const room = this._rooms.get(user.roomId.toString());

				socket.leave(room.roomId);
				this.server.to(room.roomId).emit('opponentLeft', { message: 'Opponent left the game' });
				this._rooms.delete(room.roomId);
				/* Stop the game if possible */
			}
			this._users.delete(socket.id);
		}
		socket.disconnect();
	}

	/* ********************************************************************** */
	/* **************************** Game Modes ****************************** */
	/* ********************************************************************** */
	@SubscribeMessage('matchmaking')
	matchMaking(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('[Connection] ', socket.id, ' wants to matchmake');

		const token = socket.handshake.query.token;
		if (token === undefined) { socket.disconnect(); return; }

		if (this._waitingUser === null) {
			this._waitingUser = socket;
			console.log('[Connection] ', socket.id, ' is waiting for a match');
			socket.emit('waiting', { message: 'Waiting for other player' });
		}
		else {
			/* Create a new game and add the players to the room */
			const opponentToken = this._waitingUser.handshake.query.token.toString();
			const gameId = this.gameService.create({
				"playerOneId": token.toString(),
				"playerTwoId": opponentToken,
				"courtScale": 0.5,
				"maxScore": 7
			});

			this._rooms.set(gameId.toString(), {
				roomId: gameId.toString(),
				gameId: gameId,
				playerOne: token.toString(),
				playerOneReady: false,
				playerTwo: opponentToken,
				playerTwoReady: false,
				isLive: false,
			});
			socket.join(gameId.toString());
			this._waitingUser.join(gameId.toString());

			/*	Send the full information about the users	*/
			this.server.to(gameId.toString()).emit('gameFound', {
				message: 'Found opponent',
				playerOne: opponentToken.toString(),
				playerTwo: token.toString(),
				roomId: gameId.toString()
			});

			console.log('[Connection] ', socket.id, ' and ',
				this._waitingUser.id, ' are matched in game ', gameId.toString());

			this._waitingUser = null;
		}
	}

	/**
	 * @problem inside of setInterval function I have a function that takes 
	 * 			O(n) time.
	 * @solution	As setInterval catches the reference of the function/object, 
	 * 				so I have to prepare the proper objects and pass them to 
	 * 				the function.
	 * @complication	I don't like the fact that abstraction not going to work 
	 * 					here. I have to combine the parts here
	 */
	@SubscribeMessage('ready-mm')
	ready_matchmaking(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {

		console.log('[Connection] ', socket.id, ' is ready to matchmake');

		const room = this._rooms.get(data.roomId);
		const token = socket.handshake.query.token;

		console.log('[Connection] ', socket.id, ' gave roomId ', data.roomId);
		console.log('[Connection] my rooms ', this._rooms);

		if (room === undefined) {
			console.log('[Connection] ', socket.id, ' gave wrong roomId');
			return;
		}

		if (token.toString() !== room.playerOne && token.toString() !== room.playerTwo) {
			return;
		} else if (token.toString() === room.playerOne) {
			if (room.playerOneReady) {
				return;
			} else {
				room.playerOneReady = true;
				if (!room.playerTwoReady) {
					// socket.emit("waitingOpponent", { message: "Waiting for opponent" });
					return;
				}
			}
		} else if (token.toString() === room.playerTwo) {
			if (room.playerTwoReady) {
				return;
			} else {
				room.playerTwoReady = true;
				if (!room.playerOneReady) {
					// socket.emit("waitingOpponent", { message: "Waiting for opponent" });
					return;
				}
			}
		}
		if (room.isLive) {
			return;
		} else {
			room.isLive = true;
		}

		console.log('[Connection] The game is starting in room ', room.roomId);

		const game = this.gameService.findOne(room.gameId);
		if (game === undefined) {
			console.log('[Connection] something went wrong, game is undefined');
			return;
		}
		game.startGame();

		let roomToEmit = this.server.to(room.roomId);
		setInterval(() => {
			roomToEmit.emit('gameState', game.liveInfo);
		}, 1000 / 60);
	}

	/** @brief In development stage	*/
	@SubscribeMessage('playfriend')
	mode_playFriend(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('playWithFriend', data);
	}

	/** @brief In development stage	*/
	@SubscribeMessage('playbot')
	mode_playBot(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('playWithBot', data);
	}

	@SubscribeMessage('keyDown')
	handle_keyDown(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		const token = socket.handshake.query.token.toString();
		const roomId = data.roomId;
		const game = this.gameService.findOne(this._rooms.get(roomId).gameId);

		console.log('[Game] ', socket.id, ' pressed ', data.key, ' in room ', roomId);

		// if (!data || !("room" in data) || !("key" in data)) {
		// 	return;
		// } else if (!games[data.room]) {
		// 	return;
		// } else if (
		// 	socket.id !== games[data.room].playerOne &&
		// 	socket.id !== games[data.room].playerTwo
		// ) {
		// 	return;
		// } else if (games[data.room].isLive === false) {
		// 	return;
		// }

		game.handle_event(token, data.key, "pressed");
	}

	@SubscribeMessage('keyUp')
	handle_keyUp(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		const token = socket.handshake.query.token.toString();
		const roomId = data.roomId.toString();
		const game = this.gameService.findOne(this._rooms.get(roomId).gameId);

		console.log('[Game] ', socket.id, ' released ', data.key, ' in room ', roomId);
		// if (!data || !("room" in data) || !("key" in data)) {
		// 	return;
		// } else if (!games[data.room]) {
		// 	return;
		// } else if (
		// 	socket.id !== games[data.room].playerOne &&
		// 	socket.id !== games[data.room].playerTwo
		// ) {
		// 	return;
		// } else if (games[data.room].isLive === false) {
		// 	return;
		// }

		game.handle_event(token, data.key, "released");
	}

	/* ********************************************************************** */
	/* ***************************** View mode ****************************** */
	/* ********************************************************************** */
}
