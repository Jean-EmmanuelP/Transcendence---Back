import { Injectable } from "@nestjs/common";
import { Game } from "../Game";
import { Buttons } from "./Buttons";
import { Vector } from "./Vector";
import { ButtonState } from "./states/ButtonState";
import { GameState } from "./states/GameState";
import { PlayState } from "./states/PlayState";

/**
 * @brief   Represents a paddle in the game.
 * 
 * @attention   The class didn't handle bad inputs, it assumes everything is good!
 * @attention   The class didn't consider the case if there are more than one paddle
 * @attention   I have to add the constraints for the paddle rotation
 * 
 */
@Injectable()
export class Paddle {

    public _playerId: string;
    public game: Game;
    public team: string;
    public isBot: boolean = false;
    
    public width: number;
    public height: number;
    public attackByDefault: number = 10;
    public speedMovement: number;
    public speedRotation: number = 4; 

    public position: Vector;  // Position of the paddle
    public direction: Vector; // Direction of the paddle
    public buttons: Buttons;  // Button states of the paddle
    public attackPower: number = 10;

    constructor(game: Game, playerId: string, team: string)
    {
        let courtWidth = game.court.width;
        let courtHeight = game.court.height;

        this._playerId = playerId;
        if (this._playerId === "bot") {
            this.isBot = true;
            this.attackPower = 50;
        }
        this.game = game;
        this.team = team;
        if (team === "left_team") {
            this.position = new Vector(courtWidth / 40 * 2, courtHeight / 2);
            this.direction = new Vector(1, 0);
        } else {
            this.position = new Vector(courtWidth / 40 * 38, courtHeight / 2);
            this.direction = new Vector(-1, 0);
        }
        this.buttons = new Buttons(1, 1, 1);
        this.width = courtWidth / 80;
        this.height = courtWidth / 10;
        this.speedMovement = courtWidth / 200;
    }

    /**
     * @attention   I don't check for existence of another paddle
     */
    update() {
        if (this.game.gameState !== GameState.PLAYING) { return ; }

        this.moveVertically();
        this.moveHorizontally();
        this.rotation();
        this.attacking();
    }

    moveVertically() {
        /*  Move up or down */
        if (this.buttons.up === ButtonState.PRESSED) // Move up
        {
            // Check the potential position
            let newPosY = this.position.y - this.height / 2 - this.speedMovement;
            if (newPosY > 0) {
                this.position.y -= this.speedMovement;
            }
        }
        else if (this.buttons.down === ButtonState.PRESSED) // Move down
        {
            // Check the potential position
            let newPosY = this.position.y + this.height / 2 + this.speedMovement;
            if (newPosY < this.game.court.height) {
                this.position.y += this.speedMovement;
            }
        }

        // Manage bots movement 
        if (this.isBot === true) {
            // Move towards the ball
            if (this.game.ball.position.y > this.position.y) {
                let newPosY = this.position.y + this.height / 2 + this.speedMovement;

                if (newPosY < this.game.court.height) {
                    this.position.y += this.speedMovement;
                }
            } else if (this.game.ball.position.y < this.position.y) {
                let newPosY = this.position.y - this.height / 2 - this.speedMovement;

                if (newPosY > 0) {
                    this.position.y -= this.speedMovement;
                }
            }
        }
    }

    moveHorizontally() {
        /* Move left or right */
        if (this.buttons.left === ButtonState.PRESSED) {
            // Check the potential position and check which team
            let newPosX = this.position.x - this.width / 2 - this.speedMovement;
            
            if (this.team == "left_team" && newPosX > this.game.court.width / 40 * 2) {
                this.position.x -= this.speedMovement;
            } else if (this.team == "right_team" && newPosX > this.game.court.width / 2) {
                this.position.x -= this.speedMovement;
            }
        }
        else if (this.buttons.right === ButtonState.PRESSED) {
            // Check the potential position
            let newPosX = this.position.x - this.width / 2 - this.speedMovement;

            // Check which team
            if (this.team == "left_team" && newPosX < this.game.court.width / 2) {
                this.position.x += this.speedMovement;
            } else if (this.team == "right_team" && newPosX < this.game.court.width / 40 * 38) {
                this.position.x += this.speedMovement;
            }
        }
    }

    rotation() {
        if (this.buttons.rotateLeft === ButtonState.PRESSED) {
            if (this.team === "left_team") {
                this.direction.rotate(-1 * this.speedRotation);
            } else {
                this.direction.rotate(this.speedRotation);
            }
        } else if (this.buttons.rotateRight === ButtonState.PRESSED) {
            if (this.team === "right_team") {
                this.direction.rotate(-1 * this.speedRotation);
            } else {
                this.direction.rotate(this.speedRotation);
            }
        }
    }

    /**
     * @todo    Handle the bot
     */
    attacking() {
        if (this.buttons.shoot === ButtonState.PRESSED && this.attackPower <= 98) {
            this.attackPower += 2;
        } else if (this.buttons.shoot === ButtonState.UP && this.attackPower >= 12) {
            this.attackPower -= 2;
        } 

        if (
            this.game.playState === PlayState.SERVE_PLAYER_ONE &&
            this.buttons.shoot === ButtonState.PRESSED &&
            this.team === "left_team"
        ) {
            this.game.playState = PlayState.TOWARDS_PLAYER_TWO;
        } else if (
            this.game.playState === PlayState.SERVE_PLAYER_TWO &&
            this.buttons.shoot === ButtonState.PRESSED &&
            this.team === "right_team"
        ) {
            this.game.playState = PlayState.TOWARDS_PLAYER_ONE;
        }
    }

    /**
     * @attention   My fucking own implementation!
     */
    isPointInside(x: number, y: number, radius: number): boolean {
        const hypoVec = new Vector(x - this.position.x, y - this.position.y);
        let cosAngle = 0;
        let sinAngle = 0;

        /** 
         * @formula cos(x) = (a.b) / (|a| * |b|)
         * 
         * @attention   alpha range is [0, 180]. cos(x) = -1 * cos(180 - x). So take absolute
         */
        cosAngle = (hypoVec.x * this.direction.x + hypoVec.y * this.direction.y);
        cosAngle /= hypoVec.length * this.direction.length;
        cosAngle = Math.abs(cosAngle);

        /**
         * @formula sin(x) = (a X b) / (|a| * |b|)
         */
        sinAngle = Math.abs(hypoVec.x * this.direction.y - hypoVec.y * this.direction.x);
        sinAngle /= hypoVec.length * this.direction.length;

        if (cosAngle * hypoVec.length < this.width / 2 + radius) {
            if (sinAngle * this.height / 2 + radius > hypoVec.length) {
                return true;
            }
        }
        return false;
    }

    reset() {
        this.attackPower = this.attackByDefault;
    }

    /* ********************************************************************** */
    /* Getters and Setters */
    /* ********************************************************************** */
    // get position(): Vector { return this.position; }
    get x(): number { return this.position.x; }
    get y(): number { return this.position.y; }
}
