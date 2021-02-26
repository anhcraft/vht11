import {GameRenderer} from "../graphics/GameRenderer";
import {RenderEvents} from "../graphics/RenderEvents";
import {MultiChoiceQuizPool} from "../quiz/MultiChoiceQuizPool";
import {ActiveQuiz} from "../quiz/ActiveQuiz";
import {CountingQuizPool} from "../quiz/CountingQuizPool";
import {CardQuiz} from "../quiz/CardQuiz";
import {Utils} from "../utils/Utils";
import {LinearFunction} from "../utils/LinearFunction";
import {Point} from "pixi.js";
import {MatchingQuiz} from "../quiz/MatchingQuiz";
import {Pair} from "../utils/Pair";
import {Vector} from "../utils/Vector";
import {MultiChoiceQuiz} from "../quiz/MultiChoiceQuiz";
import {Connection} from "./Connection";
import {CountingQuiz} from "../quiz/CountingQuiz";

// Phương trình tính delta tốc độ từ thời gian trả lời trung bình
const speedDeltaFunction = new LinearFunction(
    new Point(5 * 1000, 30),
    new Point(150 * 1000, 3)
);

// Số câu hỏi đúng liên tiếp để tăng tốc độ
const requiredCorrectAnswerForSpeedUpgrade = 3;

// Độ bền tối đa của xe
const maxCarDurability = 100;

// Chế độ khó
const challengeMode = false;

export class Client {
    public readonly connection: Connection | null;
    private readonly endCallback: any;
    private readonly multiChoiceQuizPool: MultiChoiceQuizPool = new MultiChoiceQuizPool();
    private readonly countingQuizPool: CountingQuizPool = new CountingQuizPool();
    private readonly gameRenderer: GameRenderer;
    private readonly quizTypes: any[];

    private lostGame = false;                   // Thua cuộc
    private carDurability = maxCarDurability;
    private carSpeed = 25;                      // Tốc độ xe
    private travelledDistance = 0;              // Quãng đường di chuyển
    private avgAnswerTime = 0;                  // Thời gian trả lời trung bình
    private speedUpgradeCounter = 0;
    private scoreboard: Map<string, number> = new Map<string, number>();

    private mainTask: NodeJS.Timeout | null = null;
    private networkTask: NodeJS.Timeout | null = null;
    private activeQuiz : ActiveQuiz | null = null;
    private processingNewQuiz = false
    private processingAnswer = false;
    private processingEndGame = false;
    private chosenCards: number[] = [];
    private availableCards: number[] = [];
    private matchedPoints: Map<Point, Pair<Vector, any>> = new Map<PIXI.Point, Pair<Vector, any>>();
    private selectedPoint: Point | null = null;

