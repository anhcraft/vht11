import {MultiChoiceQuiz} from "./MultiChoiceQuiz";
import {getDataChunk} from "./data/DataChunkLoader";

export class MultiChoiceQuizPool {
    private data: MultiChoiceQuiz[] | undefined[] = [
        undefined, undefined, undefined, undefined, undefined,
        undefined, undefined, undefined, undefined, undefined
    ];
    private cursor: number = 0;

    constructor() {
        this.pullData(0);
        this.pullData(5);
    }

    private pullData(start: number) {
        const chunk = getDataChunk("multi-choice");
        for(let i = 0; i < chunk.length; i++){
            const quiz = chunk[i];
            this.data[i + start] = new MultiChoiceQuiz(quiz.question, quiz.choices, quiz.answer);
        }
    }

    public nextQuiz() : MultiChoiceQuiz | undefined {
        const mcq = this.data[this.cursor++];
        if(this.cursor == 5) {
            this.pullData(5);
        }
        if(this.cursor == this.data.length) {
            this.cursor = 0;
        }
        return mcq;
    }
}
