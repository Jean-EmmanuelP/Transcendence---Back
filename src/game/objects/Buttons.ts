import { Injectable } from "@nestjs/common";
import { ButtonState } from "./states/ButtonState";

@Injectable()
export class Buttons {

    private _up: ButtonState;
    private _down: ButtonState;
    private _right: ButtonState;
    private _left: ButtonState;
    private _rotateLeft: ButtonState;
    private _rotateRight: ButtonState;
    private _shoot: ButtonState;
    private _pause: ButtonState;

    constructor(activateSide = 1, activateRotation = 1, activateShoot = 1) {
        this._up = ButtonState.UP;
        this._down = ButtonState.UP;
        this._pause = ButtonState.UP;

        if (activateSide === 1) {
            this._right = ButtonState.UP;
            this._left = ButtonState.UP;
        } else {
            this._right = ButtonState.DISABLED;
            this._left = ButtonState.DISABLED;
        }
        if (activateRotation === 1) {
            this._rotateLeft = ButtonState.UP;
            this._rotateRight = ButtonState.UP;
        } else {
            this._rotateLeft = ButtonState.DISABLED;
            this._rotateRight = ButtonState.DISABLED;
        }
        if (activateShoot === 1) {
            this._shoot = ButtonState.UP;
        } else {
            this._shoot = ButtonState.DISABLED;
        }
    }

    /* ********************************************************************** */
    /* Button interactions */
    /* ********************************************************************** */
    pressUp() {
        if (this._up !== ButtonState.DISABLED) {
            this._up = ButtonState.DOWN;
        }
    }
    pressDown() {
        if (this._down !== ButtonState.DISABLED) {
            this._down = ButtonState.DOWN;
        }
    }
    pressRight() {
        if (this._right !== ButtonState.DISABLED) {
            this._right = ButtonState.DOWN;
        }
    }
    pressLeft() {
        if (this._left !== ButtonState.DISABLED) {
            this._left = ButtonState.DOWN;
        }
    }
    pressRotateLeft() {
        if (this._rotateLeft !== ButtonState.DISABLED) {
            this._rotateLeft = ButtonState.DOWN;
        }
    }
    pressRotateRight() {
        if (this._rotateRight !== ButtonState.DISABLED) {
            this._rotateRight = ButtonState.DOWN;
        }
    }
    pressShoot() {
        if (this._shoot !== ButtonState.DISABLED) {
            this._shoot = ButtonState.DOWN;
        }
    }
    pressPause() {
        if (this._pause !== ButtonState.DISABLED) {
            this._pause = ButtonState.DOWN;
        }
    }

    releaseUp() {
        if (this._up !== ButtonState.DISABLED) {
            this._up = ButtonState.UP;
        }
    }
    releaseDown() {
        if (this._down !== ButtonState.DISABLED) {
            this._down = ButtonState.UP;
        }
    }
    releaseRight() {
        if (this._right !== ButtonState.DISABLED) {
            this._right = ButtonState.UP;
        }
    }
    releaseLeft() {
        if (this._left !== ButtonState.DISABLED) {
            this._left = ButtonState.UP;
        }
    }
    releaseRotateLeft() {
        if (this._rotateLeft !== ButtonState.DISABLED) {
            this._rotateLeft = ButtonState.UP;
        }
    }
    releaseRotateRight() {
        if (this._rotateRight !== ButtonState.DISABLED) {
            this._rotateRight = ButtonState.UP;
        }
    }
    releaseShoot() {
        if (this._shoot !== ButtonState.DISABLED) {
            this._shoot = ButtonState.UP;
        }
    }
    releasePause() {
        if (this._pause !== ButtonState.DISABLED) {
            this._pause = ButtonState.UP;
        }
    }

    /* ********************************************************************** */
    /* Getters and Setters */
    /* ********************************************************************** */

    get up() { return this._up; }
    get down() { return this._down; }
    get right() { return this._right; }
    get left() { return this._left; }
    get rotateLeft() { return this._rotateLeft; }
    get rotateRight() { return this._rotateRight; }
    get shoot() { return this._shoot; }
    get pause() { return this._pause; }

    // set up(value) { this._up = value; }
    // set down(value) { this._down = value; }
    // set right(value) { this._right = value; }
    // set left(value) { this._left = value; }
    // set rotateLeft(value) { this._rotateLeft = value; }
    // set rotateRight(value) { this._rotateRight = value; }
    // set shoot(value) { this._shoot = value; }
}
