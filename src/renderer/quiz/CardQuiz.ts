import {Utils} from "../utils/Utils";

export class CardQuiz {
    public static createRandom() : CardQuiz {
        switch (Utils.randomRange(1, 5)) {
            case 1:
            case 2: {
                return this.createArithmeticProgression();
            }
            case 3:
            case 4: {
                return this.createGeometricProgression();
            }
            default: {
                return this.createBinomialTheorem();
            }
        }
    }

    public static createArithmeticProgression() : CardQuiz {
        const answer: number[] = [];
        const dummies: number[] = [];
        const first = Utils.randomRange(-9, 9);
        let d = Utils.randomRange(-10, 10);
        if(d == 0) {
            d = 1;
        }
        const count = Utils.randomRange(3, 5);

        for(let i = 1; i <= count; i++){
            answer.push(first + d * (i - 1));
        }

        const dummyCount = Utils.randomRange(2, 4);
        const minRandom = first - d * count;
        const maxRandom = first + d * count;
        let i = 0;
        while(dummies.length < dummyCount){
            const random = Utils.randomRange(minRandom, maxRandom);
            if(!answer.includes(random) && !dummies.includes(random)) {
                dummies.push(random);
            }
            if(++i >= dummyCount * 2) break;
        }
        return new CardQuiz(0, answer, dummies);
    }

    public static createGeometricProgression() : CardQuiz {
        const answer: number[] = [];
        const dummies: number[] = [];
        let first = Utils.randomRange(-9, 9);
        if(first == 0) {
            first = 1;
        }
        let q = Utils.randomRange(-5, 5);
        if(q == 0 || q == 1 || q == -1) {
            q = 2;
        }
        const count = Utils.randomRange(3, 5);

        for(let i = 1; i <= count; i++){
            answer.push(first * Math.pow(q, i - 1));
        }

        const dummyCount = Utils.randomRange(2, 4);
        const minRandom = -first * Math.pow(q, Math.floor(count * 0.5));
        const maxRandom = first * Math.pow(q, Math.floor(count * 0.5));
        let i = 0;
        while(dummies.length < dummyCount){
            const random = Utils.randomRange(minRandom, maxRandom);
            if(!answer.includes(random) && !dummies.includes(random)) {
                dummies.push(random);
            }
            if(++i >= dummyCount * 2) break;
        }
        return new CardQuiz(1, answer, dummies);
    }

    // tính nhanh tổ hợp
    private static combine(n: number, k: number) : number {
        if (k > n) {
            return 0;
        }
        let r = 1;
        for (let d = 1; d <= k; d++) {
            r *= n--;
            r /= d;
        }
        return r;
    }

    public static createBinomialTheorem() : CardQuiz {
        const answer: number[] = [];
        const dummies: number[] = [];
        const exp = Utils.randomRange(2, 4);
        let x = Utils.randomRange(-8, 8);
        if(x == -1){
            x = 0;
        }

        for(let i = 0; i <= exp; i++){
            answer.push(this.combine(exp, i) * x);
        }

        const dummyCount = Utils.randomRange(3, 5);
        const minRandom = this.combine(exp, Math.floor(exp * 0.5)) * -x;
        const maxRandom = this.combine(exp, Math.floor(exp * 0.5)) * x;
        let i = 0;
        while(dummies.length < dummyCount){
            const random = Utils.randomRange(minRandom, maxRandom);
            if(!answer.includes(random) && !dummies.includes(random)) {
                dummies.push(random);
                // trong dãy số nhị thức newton, hầu hết các số sẽ lặp lại 2 lần
                // do đó các số giả cũng nên có khả năng bị lặp lại lần 2
                if(Math.random() < 0.3) {
                    dummies.push(random);
                }
            }
            if(++i >= dummyCount * 2) break;
        }
        return new CardQuiz(2, answer, dummies);
    }

    private readonly _type: number;
    private readonly _answer: number[];
    private readonly _dummies: number[];

    constructor(type: number, answer: number[], dummies: number[]) {
        this._type = type;
        this._answer = answer;
        this._dummies = dummies;
    }

    get dummies(): number[] {
        return this._dummies;
    }

    get answer(): number[] {
        return this._answer;
    }

    get type(): number {
        return this._type;
    }
}
