export class ActiveQuiz {
    private readonly _quiz: any;
    private readonly _quizType: number;
    private readonly _timeLimit: number;
    private readonly _startTime: number;
    private readonly _penalty: number;

    constructor(quiz: any, quizType: number, timeLimit: number, startTime: number, penalty: number) {
        this._quiz = quiz;
        this._quizType = quizType;
        this._timeLimit = timeLimit;
        this._startTime = startTime;
        this._penalty = penalty;
    }

    get startTime(): number {
        return this._startTime;
    }

    get penalty(): number {
        return this._penalty;
    }

    get timeLimit(): number {
        return this._timeLimit;
    }

    get quiz(): any {
        return this._quiz;
    }

    get quizType(): number {
        return this._quizType;
    }
}
