import { Injectable } from '@nestjs/common';
import { Court } from './objects/Court';
import { Paddle } from './objects/Paddle';
import { Ball } from './objects/Ball';
import { GameState } from './objects/states/GameState';
import { PlayState } from './objects/states/PlayState';
import { LiveInfoDto } from './dto/live-info.dto';
import { GameInfoDto } from './dto/game-info.dto';

@Injectable()
export class Game {

    /* Game Settings */
    private static _id: number = 0;
    private _startDate: Date = null;
    private _endDate: Date = null;
    private _maxScore: number;
    private _playerOneScore: number = 0;
    private _playerTwoScore: number = 0;

    /* Game attributes */
    private _court: Court;
    private _playerOne: Paddle;
    private _playerTwo: Paddle;
    private _ball: Ball;

    /* Game States */
    private _gameLoop: NodeJS.Timeout | null = null;
    private _gameState: GameState = GameState.WAITING;
    private _playState: PlayState = PlayState.SERVE_PLAYER_ONE;

    constructor(
        playerOneId: string, playerTwoId: string,
        courtScale: number = 0.5, maxScore: number = 7
    ) {
        this._court = new Court(this, this.checkScale(courtScale));
        this._playerOne = new Paddle(this, playerOneId, "left_team");
        this._playerTwo = new Paddle(this, playerTwoId, "right_team");
        this._ball = new Ball(this);
        this._startDate = new Date();
        this._maxScore = maxScore;
        Game._id++;
    }

    startGame() {
        this._gameLoop = setInterval(() => {
            this.updateGame();
        }, 1000 / 60);
        this._gameState = GameState.PLAYING;
        this._startDate = new Date();
    }

    pauseGame() {
        this._gameState = GameState.MENU;
    }

    unPauseGame() {
        this._gameState = GameState.PLAYING;
    }

    finishGame() {
        this._gameState = GameState.GAME_OVER
        clearInterval(this._gameLoop);
        this._endDate = new Date();
    }

    updateGame() {
        if (this._gameState === GameState.PLAYING) {
            this._playerOne.update();         // depends on the button state
            this._playerTwo.update();         // depends on the button state
            this._ball.update();              // depends on the play state
        }
        if (this._court.isPlayerOneScored()) {
            this._playerOneScore++;
            if (this._playerOneScore === this._maxScore) {
                this._gameState = GameState.GAME_OVER;
                clearInterval(this._gameLoop);
            } else {
                this._playState = PlayState.SERVE_PLAYER_TWO;
            }
            this._ball.reset();
            this._playerOne.reset();
            this._playerTwo.reset();
        } else if (this._court.isPlayerTwoScored()) {
            this._playerTwoScore++;
            if (this._playerTwoScore === this._maxScore) {
                this._gameState = GameState.GAME_OVER;
                clearInterval(this._gameLoop);

            } else {
                this._playState = PlayState.SERVE_PLAYER_ONE;
            }
            this._ball.reset();
            this._playerOne.reset();
            this._playerTwo.reset();
        }
    }

    /**
     * @param {*} playerId  The id of the player who pressed the button
     * @param {*} button    The button that is pressed {w, a, s, d, q, e, space}
     * @param {*} event     is it pressed or released {pressed, released}
     */
    handle_event(playerId: string, button: string, event: string) {
        let player: Paddle;

        if (playerId === this._playerOne.id) {
            player = this._playerOne;
        } else if (playerId === this._playerTwo.id) {
            player = this._playerTwo;
        } else {
            throw new Error("Player not found");
        }

        player.buttons.updateButtonState(button, event);
    }


    /* ********************************************************************** */
    /* Helper Functions */
    /* ********************************************************************** */
    /**
     * @brief   Check if the scale is in the range of 0.1 to 1
     */
    checkScale(scale: number): number {
        if (scale < 0.1) {
            return 0.1;
        } else if (scale > 1) {
            return 1;
        } else {
            return scale;
        }
    }

    /* ********************************************************************** */
    /* Getteres and Setters */
    /* ********************************************************************** */

    get id(): number { return Game._id; }
    get court(): Court { return this._court; }
    get playerOne(): Paddle { return this._playerOne; }
    get playerTwo(): Paddle { return this._playerTwo; }
    get ball(): Ball { return this._ball; }
    get gameState(): GameState { return this._gameState; }
    get playState(): PlayState { return this._playState; }
    get playerOneScore(): number { return this._playerOneScore; }
    get playerTwoScore(): number { return this._playerTwoScore; }
    get startDate(): Date { return this._startDate; }
    get endDate(): Date { return this._endDate; }

    set gameState(value: GameState) { this._gameState = value; }
    set playState(value: PlayState) { this._playState = value; }

    get liveInfo(): LiveInfoDto {
        return {
            "gameState": this._gameState,
            "ball": {
                "x": this._ball.x,
                "y": this._ball.y,
                "radius": this._ball.radius,
                "directionX": this._ball.direction.x,
                "directionY": this._ball.direction.y,
                "directionAngle": this._ball.direction.angle
            },
            "playerOne": {
                "score": this._playerOneScore,
                "x": this._playerOne.position.x,
                "y": this._playerOne.position.y,
                "width": this._playerOne.width,
                "height": this._playerOne.height,
                "angle": this._playerOne.direction.angle,
                "attack": this._playerOne.attack
            },
            "playerTwo": {
                "score": this._playerTwoScore,
                "x": this._playerTwo.position.x,
                "y": this._playerTwo.position.y,
                "width": this._playerTwo.width,
                "height": this._playerTwo.height,
                "angle": this._playerTwo.direction.angle,
                "attack": this._playerTwo.attack
            },
            "playState": this._playState,
        }
    };

    get gameInfo(): GameInfoDto {
        let result = {
            "gameState": this._gameState,
            "playerOne": {
                "id": this._playerOne.id,
                "score": this._playerOneScore,
            },
            "playerTwo": {
                "id": this._playerTwo.id,
                "score": this._playerTwoScore,
            },
            "winner": "",
            "startDate": this._startDate,
            "endDate": this._endDate
        };
        if (this._gameState === GameState.GAME_OVER) {
            if (this._playerOneScore > this._playerTwoScore) {
                result.winner = this._playerOne.id;
            } else {
                result.winner = this._playerTwo.id;
            }
        }
        return result;
    };
}
