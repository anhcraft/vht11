export class CountingQuiz {
    private readonly _question: string;
    private readonly _answer: string;

    constructor(question: string, answer: string) {
        this._question = question;
        this._answer = answer;
    }

    get answer(): string {
        return this._answer;
    }

    get question(): string {
        return this._question;
    }
}
