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
import { GameState } from './objects/states/GameState';
import { UserService } from 'src/user/services/user/user.service';

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
	/* roomId to the Room object */
	private _rooms: Map<string, Room> = new Map<string, Room>();

	/* This is the user that is waiting for a match */
	private _waitingUser: Socket | null = null;

	constructor(private gameService: GameService, private userService: UserService) { }

	/**
	 */
	handleConnection(@ConnectedSocket() socket: Socket, ...args: any[]) {

		let token = socket.handshake.query.token;
		let username = "";
		if (token === undefined) {
			console.log('[Connection] Client has no token');
			socket.disconnect();
			return;
		}

		try {
			let payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			token = payload.userId;
			username = payload.pseudo;
		} catch (e) {
			console.log(e.message);
			return;
		}

		if (this._users.has(token.toString())) {
			console.log("[Connection] Client reconnected: ", socket.id);

			const user = this._users.get(token.toString());

			user.isLive = true;
			user.socketId = socket.id;
		} else {
			console.log('[Connection] New client connected: ', socket.id, ' ', this._id++);

			this._users.set(token.toString(), {
				userId: token.toString(),
				socketId: socket.id,
				username: username,
				roomId: "-1",
				isLive: true,
			});
		}
	}

	/**
	 * @brief This method is called when the user disconnects from the server
	 *
	 * @attention   If it was in the middle of the game, I have to assign the win
	 * 				automatically
	 *
	 * @todo Stop the game before disconnecting
	 */
	handleDisconnect(@ConnectedSocket() socket: Socket) {
		console.log('[Connection] Client disconnected: ', socket.id);

		let token = socket.handshake.query.token;
		if (token === undefined) {
			socket.disconnect();
			return;
		}
		try {
			let payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			token = payload.userId;
		} catch (e) {
			console.log(e.message);
			return;
		}

		const user = this._users.get(token.toString());

		if (user) {
			console.log('[Connection] Client disconnected: ', socket.id, 'user ');
			if (this._waitingUser !== null && this._waitingUser.handshake.query.token.toString() === token.toString()) {
				this._waitingUser = null;
			}
			if (user.roomId !== "-1") {
				const room = this._rooms.get(user.roomId.toString());

				socket.leave(room.roomId);
				this.server.to(room.roomId).emit('opponentLeft', { message: 'Opponent left the game' });

				user.isLive = false;
			}
			else {
				this._users.delete(token.toString());
			}
		}
	}

	/* ********************************************************************** */
	/* **************************** Game Modes ****************************** */
	/* ********************************************************************** */
	@SubscribeMessage('matchmaking')
	matchMaking(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('[Connection] ', socket.id, ' wants to matchmake');

		let username = "";
		let opponentName = "";

		let token = socket.handshake.query.token;
		if (token === undefined) { socket.disconnect(); return; }
		try {
			let payloadUser = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			token = payloadUser.userId;
			username = payloadUser.pseudo;
		} catch (e) {
			console.log(e.message);
			return;
		}

		if (this._waitingUser === null) {
			this._waitingUser = socket;
			console.log('[Connection] ', socket.id, ' is waiting for a match');
			socket.emit('waiting', { message: 'Waiting for other player' });
		}
		else if (this._waitingUser.handshake.query.token !== socket.handshake.query.token) {
			/* Create a new game and add the players to the room */
			let opponentToken = this._waitingUser.handshake.query.token.toString();
			if (opponentToken === token) {
				socket.emit('waiting', { message: 'Waiting for other player' });
				return;
			}

			try {
				let payloadOpponent = jwt.verify(this._waitingUser.handshake.query.token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
				// console.log("[Connection] The payload is ", payload);
				opponentToken = payloadOpponent.userId;
				opponentName = payloadOpponent.pseudo;
			} catch (e) {
				console.log(e.message);
				return;
			}

			const gameId = this.gameService.create({
				"playerOneId": token.toString(),
				"playerTwoId": opponentToken,
				"courtScale": 9 / 16,
				"maxScore": 3
			});

			this._rooms.set(gameId.toString(), {
				roomId: gameId.toString(),
				gameId: gameId,
				intervalId: null,
				playerOne: token.toString(),
				playerOneReady: false,
				playerTwo: opponentToken,
				playerTwoReady: false,
				isLive: false,
			});

			socket.join(gameId.toString());
			this._waitingUser.join(gameId.toString());
			this._users.get(token.toString()).roomId = gameId.toString();
			this._users.get(opponentToken).roomId = gameId.toString();

			/*	Send the full information about the users	*/
			socket.emit('gameFound', {
				message: 'Found opponent',
				opponent: opponentToken.toString(),
				opponentName: opponentName,
				yourName: username,
				side: "left",
				roomId: gameId.toString()
			});


			this._waitingUser.emit('gameFound', {
				message: 'Found opponent',
				opponent: token.toString(),
				opponentName: opponentName,
				yourName: username,
				side: "left",
				roomId: gameId.toString()
			});
			// this.server.to(gameId.toString()).emit('gameFound', {
			// 	message: 'Found opponent',
			// 	playerOne: oppone	ntToken.toString(),
			// 	playerOne_username: payloadUser.pseudo,
			// 	playerTwo: token.toString(),
			// 	playerTwo_username: payloadOpponent.pseudo,
			// 	roomId: gameId.toString()
			// });

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
	@SubscribeMessage('ready')
	ready_matchmaking(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {

		console.log('[Connection] ', socket.id, ' is ready to matchmake');

		let token = socket.handshake.query.token;


		try {
			let payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			// console.log("[Connection] The payload is ", payload);
			token = payload.userId;
		} catch (e) {
			console.log(e.message);
			return;
		}


		// const room = this._rooms.get(data.roomId);
		const user = this._users.get(token.toString());
		if (user.roomId === "-1") {
			return;
		}
		const room = this._rooms.get(user.roomId);

		if (room === undefined) {
			console.log('[Connection] ', socket.id, ' gave wrong roomId');
			return;
		}

		if (token.toString() !== room.playerOne && token.toString() !== room.playerTwo) {
			console.log('[Connection] ', socket.id, ' not participant of the room');
			return;
		} else if (token.toString() === room.playerOne) {
			if (room.playerOneReady) {
				return;
			} else {
				room.playerOneReady = true;
				if (!room.playerTwoReady) {
					// socket.emit("waitingOpponent", { message: "Waiting for opponent" });
					console.log('[Connection] ', socket.id, ' is waiting for readiness opponent');
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
					console.log('[Connection] ', socket.id, ' is waiting for readiness opponent')
					return;
				}
			}
		}
		if (room.isLive) {
			console.log('[Connection] ', socket.id, ' is already live');
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

		room.intervalId = setInterval(() => {
			roomToEmit.emit('gameState', game.liveInfo);
			if (game.gameState === GameState.GAME_OVER) {
				roomToEmit.emit('gameOver', game.gameInfo);
				this._users.get(room.playerOne).roomId = "-1";
				this._users.get(room.playerTwo).roomId = "-1";
				clearInterval(room.intervalId);

				console.log("[Game] finished the game");
				try {
					this.userService.recordMatchResult(room.playerOne, room.playerTwo, game.gameInfo.winner);
				} catch (error) {
					console.log("[Game] error: ", error.message);
				}
				this.gameService.remove(room.gameId);

				this._rooms.delete(room.roomId);
			}
		}, 1000 / 60);
	}

	/** @brief In development stage	*/
	@SubscribeMessage('playfriend')
	async mode_playFriend(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('[Connection] ', socket.id, ' wants to play with friend');

		const token = socket.handshake.query.token;
		if (token === undefined) {
			socket.disconnect(); return;
		}
		const payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
		const userId = payload.userId;

		const opponentId = data.opponentId;
		const opponent = await this.userService.findById(opponentId);
		if (opponent === undefined) {
			console.log('[Connection] ', socket.id, ' gave wrong opponentId');
			return;
		}

		const gameId = this.gameService.create({
			"playerOneId": userId,
			"playerTwoId": opponentId,
			"courtScale": 9 / 16,
			"maxScore": 7
		});

		this._rooms.set(gameId.toString(), {
			roomId: gameId.toString(),
			gameId: gameId,
			intervalId: null,
			playerOne: userId,
			playerOneReady: false,
			playerTwo: opponentId,
			playerTwoReady: false,
			isLive: false,
		});
		this._users.get(userId).roomId = gameId.toString();
		this._users.set(opponentId, {
			userId: opponentId,
			socketId: "-1",
			username: opponent.pseudo,
			roomId: gameId.toString(),
			isLive: false,
		});
	}

	/** @brief In development stage	*/
	@SubscribeMessage('playbot')
	mode_playBot(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('playWithBot', data);
	}

	@SubscribeMessage('keyDown')
	handle_keyDown(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('[Game] ', socket.id, ' pressed ', data.key, ' in room ', data.roomId);

		let token = socket.handshake.query.token.toString();
		const roomId = data.roomId;
		if (this._rooms.has(roomId) === false) {
			return;
		}
		const game = this.gameService.findOne(this._rooms.get(roomId).gameId);

		/** @todo CHeck if the game is still on*/

		try {
			let payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			// console.log("[Connection] The payload is ", payload);
			token = payload.userId;
		} catch (e) {
			console.log(e.message);
			return;
		}


		game.handle_event(token, data.key, "pressed");
	}

	@SubscribeMessage('keyUp')
	handle_keyUp(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('[Game] ', socket.id, ' released ', data.key, ' in room ', data.roomId);

		let token = socket.handshake.query.token.toString();
		const roomId = data.roomId.toString();
		if (this._rooms.has(roomId) === false) {
			return;
		}
		const game = this.gameService.findOne(this._rooms.get(roomId).gameId);

		try {
			let payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			// console.log("[Connection] The payload is ", payload);
			token = payload.userId;
		} catch (e) {
			console.log(e.message);
			return;
		}


		game.handle_event(token, data.key, "released");
	}

	@SubscribeMessage('checkGame')
	check_game(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		let token = socket.handshake.query.token.toString();


		try {
			let payload = jwt.verify(token.toString(), process.env.JWT_SECRET) as jwt.JwtPayload;
			// console.log("[Connection] The payload is ", payload);
			token = payload.userId;
		} catch (e) {
			console.log(e.message);
			return;
		}


		const user = this._users.get(token);
		if (user.roomId === "-1") {
			return { "message": "You are not in a game", "response": false, "roomId": "-1" };
		}
		const room = this._rooms.get(user.roomId.toString());
		socket.join(room.roomId);


		let yourName = "";
		let opponentName = "";
		let side = "";

		if (token === room.playerOne) {
			yourName = user.username;
			opponentName = this._users.get(room.playerTwo).username;
			side = "left";
		} else if (token === room.playerTwo) {
			yourName = user.username;
			opponentName = this._users.get(room.playerOne).username;
			side = "right";
		}
		return {
			"message": "You are in a game",
			"response": true,
			"roomId": room.roomId,
			"yourName": yourName,
			"opponentName": opponentName,
			"side": side
		};

	}

	/* ********************************************************************** */
	/* ***************************** View mode ****************************** */
	/* ********************************************************************** */
}
