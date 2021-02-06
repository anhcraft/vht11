export class CountingQuiz {
    private readonly _question: string;
    private readonly _answer: number;

    constructor(question: string, answer: number) {
        this._question = question;
        this._answer = answer;
    }

    get answer(): number {
        return this._answer;
    }

    get question(): string {
        return this._question;
    }
}
