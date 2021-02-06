import {Point} from "pixi.js";
import {Vector} from "../utils/Vector";
import {Direction} from "../utils/Direction";
import {Utils} from "../utils/Utils";

export class MatchingQuiz {
    private static getDistance(a: Point, b: Point){
        return (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
    }

    public static createRandom() : MatchingQuiz {
        const collisionDistance = Math.pow(3, 2); // binh phuong khoang cach
        const dir = new Direction(
            Utils.randomRange(-20, 20),
            Utils.randomRange(-20, 20),
        );
        const answerBegins: Point[] = [];
        const answerCount = Utils.randomRange(2, 4);
        let i = 0;
        while (answerBegins.length < answerCount){
            const point = new Point(
                Utils.randomRange(-50, 50),
                Utils.randomRange(-50, 50),
            );
            if(answerBegins.filter(p => this.getDistance(p, point) <= collisionDistance).length == 0) {
                answerBegins.push(point);
            }
            if(++i >= answerCount * 2) break;
        }

        const dummies: Point[] = [];
        const dummyCount = Utils.randomRange(3, 6);
        i = 0;
        while (dummies.length < dummyCount){
            const point = new Point(
                Utils.randomRange(-70, 70),
                Utils.randomRange(-70, 70),
            );
            if(dummies.filter(p => this.getDistance(p, point) <= collisionDistance).length == 0
                && answerBegins.filter(p => {
                    return (this.getDistance(p, point) <= collisionDistance)
                        || (this.getDistance(new Point(p.x + dir.x, p.y + dir.y), point) <= collisionDistance)
                }).length == 0) {
                dummies.push(point);
            }
            if(++i >= answerCount * 2) break;
        }
        return new MatchingQuiz(answerBegins.map(p => new Vector(p, new Point(p.x + dir.x, p.y + dir.y))), dummies, dir);
    }

    private readonly _answer: Vector[];
    private readonly _dummies: Point[];
    private readonly _direction: Direction;

    constructor(answer: Vector[], dummies: PIXI.Point[], direction: Direction) {
        this._answer = answer;
        this._dummies = dummies;
        this._direction = direction;
    }

    get direction(): Direction {
        return this._direction;
    }

    get dummies(): PIXI.Point[] {
        return this._dummies;
    }

    get answer(): Vector[] {
        return this._answer;
    }
}
