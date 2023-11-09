import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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
	 * 
	 */
	handleConnection(@ConnectedSocket() socket: Socket, ...args: any[]) {
		console.log('[Connection] Client connected: ', socket.id);

		const token = socket.handshake.query.token;
		if (token === undefined) {
			console.log('[Connection] Client has no token');
			return;
		}

		if (this._tokens.has(token.toString())) {
			// Some hard code here, will do it later
		} else {
			this._users.set(socket.id, {
				socketId: socket.id,
				userId: token.toString(),
				room: null
			});
		}
	}

	/**
	 * @brief This method is called when the user disconnects from the server
	 * 
	 * @attention	If it is not a proper go out, then I have to give some time
	 * @attention	I  have to be careful when the user disconnects
	 * @attention	When the user disconnects, I have to check if he was waiting for a match
	 * @attention	If he was waiting for a match, I have to remove him from the waiting list
	 */
	handleDisconnect(@ConnectedSocket() socket: Socket) {
		console.log('[Connection] Client disconnected: ', socket.id);

		/* I have to give some time for the user to reconnect */

		if (this._waitingUser !== null && this._waitingUser.id === socket.id) {
			this._waitingUser = null;
		}
		if (this._users.has(socket.id)) {
			if (this._users.get(socket.id).room !== null) {
				if (this._users.get(socket.id).room.roomId === '') {
					this._rooms.delete(this._users.get(socket.id).room.roomId);
				}
			}
			this._users.delete(socket.id);
		}
		/* This operation has to be more thoughtful	*/
		// If the user is already playing, I have to properly disconnect him
		this._users.delete(socket.id);
	}

	/* ********************************************************************** */
	/* **************************** Game Modes ****************************** */
	/* ********************************************************************** */
	@SubscribeMessage('matchmaking')
	matchMaking(@MessageBody() data: any, @ConnectedSocket() socket: Socket) {
		console.log('[Connection] ', socket.id, ' wants to matchmake');

		if (this._waitingUser === null) {
			this._waitingUser = socket;
			socket.emit('waiting', { message: 'Waiting for other player' });
		}
		else {
			/* Create a new game and add the players to the room */
			const gameId = this.gameService.create({
				"playerOneId": socket.handshake.query.token.toString(),
				"playerTwoId": this._waitingUser.handshake.query.token.toString(),
				"courtScale": 0.5,
				"maxScore": 7
			});

			this._rooms.set(gameId.toString(), {
				roomId: gameId.toString(),
				gameId: gameId,
				playerOne: this._users.get(socket.handshake.query.token.toString()),
				playerOneReady: false,
				playerTwo: this._users.get(this._waitingUser.handshake.query.token.toString()),
				playerTwoReady: false,
				isLive: false,
			});
			socket.join(gameId.toString());
			this._waitingUser.join(gameId.toString());

			/*	Send the full information about the users	*/
			this.server.to(gameId.toString()).emit('gameFound', {
				message: 'Found opponent',
				playerOne: this._waitingUser.id,
				playerTwo: socket.id,
				roomId: gameId.toString()
			});

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

		if (!this._rooms.has(data.roomId)) {
			console.log('[Connection] client', data);
			console.log('[Connection] server', this._rooms);
			console.log('[Connection] ', socket.id, ' is not in the room2');
			return;
		}

		const room = this._rooms.get(data.roomId);
		if (socket.id !== room.playerOne.socketId && socket.id !== room.playerTwo.socketId) {
			console.log('[Connection] ', socket.id, ' is not in the room');
			return;
		} else if (socket.id === room.playerOne.socketId) {
			console.log('[Connection] ', socket.id, ' is player one');
			if (room.playerOneReady) {
				return;
			} else {
				room.playerOneReady = true;
				if (!room.playerTwoReady) {
					socket.emit("waitingOpponent", { message: "Waiting for opponent" });
					return;
				}
			}
		} else if (socket.id === room.playerTwo.socketId) {
			console.log('[Connection] ', socket.id, ' is player two');
			if (room.playerTwoReady) {
				return;
			} else {
				room.playerTwoReady = true;
				if (!room.playerOneReady) {
					socket.emit("waitingOpponent", { message: "Waiting for opponent" });
					return;
				}
			}
		}
		console.log("[Connection] Both players are ready, the game is starting")
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
		// game.startGame();

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

	/* ********************************************************************** */
	/* ***************************** View mode ****************************** */
	/* ********************************************************************** */
}
