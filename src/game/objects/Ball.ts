import { Injectable } from "@nestjs/common";
import { Game } from "../Game";
import { Vector } from "./Vector";
import { GameState } from "./states/GameState";
import { PlayState } from "./states/PlayState";
import { Paddle } from "./Paddle.js";

/**
 * @brief   The ball object
 * 
 * @attention   I still have some troubles with the size of the map
 * @attention   Add playState 
 */
@Injectable()
export class Ball {

    private _game: Game;
    private _position: Vector;
    private _direction: Vector;
    private _speed: number;
    private _defaultSpeed: number;
    private _radius: number;

    constructor(game: Game, radius: number = game.court.width / 40) {
        this._game = game;
        this._position = new Vector(
            this._game.playerOne.x,
            this._game.playerOne.y
        );
        this._direction = new Vector(1, 0);
        this._defaultSpeed = game.court.width / 150;
        this._speed = game.court.width / 150;
        this._radius = radius;
    }

    /**
     * @brief   Move the ball
     * 
     * @attention   this is the appoximate function, I have to make it more accurate
     * @attention   The isOccupied is not working. I check the center of the ball
     *              not the ball itself
     */
    update() {
        if (this._game.gameState !== GameState.PLAYING) {
            return;
        }
        else if (this._game.playState === PlayState.SERVE_PLAYER_ONE) {
            this._position.x = this._game.playerOne.x +
                (this._game.playerOne.width / 2 + this._radius / 2) * this._game.playerOne.direction.x;

            this._position.y = this._game.playerOne.y +
                (this._game.playerOne.width / 2 + this._radius / 2) * this._game.playerOne.direction.y;

            this._direction.x = this._game.playerOne.direction.x;
            this._direction.y = this._game.playerOne.direction.y;
            // this._game.playState = PlayState.TOWARDS_PLAYER_TWO;
        }
        else if (this._game.playState === PlayState.SERVE_PLAYER_TWO) {
            this._position.x = this._game.playerTwo.x +
                (this._game.playerTwo.width / 2 + this._radius / 2) * this._game.playerTwo.direction.x;

            this._position.y = this._game.playerTwo.y +
                (this._game.playerTwo.width / 2 + this._radius / 2) * this._game.playerTwo.direction.y;

            this._direction.x = this._game.playerTwo.direction.x;
            this._direction.y = this._game.playerTwo.direction.y;
            // this._game.playState = PlayState.TOWARDS_PLAYER_TWO;
        }
        else {
            let newX = this._position.x + this._direction.x * this._speed;
            let newY = this._position.y + this._direction.y * this._speed;

            if (newX - this._radius / 2 < 0 || newX + this._radius / 2 > this._game.court.width) {
                this._direction.x *= -1;
                this._speed = this._defaultSpeed;
            }
            else if (newY - this._radius / 2 < 0 || newY + this._radius / 2 > this._game.court.height) {
                this._direction.y *= -1;
                if (this._speed / 1.5 > this._defaultSpeed)
                    this._speed = this._speed / 1.5;
                else
                    this._speed = this._defaultSpeed;
            }
            else {
                let obstacle = this._game.court.isOccupiedByPaddle(newX, newY, this._radius / 2);

                if (obstacle === null) {
                    this._position.x = newX;
                    this._position.y = newY;
                } else {
                    this.rebound(obstacle);
                    this._speed = this._speed + this._speed * obstacle.attack / 100 * 2;
                    obstacle.reset();
                }
            }
        }
    }

    /**
     * @brief   Calculate the velocity of the ball after a rebound
     * 
     * @param   object - The object that the ball has rebounded on (a paddle)
     * 
     * @formula     v2 = v1 - 2 * (v1 . n) * n
     */
    rebound(object: Paddle) {
        let normVector = object.direction;

        let dotNotation = 2 * (this._direction.x * normVector.x +
            this._direction.y * normVector.y);

        if (Math.abs(dotNotation) < 0.5) {
            this._direction.x *= -1;
            this._direction.y *= -1;
            return;
        }
        this._direction.x = this._direction.x - dotNotation * (normVector.x / normVector.length);
        this._direction.y = this._direction.y - dotNotation * (normVector.y / normVector.length);
        if (this._game.playState === PlayState.TOWARDS_PLAYER_ONE)
            this._game.playState = PlayState.TOWARDS_PLAYER_TWO;
        else
            this._game.playState = PlayState.TOWARDS_PLAYER_ONE;
    }

    reset() {
        this._speed = this._defaultSpeed;
    }

    /**
     * @brief   Getters and Setters
     */
    get position(): Vector { return this._position; }
    get x(): number { return this._position.x; }
    get y(): number { return this._position.y; }
    get radius(): number { return this._radius; }
    get speed(): number { return this._speed; }
    get direction(): Vector { return this._direction; }

    set position(value: Vector) { this._position = value; }
    set x(value: number) { this._position.x = value; }
    set y(value: number) { this._position.y = value; }
    set radius(value: number) { this._radius = value; }
    set speed(value: number) { this._speed = value; }
    set direction(value: Vector) { this._direction = value; }
}
