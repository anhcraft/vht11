import {Point} from "pixi.js";
import {Vector} from "../utils/Vector";
import {Direction} from "../utils/Direction";
import {Utils} from "../utils/Utils";

export class MatchingQuiz {
    private static checkDistance(a: Point, b: Point, squaredDistance: number){
        const dx = Math.pow(a.x - b.x, 2);
        const dy = Math.pow(a.y - b.y, 2);
        return dx <= squaredDistance || dy <= squaredDistance;
    }

    public static createRandom() : MatchingQuiz {
        const squaredCollisionDistance = Math.pow(3, 2); // binh phuong khoang cach
        const dir = new Direction(
            Utils.randomRange(-20, 20),
            Utils.randomRange(-20, 20),
        );
        if(dir.x * dir.x <= squaredCollisionDistance){
            dir.x = Math.sqrt(squaredCollisionDistance);
        }
        if(dir.y * dir.y <= squaredCollisionDistance){
            dir.y = Math.sqrt(squaredCollisionDistance);
        }
        const answerBegins: Point[] = [];
        const answerCount = Utils.randomRange(2, 4);
        let i = 0;
        while (answerBegins.length < answerCount){
            const point = new Point(
                Utils.randomRange(-50, 50),
                Utils.randomRange(-50, 50),
            );
            if(answerBegins.filter(p => {
                return (this.checkDistance(p, point, squaredCollisionDistance))
                    || (this.checkDistance(new Point(p.x + dir.x, p.y + dir.y), point, squaredCollisionDistance))
            }).length == 0) {
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
            if(dummies.filter(p => this.checkDistance(p, point, squaredCollisionDistance)).length == 0
                && answerBegins.filter(p => {
                    return (this.checkDistance(p, point, squaredCollisionDistance))
                        || (this.checkDistance(new Point(p.x + dir.x, p.y + dir.y), point, squaredCollisionDistance))
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