    constructor(multiplayer: boolean, nickname: string, endCallback: any) {
        if(multiplayer) {
            this.connection = new Connection(
                function (this: Client, player: string, score: number) {
                    if(score > 0) {
                        this.scoreboard.set(player, score);
                    } else {
                        this.scoreboard.delete(player);
                    }
                }.bind(this),
                function (this: Client) {
                    this.end();
                }.bind(this),
                nickname
            );
        } else {
            this.connection = null;
        }
        this.endCallback = endCallback;
        this.quizTypes = [
            // CÂU HỎI TRẮC NGHIỆM
            {
                maxTime: 180 * 1000,
                minPenalty: 30,
                maxPenalty: 40,
                getQuiz: function(this: Client) : any {
                    return this.multiChoiceQuizPool.nextQuiz();
                },
                renderQuiz: function (this: Client, quiz: any) {
                    this.gameRenderer.openMultiChoiceQuiz(quiz);
                }
            },
            // CÂU HỎI TỰ LUẬN
            {
                maxTime: 300 * 1000,
                minPenalty: 30,
                maxPenalty: 40,
                getQuiz: function(this: Client) : any {
                    let quiz: CountingQuiz | undefined;
                    while (true) {
                        quiz = this.countingQuizPool.nextQuiz();
                        if(quiz == undefined || !isNaN(parseFloat(quiz.answer.trim()))) break;
                    }
                    return quiz;
                },
                renderQuiz: function (this: Client, quiz: any) {
                    this.gameRenderer.openCountingQuiz(quiz);
                }
            },
            // XẾP BÀI
            {
                maxTime: 120 * 1000,
                minPenalty: 20,
                maxPenalty: 30,
                getQuiz: function(this: Client) : any {
                    return CardQuiz.createRandom();
                },
                renderQuiz: function (this: Client, quiz: any) {
                    this.gameRenderer.openCardQuiz(quiz);
                }
            },
            // GHÉP CẶP
            {
                maxTime: 120 * 1000,
                minPenalty: 20,
                maxPenalty: 30,
                getQuiz: function(this: Client) : any {
                    return MatchingQuiz.createRandom();
                },
                renderQuiz: function (this: Client, quiz: any) {
                    this.gameRenderer.openMatchingQuiz(quiz);
                }
            }
        ];

        const renderEvents = new RenderEvents();
        renderEvents.onPickChoice = function (this: Client, answer: number) {
            if(this.processingAnswer) return;
            this.processingAnswer = true;
            this.onAnswered(this.activeQuiz?.quiz.answer == answer ? 0 : 1, this.activeQuiz?.startTime);
        }.bind(this);
        renderEvents.onSubmitCount = function (this: Client, answer: string) {
            if(this.processingAnswer) return;
            this.processingAnswer = true;
            this.onAnswered(this.activeQuiz?.quiz.answer == parseFloat(answer.trim()) ? 0 : 1, this.activeQuiz?.startTime);
        }.bind(this);
        renderEvents.onPickCard = function (this: Client, containerId: number, card: number) {
            if(this.processingAnswer) return;
            if(this.activeQuiz != null && this.activeQuiz.quiz instanceof CardQuiz) {
                const maxChosen = this.activeQuiz.quiz.answer.length;
                if(containerId == 0) {
                    this.availableCards.push(this.chosenCards[card]);
                    this.chosenCards.splice(card, 1);
                } else if(containerId == 1) {
                    if(this.chosenCards.length >= maxChosen) {
                        return;
                    }
                    this.chosenCards.push(this.availableCards[card]);
                    this.availableCards.splice(card, 1);
                    if(this.chosenCards.length == maxChosen) {
                        this.processingAnswer = true;
                        if(Utils.arrayEquals(this.chosenCards, this.activeQuiz.quiz.answer)
                            || Utils.arrayEqualReversed(this.chosenCards, this.activeQuiz.quiz.answer)) {
                            this.onAnswered(0, this.activeQuiz?.startTime);
                        } else {
                            this.processingAnswer = false;
                        }
                    }
                }
                this.gameRenderer.renderChosenCardContainer(this.chosenCards, maxChosen);
                this.gameRenderer.renderAvailableCardContainer(this.availableCards);
            }
        }.bind(this);
        renderEvents.onSelectPoint = function(this: Client, graphPos: Point){
            const pair = this.matchedPoints.get(graphPos);
            if(pair === undefined) {
                if((this.selectedPoint == null || this.selectedPoint != graphPos)) {
                    if (this.selectedPoint == null) {
                        this.selectedPoint = graphPos;
                    } else {
                        const removeFunc = this.gameRenderer.renderGraphVector(this.selectedPoint, graphPos);
                        const pair = new Pair<Vector, any>(new Vector(this.selectedPoint, graphPos), removeFunc);
                        this.matchedPoints.set(this.selectedPoint, pair);
                        this.matchedPoints.set(graphPos, pair);
                        this.selectedPoint = null;
                        const quiz = this.activeQuiz?.quiz as MatchingQuiz;
                        if(this.matchedPoints.size == quiz.answer.length * 2){
                            this.processingAnswer = true;
                            for(const v of quiz.answer){
                                const pair = this.matchedPoints.get(v.begin);
                                if(pair == undefined){
                                    this.processingAnswer = false;
                                    return;
                                }
                                if(pair.first.end != v.end){
                                    this.processingAnswer = false;
                                    return;
                                }
                            }
                            this.onAnswered(0, this.activeQuiz?.startTime);
                        }
                    }
                }
            } else {
                this.matchedPoints.delete(pair.first.begin);
                this.matchedPoints.delete(pair.first.end);
                pair.second.call();
                this.selectedPoint = null;
            }
        }.bind(this);
        this.gameRenderer = new GameRenderer(renderEvents);

        window.onresize = function() {
            //   gameRenderer.updateScreenSize();
        };

        window.onkeydown = function (this: Client, e: KeyboardEvent) {
            if(!this.gameRenderer.paused) {
                if (e.key == "ArrowLeft" || e.key == "a") {
                    e.preventDefault();
                    this.gameRenderer.carSide = Math.max(0, this.gameRenderer.carSide - 1);
                } else if (e.key == "ArrowRight" || e.key == "d") {
                    e.preventDefault();
                    this.gameRenderer.carSide = Math.min(2, this.gameRenderer.carSide + 1);
                }
            }
            if (e.key == "z") {
                const str = prompt("Nhập độ bền xe (0-100): ", this.carDurability+"");
                if(str != null) {
                    this.carDurability = parseFloat(str);
                    this.gameRenderer.updateDurabilityBar(this.carDurability / maxCarDurability);
                }
            } else if (e.key == "x") {
                if(this.activeQuiz != null) {
                    if(this.activeQuiz.quizType == 0) {
                        prompt("Gợi ý đáp án: ", ["A", "B", "C", "D"][(this.activeQuiz.quiz as MultiChoiceQuiz).answer]);
                    } else if(this.activeQuiz.quizType == 3) {
                        let str = (this.activeQuiz.quiz as MatchingQuiz).answer.map(v => `(${v.begin.x};${v.begin.y})->(${v.end.x};${v.end.y})`).join(";");
                        prompt("Gợi ý đáp án: ", str);
                    } else {
                        prompt("Gợi ý đáp án: ", this.activeQuiz.quiz.answer);
                    }
                }
            } else if (e.key == "v") {
                const str = prompt("Nhập tốc độ xe: ", this.carSpeed+"");
                if(str != null) {
                    this.carSpeed = parseFloat(str);
                    this.gameRenderer.updateSpeed(this.carSpeed);
                }
            } else if (e.key == "s") {
                const str = prompt("Nhập quãng đường: ", this.travelledDistance+"");
                if(str != null) {
                    this.travelledDistance = parseFloat(str);
                }
            } else if (e.key == "b") {
                if(this.activeQuiz != null) {
                    if(this.processingAnswer) return;
                    this.processingAnswer = true;
                    this.onAnswered(0, this.activeQuiz?.startTime);
                }
            } else if (e.key == "c") {
                this.gameRenderer.noCollision = !this.gameRenderer.noCollision;
            }
        }.bind(this);
    }

