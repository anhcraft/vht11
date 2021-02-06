export class MultiChoiceQuiz {
    private readonly _question: string;
    private readonly _choices: string[];
    private readonly _answer: number;

    constructor(question: string, choices: string[], answer: number) {
        this._question = question;
        this._choices = choices;
        this._answer = answer;
    }

    get answer(): number {
        return this._answer;
    }

    get choices(): string[] {
        return this._choices;
    }

    get question(): string {
        return this._question;
    }
}
