/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   Vector.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: akalimol <akalimol@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2023/10/23 12:31:01 by akalimol          #+#    #+#             */
/*   Updated: 2023/11/02 14:14:30 by akalimol         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { Injectable } from "@nestjs/common";

/**
 * @brief   Represents a vector in the game.
 * 
 * @attention  Maybe I have to add the angle of the vector
 */
@Injectable()
export class Vector {
    private _x: number;
    private _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    /**
     * @param angle - The angle is in degrees 
     */
    rotate(angle: number) {
        angle = angle * Math.PI / 180;
        let oldX = this._x;
        let oldY = this._y;

        this._x = oldX * Math.cos(angle) - oldY * Math.sin(angle);
        this._y = oldX * Math.sin(angle) + oldY * Math.cos(angle);
    }

    /* ********************************************************************** */
    /* Getters and Setters */
    /* ********************************************************************** */
    get x(): number { return this._x; }
    get y(): number { return this._y; }
    get angle(): number { return Math.atan2(this._y, this._x) * 180 / Math.PI; }
    get length(): number { return Math.sqrt(this._x ** 2 + this._y ** 2); }
    set x(value: number) { this._x = value; }
    set y(value: number) { this._y = value; }
}