    private animateDurabilityBar(current: number, target: number){
        setTimeout(function (this: Client) {
            this.gameRenderer.updateDurabilityBar(current / maxCarDurability);
            if(current < target) {
                this.animateDurabilityBar(current + 1, target);
            } else if(current > target) {
                this.animateDurabilityBar(current - 1, target);
            }
        }.bind(this), 100);
    }

    private onAnswered(rating: number, startTime: number | undefined){
        if(this.activeQuiz == null) return;
        if(startTime != undefined){
            const answerTime = Date.now() - startTime;
            if(this.avgAnswerTime > 0) {
                this.avgAnswerTime = (this.avgAnswerTime + answerTime) * 0.5;
            }
        }
        this.gameRenderer.popupResult(rating);
        if(rating == 0) {
            this.speedUpgradeCounter++;
            if(this.speedUpgradeCounter == requiredCorrectAnswerForSpeedUpgrade) {
                this.speedUpgradeCounter = 0;
                this.carSpeed += speedDeltaFunction.eval(this.avgAnswerTime, 'Y_LOWER');
                this.gameRenderer.updateSpeed(this.carSpeed);
                this.animateDurabilityBar(this.carDurability, maxCarDurability);
                this.carDurability = maxCarDurability;
            }
        } else {
            const lastDurability = this.carDurability;
            this.carDurability -= this.activeQuiz.penalty;
            this.carDurability = Math.max(0, this.carDurability);
            this.animateDurabilityBar(lastDurability, this.carDurability);
        }
        setTimeout(function(this: Client) {
            this.gameRenderer.closeQuiz();
            this.activeQuiz = null;
            this.processingAnswer = false;
            this.chosenCards = [];
            this.availableCards = [];
            this.matchedPoints = new Map<Point, Pair<Vector, any>>();
            this.selectedPoint = null;
            if(this.carDurability > 0) {
                this.gameRenderer.paused = false;
                this.gameRenderer.carState = true;
            } else {
                this.lostGame = true;
                this.gameRenderer.popupLost();
            }
        }.bind(this), 1000);
    }

