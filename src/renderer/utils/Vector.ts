import {Point} from "pixi.js";

export class Vector {
    private readonly _begin: Point;
    private readonly _end: Point;

    constructor(begin: PIXI.Point, end: PIXI.Point) {
        this._begin = begin;
        this._end = end;
    }

    get end(): PIXI.Point {
        return this._end;
    }

    get begin(): PIXI.Point {
        return this._begin;
    }
}
