import { Injectable } from "@nestjs/common";
import { Game } from "../Game";
import { Paddle } from "./Paddle";

/**
 * @brief   The class to control 
 */
@Injectable()
export class Court {

    private _game: Game;
    private _width: number = 1;
    private _height: number;


    constructor(game: Game, scale: number) {
        this._game = game;
        this._height = scale;
    }

    isOccupiedByPaddle(x: number, y: number, radius: number): Paddle | null {
        if (this._game.playerOne.isPointInside(x, y, radius)) {
            return this._game.playerOne;
        } else if (this._game.playerTwo.isPointInside(x, y, radius)) {
            return this._game.playerTwo;
        } else {
            return null;
        }
    }

    isPlayerOneScored(): boolean {
        return this._game.ball.x > this._width / 40 * 38;
    }

    isPlayerTwoScored(): boolean {
        return this._game.ball.x < this._width / 40 * 2;
    }

    /* ********************************************************************** */
    /* Getters and Setters */
    /* ********************************************************************** */
    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }
}