    public start() {
        this.gameRenderer.renderScene();
        this.gameRenderer.updateSpeed(this.carSpeed);

        const interval = 100;
        this.mainTask = setInterval(function (this: Client) {
            if(this.lostGame) {
                if(!this.processingEndGame) {
                    this.processingEndGame = true;
                    setTimeout(function (this: Client) {
                        this.end();
                    }.bind(this), 3000);
                }
                return;
            }
            if(!this.gameRenderer.paused && this.gameRenderer.carState) {
                // convert m/s to m/tick
                this.travelledDistance += this.carSpeed / 1000 * interval;
                this.gameRenderer.updateTravelledDistance(this.travelledDistance);

                // cap nhat scoreboard
                if(this.connection != null) {
                    this.scoreboard.set(this.connection.username, this.travelledDistance);
                    const sortedMap = new Map([...this.scoreboard.entries()].sort((a, b) => b[1] - a[1]));
                    const lines = [];
                    let i = 0;
                    for (const [key, value] of sortedMap) {
                        lines.push((i + 1) + ". " + key + ": " + Math.floor(value));
                        if (++i == 15) {
                            break;
                        }
                    }
                    while (true) {
                        if (i++ == 15) {
                            break;
                        }
                        lines.push("");
                    }
                    lines.push("");
                    lines.push("Online: " + (sortedMap.size));
                    this.gameRenderer.updateScoreboard(lines);
                }
            }

            if(this.gameRenderer.paused && !this.gameRenderer.carState) {
                if(this.gameRenderer.inQuiz) {
                    if(this.activeQuiz != null) {
                        const passedTime = Date.now() - this.activeQuiz.startTime;
                        if(passedTime >= this.activeQuiz.timeLimit) {
                            if(!this.processingAnswer) {
                                this.processingAnswer = true;
                                this.gameRenderer.updateQuizProgressBar(0);
                                this.onAnswered(2, this.activeQuiz?.startTime);
                            }
                        } else {
                            const remaining = Math.max(0, this.activeQuiz.timeLimit - passedTime);
                            this.gameRenderer.updateQuizProgressBar(1 / this.activeQuiz.timeLimit * remaining);
                            const date = new Date(0);
                            date.setSeconds(remaining / 1000);
                            const timeString = date.toISOString().substr(11, 8);
                            this.gameRenderer.updateQuizTimer(timeString);
                        }
                    }
                } else {
                    if(this.processingNewQuiz) return;
                    this.processingNewQuiz = true;
                    setTimeout(function (this: Client) {
                        const rand = Utils.randomRange(0, 7);
                        let type = 0;
                        switch (rand) {
                            case 0: case 1: case 2: case 3: {
                                type = 0;
                                break;
                            }
                            case 4: case 5: {
                                type = 1;
                                break;
                            }
                            case 6: {
                                type = 2;
                                break;
                            }
                            case 7: {
                                type = 3;
                                break;
                            }
                        }
                        const quizType = this.quizTypes[type];
                        this.activeQuiz = new ActiveQuiz(
                            quizType.getQuiz.call(this),
                            type,
                            quizType.maxTime * (challengeMode ? 0.5 : 1),
                            Date.now(),
                            Utils.randomRange(quizType.minPenalty, quizType.maxPenalty) * (challengeMode ? 2 : 1)
                        );
                        quizType.renderQuiz.call(this, this.activeQuiz.quiz);
                        this.gameRenderer.updateQuizPenalty(`⚠ -${this.activeQuiz.penalty}%`);

                        if(type == 2){
                            let cards: number[] = [];
                            cards = cards.concat(this.activeQuiz.quiz.answer, this.activeQuiz.quiz.dummies);
                            cards = Utils.shuffleArray(cards);
                            this.gameRenderer.renderAvailableCardContainer(this.availableCards = cards);
                            this.gameRenderer.renderChosenCardContainer(this.chosenCards = [], this.activeQuiz.quiz.answer.length);
                        }

                        this.processingNewQuiz = false;
                    }.bind(this), 1000);
                }
            }
        }.bind(this), interval);

        if(this.connection != null && !this.connection.closed) {
            this.networkTask = setInterval(function(this: Client) {
                this.connection?.socket.send(JSON.stringify({
                    score: this.travelledDistance
                }));
            }.bind(this), 3000);
        }
    }

    public end() {
        if(this.mainTask != null) {
            clearInterval(this.mainTask);
        }
        if(this.networkTask != null) {
            clearInterval(this.networkTask);
        }
        if(this.connection != null && !this.connection.closed){
            this.connection.socket.close();
        }
        this.gameRenderer.destroy();
        this.endCallback.call();
    }
}
