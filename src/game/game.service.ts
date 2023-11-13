import { Injectable } from "@nestjs/common";
import { Game } from "./Game";
import { CreateGameDto } from "./dto/create-game.dto";
import { GameInfoDto } from "./dto/game-info.dto";
import { LiveInfoDto } from "./dto/live-info.dto";
import { GameState } from "./objects/states/GameState";
import { UpdateGameDto } from "./dto/update-game.dto";

/**
 * @brief   This service is used to manage the games

 * @detail  This service is for managing the active games. add, remove, 
 *          update, get of current active games
 * 
 * @attention   I think the matchmaking part has to be done here, because the 
 *              gateway part has to concern only with the socket connection
 * 
 * *****************************************************************************
 * @todo    Add the game_history service 
 * @todo    Add possibility to stop the game
 * @todo    Check the performace of the this._games.find() function
 * @todo    Close the access to gameInfo()
 */
@Injectable()
export class GameService {

    private _games: Game[] = [];

    /**
     * @todo   Add the game_history service
     */
    constructor() {
    }

    create(data: CreateGameDto) {
        const game = new Game(
            data.playerOneId, data.playerTwoId,
            this.checkScale(data.courtScale), data.maxScore
        );
        this._games.push(game);
        return game.id;
    }

    findOne(gameId: number): Game {
        return this._games.find(game => game.id === gameId);
    }

    // findAll(id: number): Game[] {
    //     return this._games;
    // }

    update(data: UpdateGameDto) {
        const game = this._games.find(game => game.id === data.id);

        if (
            game === undefined ||
            (game.playerOne.id !== data.playerId &&
                game.playerTwo.id !== data.playerId) ||
            !this.isValidEvent(data.event) ||
            !this.isValidKeyboard(data.button)
        ) { return; }

        game.handle_event(data.playerId, data.button, data.event);
    }

    /**
     * @details Only the players can remove the game
     * @details If the game is still on, the game will be stored in history
     */
    remove(id: number) {
        const game = this._games.find(game => game.id === id);

        if (game === undefined)
            return;
        if (game.gameState === GameState.PLAYING) {
            game.finishGame();

            /** @todo   add the game to the history */

        }
        this._games = this._games.filter(item => item !== game);
    }

    /* ********************************************************************** */
    /*                              Private Methods                           */
    /* ********************************************************************** */
    private checkScale(scale: number): number {
        if (scale < 0.1) {
            return 0.1;
        } else if (scale > 1) {
            return 1;
        } else {
            return scale;
        }
    }

    private isValidKeyboard(button: string): boolean {
        return button === "w" || button === "s" ||
            button === "a" || button === "d" ||
            button === "j" || button === "n" ||
            button === " " || button === "p";
    }

    private isValidEvent(event: string): boolean {
        return event === "pressed" || event === "released";
    }
}
