import * as PIXI from 'pixi.js';
global.PIXI = PIXI;

import "pixi-projection";
import {HTMLRenderer} from "./HTMLRenderer";
import {MathMLRenderer} from "./MathMLRenderer";
import {RenderEvents} from "./RenderEvents";
import {MultiChoiceQuiz} from "../quiz/MultiChoiceQuiz";
import {CountingQuiz} from "../quiz/CountingQuiz";
import {TextInput} from "../extensions/PIXI.TextInput";
import {CardQuiz} from "../quiz/CardQuiz";
import {Scrollbox} from "pixi-scrollbox";
import {LinearFunction} from "../utils/LinearFunction";
import {Point} from "pixi.js";
import {MatchingQuiz} from "../quiz/MatchingQuiz";
import {Utils} from "../utils/Utils";

import CarImg from "../assets/car.png";
import TreeImg from "../assets/tree.png";
import TopBarImg from "../assets/topbar.png";
import RoadImg from "../assets/road.png";
import GreenswardImg from "../assets/greensward.jpg";
import CatImg from "../assets/cat.png";
import BirdImg from "../assets/bird.png";
import ChickenImg from "../assets/chicken.png";
import HoleImg from "../assets/holes.png";
import StoneImg from "../assets/stone.png";

export class GameRenderer {
    // Kích thước màn hình tiêu chuẩn (màn hình sử dụng trong quá trình phát triển game)
    private static readonly standardScreenWidth : number = 1866;
    private static readonly standardScreenHeight : number = 910;

    // Tỉ lệ màn hình
    private static readonly screenRatio : number = GameRenderer.standardScreenWidth / GameRenderer.standardScreenHeight;

    // Tỉ lệ kích thước của con đường so với màn hình
    private static readonly roadScaleX : number = 2 / 3;
    private static readonly roadScaleY : number = 2;

    // Danh sách ảnh các vật cản
    private static readonly obstacleImages: string[] = [CatImg, BirdImg, ChickenImg, HoleImg, StoneImg];

    private static readonly topBarWidth : number = 1160;
    private static readonly topBarHeight : number = 120;
    private static readonly topBarScale : number = 0.75;
    private static readonly topBarDuraX1 : number = 63;
    private static readonly topBarDuraX2 : number = 689;
    private static readonly topBarProgressEndY : number = 56;

    private static readonly quizContainerWidth : number = 0.74;
    private static readonly quizContainerHeight : number = 0.74;
    private static readonly quizContainerPosTop : number = (1 - GameRenderer.quizContainerWidth) * 0.5;
    private static readonly quizContainerPosLeft : number = (1 - GameRenderer.quizContainerHeight) * 0.5;

    private static readonly quizCardWidth = GameRenderer.quizContainerWidth * 0.1;
    private static readonly quizCardHeight = GameRenderer.quizContainerHeight * 0.3;
    private static readonly quizCardPaddingX = GameRenderer.quizContainerWidth * 0.01;

    private static readonly autoChooseQuiz: boolean = false;
    private static readonly quizDebug: boolean = false;
    private static readonly noCollision: boolean = false;

    private static readonly car2SceneSpeedFunction = new LinearFunction(
        new Point(25, 6),
        new Point(300, 30)
    );

    // Chỉnh vị trí tương đối của 1 vật so với vật chứa nó
    // - container: độ dài vật chứa
    // - object: độ dài vật cần tìm vị trí
    // - position: vị trí (0.0 - 1.0) vd 0.5 = ở giữa
    private static align(container: number, object: number, position: number) : number {
        return ((container - object) / object) * position;
    }

    private static getTreeXFromY(treeY: number) : number {
        // Phương trình đường thẳng giữa hai điểm:
        // A(Sw/3, 2Sh) và B(0, 0)
        // => y = 6*(Sh/Sw)*x
        // => x = (Sw/Sh)*y/6
        return GameRenderer.screenRatio * -treeY / 6;
    }

    // Tỉ lệ kích thước theo X/Y
    private viewportScaleX : number = 1;
    private viewportScaleY : number = 1;

    // Kích thước màn hình hiện tại
    private screenWidth : number = 0;
    private screenHeight : number = 0;

    // Góc giữa Ox và OF (chỉ xét trong 1 làn đường)
    private laneAlpha : number = 0;

    // Các biến khác
    private _paused : boolean = false;               // Tạm dừng game
    private _carSide: number = 1;                    // Vị trí làn chứa xe
    private _carState: boolean = false;              // Trạng thái xe (T: đang chạy, F: dừng)
    private shouldUpdateCarSide : boolean = false;   // Yêu cầu cập nhật vị trí xe
    private _inQuiz: boolean = false;                // Đang trong quá trình làm bài

    private readonly _app : PIXI.Application;
    private ticker : any;
    private events : RenderEvents;
    private obstacles : PIXI.projection.Sprite2d[] | undefined[] = [
        undefined, undefined, undefined,
        undefined, undefined, undefined
    ];
    private acceleration: number = 1;
    private durabilityBar: PIXI.Sprite | null = null;
    private travelledDistance: PIXI.Text | null = null;
    private speed: PIXI.Text | null = null;
    private quizContainer: PIXI.Container | null = null;
    private quizProgressBar: PIXI.Sprite | null = null;
    private quizTimer: PIXI.Text | null = null;
    private quizPenalty: PIXI.Text | null = null;
    private quizPenaltyBg: PIXI.Sprite | null = null;
    private quizTimerBg: PIXI.Sprite | null = null;
    private quizChosenCardContainer: Scrollbox | null = null;
    private quizAvailableCardContainer: Scrollbox | null = null;
    private quizGraph: PIXI.Container | null = null;
    private quizGraphScaleX: number = 1;
    private quizGraphScaleY: number = 1;

    constructor(events: RenderEvents) {
        this._app = new PIXI.Application({
            backgroundColor: 0xffffff,
            width: window.innerWidth,
            height: window.innerWidth / GameRenderer.screenRatio,
            antialias: true,
            resolution: window.devicePixelRatio || 1
        });
        this._app.stage.sortableChildren = true;
        this.events = events;
        document.body.appendChild(this._app.view);
        this._app.view.style.position = "absolute";
        this._app.view.style.zIndex = "999999";
        this._app.view.style.top = ((window.innerHeight - this._app.view.height) * 0.5)+"px";
        this._app.view.style.left = "0px";
    }

    get app(): PIXI.Application {
        return this._app;
    }

    set carSide(value: number) {
        if(this._carSide != value){
            this._carSide = value;
            this.shouldUpdateCarSide = true;
        }
    }

    get carSide(): number {
        return this._carSide;
    }

    get carState(): boolean {
        return this._carState;
    }

    set carState(value: boolean) {
        this._carState = value;
    }

    set paused(state: boolean) {
        this._paused = state;
    }

    get paused() : boolean {
        return this._paused;
    }

    get inQuiz(): boolean {
        return this._inQuiz;
    }

    set inQuiz(value: boolean) {
        this._inQuiz = value;
    }

    // Tìm gia tốc tương đối giữa vật và hình mẫu
    // - model: độ dài hình mẫu (vd cây)
    // - object: độ dài vật
    // VD: cái cây cao hơn so với 1 tảng đá -> gia tốc của tảng đá cần phải lớn hơn
    // để khi render, người xem sẽ thấy cả hai cùng di chuyển
    private accelerationOf(model: number, object: number) : number {
        return this.acceleration;
    }

    private resetTreePosition(tree: PIXI.projection.Sprite2d){
        let y = -this.screenHeight * 0.5;
        // Hệ số được tạo ngẫu nhiên -> tránh trường hợp hai cây xuất hiện cùng lúc
        y *= Math.max(2, Math.random() * 6);
        tree.position.set(this.screenWidth * 0.5, y);
    }

    private resetObstaclePosition(obstacle: PIXI.projection.Sprite2d, group: number){
        let y = -this.screenHeight/2;
        // Hệ số được tạo ngẫu nhiên -> để các vật cản xuất hiện không đồng thời
        y *= Math.max(2, Math.random() * 6) * (group + 1);
        obstacle.position.set(this.screenWidth / 2, y);
    }

    private resetCarPosition(car: PIXI.projection.Sprite2d, side: number){
        const anchorX = this.screenWidth / car.width;
        // Hạ xe xuống dưới khung hình (chỉ để lộ một phần thân xe)
        const anchorY = -(this.screenHeight / car.height) * 0.25;
        if(side == 0) {
            car.anchor.set(-anchorX * 0.18, anchorY);
            car.skew.set(-this.laneAlpha, 0);
        } else if(side == 1) {
            car.anchor.set(-anchorX * 0.4, anchorY);
            car.skew.set(0, 0);
        } else if(side == 2) {
            car.anchor.set(-anchorX * 0.65, anchorY);
            car.skew.set(this.laneAlpha, 0);
        }
    }

    private getObstacleXFromY(obstacleY: number, ratio: number) : number {
        // Phương trình đường thẳng giữa hai điểm:
        // A(Sw/2, 2Sh) và B(ratio * Sw, 0)
        // => Sh*x - ratio*Sw*Sh + (ratio - 0.5)*(Sw/Sh)*y/2 = 0
        return ratio * this.screenWidth - (ratio - 0.5) * GameRenderer.screenRatio * -obstacleY / 2;
    }

    private updateScreenView(){
        this.screenWidth = this.app.screen.width;
        this.screenHeight = this.app.screen.height;
        this.viewportScaleX = this.screenWidth / GameRenderer.standardScreenWidth;
        this.viewportScaleY = this.screenHeight / GameRenderer.standardScreenHeight;
        this.laneAlpha = Math.PI * 0.5 - Math.atan2(
            this.screenHeight * GameRenderer.roadScaleY,
            this.screenWidth * GameRenderer.roadScaleX / 3,
        );
        this.shouldUpdateCarSide = true;
    }

    public updateScreenSize() {
        this.app.renderer.resize(
            window.innerWidth,
            window.innerWidth / GameRenderer.screenRatio
        )
        this.renderScene();
    }

    public renderScene() {
        if(this.ticker !== undefined) {
            this.app.stage.removeChildren();
            this.app.ticker.remove(this.ticker);
        }
        this.updateScreenView();
        if(!this.paused) {
            this.carState = true;
        }

        const background = new PIXI.projection.Sprite2d(PIXI.Texture.from(GreenswardImg));
        background.width = this.screenWidth;
        background.height = this.screenHeight;

        const focus = new PIXI.Sprite();
        focus.tint = 0xff0000;
        focus.scale.set(1, 1);
        focus.anchor.set(0.5, 0.5);
        focus.position.set(this.screenWidth * 0.5, -this.screenHeight);

        const container = new PIXI.projection.Container2d();
        container.position.set(this.screenWidth * 0.5, this.screenHeight);

        const mainRoad = new PIXI.projection.Sprite2d(PIXI.Texture.from(RoadImg));
        mainRoad.anchor.set(0.5, 1.0);
        mainRoad.width = this.screenWidth * GameRenderer.roadScaleX;
        mainRoad.height = this.screenHeight * GameRenderer.roadScaleY;

        const squarePlane = new PIXI.projection.Container2d();
        squarePlane.proj.affine = PIXI.projection.AFFINE.AXIS_X;
        squarePlane.position.set(-this.screenWidth * 0.5, -this.screenHeight * 0.5);
        squarePlane.sortableChildren = true;

        const treeA = new PIXI.projection.Sprite2d(PIXI.Texture.from(TreeImg));
        treeA.width = 300 * this.viewportScaleX;
        treeA.height = 450 * this.viewportScaleY;
        treeA.anchor.set(0.5, 0.5);
        this.resetTreePosition(treeA);

        const treeB = new PIXI.projection.Sprite2d(PIXI.Texture.from(TreeImg));
        treeB.width = treeA.width;
        treeB.height = treeA.height;
        treeB.anchor.set(0.5, 0.5);
        this.resetTreePosition(treeB);

        const car = new PIXI.projection.Sprite2d(PIXI.Texture.from(CarImg));
        car.width = 327;
        car.height = 537;
        car.zIndex = 99;
        this.resetCarPosition(car, this.carSide);

        const topBar = new PIXI.projection.Sprite2d(PIXI.Texture.from(TopBarImg));
        topBar.width = GameRenderer.topBarWidth * this.viewportScaleX * GameRenderer.topBarScale;
        topBar.height = GameRenderer.topBarHeight * this.viewportScaleY * GameRenderer.topBarScale;
        topBar.anchor.set(1, 0);
        topBar.position.set(this.screenWidth, 0);

        this.durabilityBar = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.durabilityBar.width = (GameRenderer.topBarDuraX2 - GameRenderer.topBarDuraX1 + 1) * this.viewportScaleX * GameRenderer.topBarScale;
        this.durabilityBar.height = GameRenderer.topBarProgressEndY * this.viewportScaleY * GameRenderer.topBarScale;
        this.durabilityBar.tint = 0xba5d61;
        this.durabilityBar.anchor.set(1, 0);
        this.durabilityBar.position.set(
            this.screenWidth - (GameRenderer.topBarWidth - GameRenderer.topBarDuraX2) * this.viewportScaleX * GameRenderer.topBarScale,
            0
        );

        this.travelledDistance = new PIXI.Text("", new PIXI.TextStyle({
            fill: "white",
            fontSize: 40,
            fontStyle: "italic"
        }));
        this.travelledDistance.zIndex = 10;
        this.travelledDistance.anchor.set(1, 0);
        this.travelledDistance.position.set(this.screenWidth - 20 * this.viewportScaleX, 10 * this.viewportScaleY);

        this.speed = new PIXI.Text("", new PIXI.TextStyle({
            fill: "white",
            fontSize: 16
        }));
        this.speed.zIndex = 10;
        this.speed.anchor.set(1, 0);
        this.speed.position.set(this.travelledDistance.position.x, 55 * this.viewportScaleY);

        this.app.stage.addChild(background);
        this.app.stage.addChild(container);
        this.app.stage.addChild(focus);
        this.app.stage.addChild(topBar);
        this.app.stage.addChild(this.durabilityBar);
        this.app.stage.addChild(this.travelledDistance);
        this.app.stage.addChild(this.speed);
        container.addChild(mainRoad);
        container.addChild(squarePlane);
        squarePlane.addChild(treeA);
        squarePlane.addChild(treeB);
        squarePlane.addChild(car);

        this.ticker = function () {
            if(container == null && focus.position != null) return;
            (this.events.onTick.bind(this))();

            const pos = container.toLocal(
                focus.position,
                undefined,
                undefined,
                undefined,
                PIXI.projection.TRANSFORM_STEP.BEFORE_PROJ
            );
            pos.y = -pos.y;
            pos.x = -pos.x;
            container.proj.setAxisY(pos, -1);

            if(this.shouldUpdateCarSide) {
                car.scale.set(this.viewportScaleX, this.viewportScaleY);
                this.resetCarPosition(car, this.carSide);
                if(car.width != this.viewportScaleX && car.height != this.viewportScaleY) {
                    this.shouldUpdateCarSide = false;
                }
            }

            if(this.paused) {
                return;
            } else if(GameRenderer.quizDebug) {
                this.paused = true;
                this.carState = false;
            }

            // chọn cây làm hình mẫu khi tính gia tốc
            const modelHeight = (treeA.height + treeB.height) / 2;

            const treeAy = treeA.position.y + this.accelerationOf(modelHeight, treeA.height);
            const treeAx = GameRenderer.getTreeXFromY(treeAy);
            treeA.position.set(treeAx, treeAy);
            if(treeAy > this.screenHeight) {
                this.resetTreePosition(treeA);
            }

            const treeBy = treeB.position.y + this.accelerationOf(modelHeight, treeB.height);
            const treeBx = this.screenWidth - GameRenderer.getTreeXFromY(treeBy);
            treeB.position.set(treeBx, treeBy);
            if(treeBy > this.screenHeight) {
                this.resetTreePosition(treeB);
            }

            for (let i = 0; i < this.obstacles.length; i++) {
                let osc = this.obstacles[i];
                if (osc === undefined) {
                    if (Math.random() <= 0.1 && Math.random() <= 0.05) {
                        osc = new PIXI.projection.Sprite2d(PIXI.Texture.from(
                            GameRenderer.obstacleImages[~~(Math.random() * GameRenderer.obstacleImages.length)]
                        ));
                        osc.width = 100 * this.viewportScaleX;
                        osc.height = 100 * this.viewportScaleY;
                        osc.anchor.set(0.5, 0.5);
                        this.resetObstaclePosition(osc, Math.floor(i / 3));
                        squarePlane.addChild(osc);
                        this.obstacles[i] = osc;
                    }
                } else {
                    const oscY = osc.position.y + this.accelerationOf(modelHeight, osc.height);
                    if(oscY >= this.screenHeight * 0.1 && oscY <= this.screenHeight * 0.5 && this.carSide == (i % 3) && !GameRenderer.noCollision) {
                        squarePlane.removeChild(osc);
                        this.obstacles[i] = undefined;
                        this.paused = true;
                        this.carState = false;
                        break;
                    } else if (oscY >= this.screenHeight * 0.75) {
                        squarePlane.removeChild(osc);
                        this.obstacles[i] = undefined;
                    } else {
                        let oscX = 0;
                        if(i % 3 == 0) {
                            oscX = this.getObstacleXFromY(oscY, 5/18);
                        } else if(i % 3 == 1) {
                            oscX = this.getObstacleXFromY(oscY, 1/2);
                        } else if(i % 3 == 2) {
                            oscX = this.getObstacleXFromY(oscY, 13/18);
                        }
                        osc.position.set(oscX, oscY);
                    }
                }
            }
        };
        this.app.ticker.add(this.ticker.bind(this));
    }

    public updateTravelledDistance(value: number) {
        if(this.travelledDistance != null) {
            this.travelledDistance.text = Math.floor(value) + "m";
        }
    }

    public updateSpeed(value: number) {
        if(this.speed != null) {
            this.speed.text = Math.floor(value) + "m/s";
            this.acceleration = GameRenderer.car2SceneSpeedFunction.eval(value, "Y_UPPER");
        }
    }

    public updateDurabilityBar(value: number) {
        if(this.durabilityBar != null) {
            this.durabilityBar.width = (GameRenderer.topBarDuraX2 - GameRenderer.topBarDuraX1 + 1) * this.viewportScaleX * GameRenderer.topBarScale * (1 - value);
        }
    }

    private renderQuizContainer() {
        this.quizContainer = new PIXI.Container();
        this.quizContainer.zIndex = 999;
        this.quizContainer.sortableChildren = true;
        this.app.stage.addChild(this.quizContainer);

        // nền đen bên ngoài khung câu hỏi
        const overlay = new PIXI.Sprite(PIXI.Texture.WHITE);
        overlay.width = this.screenWidth;
        overlay.height = this.screenHeight;
        overlay.tint = 0x000000;
        overlay.alpha = 0.75;
        overlay.anchor.set(0.5, 0.5);
        overlay.position.set(this.screenWidth * 0.5, this.screenHeight * 0.5);

        // khung câu hỏi
        const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        bg.width = this.screenWidth * GameRenderer.quizContainerWidth;
        bg.height = this.screenHeight * GameRenderer.quizContainerHeight;
        bg.tint = 0xffffff;
        bg.anchor.set(0.5, 0.5);
        bg.position.copyFrom(overlay.position);

        const progressBarFull = new PIXI.Sprite(PIXI.Texture.WHITE);
        progressBarFull.width = bg.width;
        progressBarFull.height = this.screenHeight * 0.01;
        progressBarFull.tint = 0x262626;
        progressBarFull.anchor.set(0, 0.5);
        progressBarFull.position.set(
            this.screenWidth * GameRenderer.quizContainerPosLeft,
            this.screenHeight * (1 - GameRenderer.quizContainerPosTop) - progressBarFull.height * 0.5
        );

        this.quizProgressBar = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.quizProgressBar.width = progressBarFull.width;
        this.quizProgressBar.height = progressBarFull.height;
        this.quizProgressBar.tint = 0x4095f7;
        this.quizProgressBar.anchor.set(0, 0.5);
        this.quizProgressBar.position.copyFrom(progressBarFull.position);
        this.quizProgressBar.zIndex = 50;

        this.quizPenaltyBg = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.quizPenaltyBg.width = this.screenWidth * 0.075;
        this.quizPenaltyBg.height = this.screenHeight * 0.05;
        this.quizPenaltyBg.tint = 0xc93e2e;
        this.quizPenaltyBg.anchor.set(0.5, 0.5);
        this.quizPenaltyBg.position.set(
            this.screenWidth * (1 - GameRenderer.quizContainerPosLeft) - this.quizPenaltyBg.width * 0.5,
            this.screenHeight * GameRenderer.quizContainerPosTop + this.quizPenaltyBg.height * 0.5
        );

        this.quizTimerBg = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.quizTimerBg.width = this.screenWidth * 0.1;
        this.quizTimerBg.height = this.quizPenaltyBg.height;
        this.quizTimerBg.tint = 0x3f454d;
        this.quizTimerBg.anchor.set(0.5, 0.5);
        this.quizTimerBg.position.set(
            this.screenWidth * (1 - GameRenderer.quizContainerPosLeft) - this.quizPenaltyBg.width - this.quizTimerBg.width * 0.5,
            this.quizPenaltyBg.position.y
        );

        const style = new PIXI.TextStyle({
            fill: "white"
        });
        this.quizPenalty = new PIXI.Text("", style);
        this.quizPenalty.zIndex = 10;
        this.quizPenalty.anchor.set(0.5, 0.5);
        this.quizTimer = new PIXI.Text("", style);
        this.quizTimer.zIndex = 10;
        this.quizTimer.anchor.set(0.5, 0.5);

        this.quizContainer.addChild(overlay);
        this.quizContainer.addChild(bg);
        this.quizContainer.addChild(progressBarFull);
        this.quizContainer.addChild(this.quizProgressBar);
        this.quizContainer.addChild(this.quizPenaltyBg);
        this.quizContainer.addChild(this.quizTimerBg);
        this.quizContainer.addChild(this.quizPenalty);
        this.quizContainer.addChild(this.quizTimer);
    }

    public updateQuizProgressBar(value: number){
        if(this.quizProgressBar != null) {
            this.quizProgressBar.width = this.screenWidth * GameRenderer.quizContainerWidth * value;
        }
    }

    public updateQuizPenalty(value: string) {
        if (this.quizPenalty != null && this.quizPenaltyBg != null) {
            this.quizPenalty.text = value;
            this.quizPenalty.position.copyFrom(this.quizPenaltyBg.position);
        }
    }

    public updateQuizTimer(value: string) {
        if (this.quizTimer != null && this.quizTimerBg != null) {
            this.quizTimer.text = value;
            this.quizTimer.position.copyFrom(this.quizTimerBg.position);
        }
    }

    public popupResult(rating: number) {
        let text : PIXI.Text;
        if(rating == 0) {
            const style = new PIXI.TextStyle({
                dropShadow: true,
                dropShadowColor: "#72bfa0",
                fill: [
                    "#3bbc7c",
                    "#74cda0"
                ],
                fillGradientType: 1,
                fontFamily: "Comic Sans MS",
                fontSize: 50,
                fontWeight: "bold",
                letterSpacing: 2,
                stroke: "#2b6856",
                strokeThickness: 5
            });
            text = new PIXI.Text('ĐÚNG RỒI :)', style);
        } else {
            const style = new PIXI.TextStyle({
                dropShadow: true,
                dropShadowColor: "#be8175",
                fill: [
                    "#b61f1f",
                    "#c45f5f"
                ],
                fillGradientType: 1,
                fontFamily: "Comic Sans MS",
                fontSize: 50,
                fontWeight: "bold",
                letterSpacing: 2,
                stroke: "#730009",
                strokeThickness: 5
            });
            text = new PIXI.Text(rating == 1 ? 'SAI RỒI :(' : "HẾT GIỜ :(", style);
        }
        text.zIndex = 999;
        text.anchor.set(0.5, 0.5);
        text.position.set(
            this.screenWidth * 0.5,
            this.screenHeight * 0.5
        );
        if(this.quizContainer != null) {
            this.quizContainer.addChild(text);
        }
    }

    private removeChildren(container: PIXI.Container){
        for (const obj of container.children) {
            container.removeChild(obj);
            if(obj instanceof PIXI.Container) {
                this.removeChildren(obj);
            }
        }
    }

    public closeQuiz() {
        this.inQuiz = false;
        if(this.quizContainer != null) {
            this.removeChildren(this.quizContainer);
            this.app.stage.removeChild(this.quizContainer);
            this.quizContainer = null;
        }
    }

    public popupLost() {
        const style = new PIXI.TextStyle({
            dropShadow: true,
            dropShadowColor: "#be8175",
            fill: ["#b61f1f"],
            fillGradientType: 1,
            fontFamily: "Comic Sans MS",
            fontSize: 80,
            fontWeight: "bold",
            letterSpacing: 2,
            stroke: "#730009",
            strokeThickness: 5,
            align: "center"
        });
        const text = new PIXI.Text('BẠN ĐÃ THUA CUỘC!\nNON VL :))', style);
        text.zIndex = 9999;
        text.anchor.set(0.5, 0.5);
        text.position.set(
            this.screenWidth * 0.5,
            this.screenHeight * 0.5
        );
        this.app.stage.addChild(text);
    }

    public openMultiChoiceQuiz(quiz: MultiChoiceQuiz | undefined) {
        if (this.inQuiz) return;
        this.inQuiz = true;

        if (quiz != null) {
            this.renderQuizContainer();

            // khoảng cách giữa câu hỏi và câu trả lời; hoặc giữa hai dòng câu trả lời
            const splitPadding = this.screenHeight * 0.05;

            // vị trí x (căn lề trái)
            const leftAlignedX = this.screenWidth * 0.2;

            // vị trí x (căn lề giữa)
            const centerAlignedX = this.screenWidth * 0.5;

            // lề trên cùng
            const topPadding = this.screenHeight * 0.2;

            const postQuestionRender = function (this: GameRenderer, question: PIXI.Sprite) {
                const style = new PIXI.TextStyle({
                    fontSize: 18,
                    fontWeight: "bold"
                });
                const text0 = new PIXI.Text("Hãy chọn đáp án đúng nhất:", style);
                text0.anchor.set(0, 0.5);
                text0.position.set(leftAlignedX, topPadding + question.height + splitPadding);
                this.quizContainer?.addChild(text0);

                const posY = text0.position.y + splitPadding;
                const choiceList = [
                    {
                        x: leftAlignedX,
                        y: posY,
                        y0: 0,
                        sprite: {}
                    },
                    {
                        x: centerAlignedX,
                        y: posY,
                        y0: 0,
                        sprite: {}
                    },
                    {
                        x: leftAlignedX,
                        y: posY + splitPadding,
                        y0: 0,
                        sprite: {}
                    },
                    {
                        x: centerAlignedX,
                        y: posY + splitPadding,
                        y0: 0,
                        sprite: {}
                    }
                ];

                const updateChoicePosition = function (this: GameRenderer) {
                    for (let i = 0; i < Math.min(quiz.choices.length, choiceList.length); i++) {
                        const choice = choiceList[i];
                        if (choice.sprite != null && choice.sprite instanceof PIXI.Sprite) {
                            const sprite = choice.sprite as PIXI.Sprite;
                            if (sprite.height < 1) {
                                // try again... if a sprite is not loaded fully
                                setTimeout(updateChoicePosition, 500);
                                return;
                            }
                            sprite.position.set(choice.x, choice.y + choice.y0);
                            if(this.quizContainer != null) {
                                this.quizContainer.addChild(sprite);
                            }
                            // đối với hai đáp án ở hàng đầu tiên, sau khi xong chúng ta sẽ
                            // lấy chiều rộng của nó để tính toán vị trí hàng thứ hai
                            if (i == 0) {
                                choiceList[2].y0 = sprite.height;
                            } else if (i == 1) {
                                choiceList[3].y0 = sprite.height;
                            }
                        } else {
                            // try again... if a sprite is not loaded fully
                            setTimeout(updateChoicePosition, 500);
                            return;
                        }
                    }

                    if(GameRenderer.autoChooseQuiz) {
                        (this.events.onPickChoice.bind(this))(quiz.answer);
                    }
                }.bind(this);

                // pre-render choices
                const renderChoices = function (this: GameRenderer, i: number) {
                    const choice = quiz.choices[i];
                    HTMLRenderer.createTexture(MathMLRenderer.mml2canvas(choice), function (this: GameRenderer, txt: PIXI.Texture) {
                        const sprite = new PIXI.Sprite(txt);
                        sprite.anchor.set(0, 0);
                        sprite.interactive = true;
                        sprite.buttonMode = true;
                        sprite.on('pointerdown', function (this: GameRenderer) {
                            (this.events.onPickChoice.bind(this))(i);
                        }.bind(this));
                        choiceList[i].sprite = sprite;
                        // render lần lượt các lựa chọn
                        if (i + 1 < Math.min(quiz.choices.length, choiceList.length)) {
                            renderChoices(i + 1);
                        } else {
                            // khi tất cả đã xong thì bắt đầu cập nhật vị trí
                            setTimeout(updateChoicePosition, 500);
                        }
                    }.bind(this));
                }.bind(this);

                renderChoices(0);

                //
            }.bind(this);

            // render question
            HTMLRenderer.createTexture(MathMLRenderer.mml2canvas(quiz.question), function (this: GameRenderer, txt: PIXI.Texture) {
                const question = new PIXI.Sprite(txt);
                question.anchor.set(0, 0);
                question.position.set(leftAlignedX, topPadding);
                if(this.quizContainer != null) {
                    this.quizContainer.addChild(question);
                }

                // delay for a bit to allow the question's sprite to update its height
                setTimeout(function () {
                    postQuestionRender(question);
                }, 500)
            }.bind(this));
        }
    }

    public openCountingQuiz(quiz: CountingQuiz | undefined) {
        if (this.inQuiz) return;
        this.inQuiz = true;

        if (quiz != null) {
            this.renderQuizContainer();

            // khoảng cách giữa câu hỏi và câu trả lời; hoặc giữa hai dòng câu trả lời
            const splitPadding = this.screenHeight * 0.05;

            // vị trí x (căn lề trái)
            const leftAlignedX = this.screenWidth * 0.2;

            // lề trên cùng
            const topPadding = this.screenHeight * 0.2;

            const postQuestionRender = function (this: GameRenderer, question: PIXI.Sprite) {
                const text0 = new PIXI.Text("Vui lòng nhập kết quả của bài toán trên:", new PIXI.TextStyle({
                    fontSize: 18,
                    fontWeight: "bold"
                }));
                text0.anchor.set(0, 0.5);
                text0.position.set(leftAlignedX, topPadding + question.height + splitPadding);
                this.quizContainer?.addChild(text0);

                const input = new TextInput({
                    input: {
                        fontSize: '18px',
                        padding: '10px',
                        width: '300px',
                        color: '#26272E'
                    },
                    box: {
                        default: {fill: 0xE8E9F3, rounded: 12, stroke: {color: 0xCBCEE0, width: 3}},
                        focused: {fill: 0xE1E3EE, rounded: 12, stroke: {color: 0xABAFC6, width: 3}},
                        disabled: {fill: 0xDBDBDB, rounded: 12}
                    }
                });
                input.position.set(leftAlignedX, text0.position.y + splitPadding);
                this.quizContainer?.addChild(input);

                const btn = new PIXI.Sprite(PIXI.Texture.WHITE);
                btn.width = 100 * this.viewportScaleX;
                btn.height = 40 * this.viewportScaleY;
                btn.tint = 0x348ceb;
                btn.anchor.set(0, 0.5);
                btn.position.set(leftAlignedX, input.position.y + splitPadding * 2);
                btn.buttonMode = true;
                btn.interactive = true;
                btn.on('pointerdown', function (this: GameRenderer) {
                    (this.events.onSubmitCount.bind(this))(input.text);
                }.bind(this));
                this.quizContainer?.addChild(btn);

                const text1 = new PIXI.Text("NỘP BÀI", new PIXI.TextStyle({
                    fontSize: 16,
                    fontWeight: "600",
                    fill: ["#ffffff"]
                }));
                text1.anchor.set(0, 0.5);
                text1.position.copyFrom(btn);
                text1.position.x += (btn.width - text1.width) * 0.5;
                text1.zIndex = 10;
                this.quizContainer?.addChild(text1);
                //
            }.bind(this);

            // render question
            HTMLRenderer.createTexture(MathMLRenderer.mml2canvas(quiz.question), function (this: GameRenderer, txt: PIXI.Texture) {
                const question = new PIXI.Sprite(txt);
                question.anchor.set(0, 0);
                question.position.set(leftAlignedX, topPadding);
                if(this.quizContainer != null) {
                    this.quizContainer.addChild(question);
                }

                // delay for a bit to allow the question's sprite to update its height
                setTimeout(function () {
                    postQuestionRender(question);
                }, 500)
            }.bind(this));
        }
    }

    private renderCardContainer(cards: number[], maxCards: number, onCardFocused: any, posY: number) : Scrollbox {
        const textStyle = new PIXI.TextStyle({
            fontSize: 25,
            fontWeight: "600",
            fill: ["#ffffff"]
        });
        const scrollbox = new Scrollbox({
            boxWidth: this.screenWidth * GameRenderer.quizContainerWidth,
            boxHeight: this.screenHeight * GameRenderer.quizCardHeight,
            overflowY: "none",
            overflowX: "auto"
        });
        scrollbox.sortableChildren = true;
        scrollbox.position.set(
            this.screenWidth * GameRenderer.quizContainerPosLeft,
            posY
        );

        const cardBg = scrollbox.content.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
        cardBg.width = Math.max(this.screenWidth * (GameRenderer.quizCardWidth * cards.length + GameRenderer.quizCardPaddingX * (Math.max(1, cards.length) + 1)), this.screenWidth * GameRenderer.quizContainerWidth);
        cardBg.height = scrollbox.boxHeight;
        cardBg.tint = 0xa845a5;

        let cardCount = cards.length;
        if(maxCards > 0) {
            cardCount = Math.max(cardCount, maxCards);
        }
        for (let i = 0; i < cardCount; i++) {
            const blank = i >= cards.length;

            const sprite = scrollbox.content.addChild(new PIXI.Sprite(PIXI.Texture.WHITE));
            sprite.width = this.screenWidth * GameRenderer.quizCardWidth;
            sprite.height = this.screenHeight * GameRenderer.quizCardHeight;
            sprite.tint = blank ? 0x7d247a : 0x9c3298;
            sprite.position.set(sprite.width * i + this.screenWidth * GameRenderer.quizCardPaddingX * (i + 1), 0);
            sprite.zIndex = 5;

            const text = scrollbox.content.addChild(new PIXI.Text(blank ? "" : (cards[i] + ""), textStyle));
            text.anchor.set(0, 0);
            text.position.copyFrom(sprite);
            text.position.x += 30;
            text.position.y += 30;
            text.zIndex = 10;

            if(!blank) {
                sprite.interactive = true;
                sprite.buttonMode = true;
                sprite.on('pointerdown', function (this: GameRenderer) {
                    onCardFocused(i);
                }.bind(this));
                sprite.on('pointerover', function (this: GameRenderer) {
                    sprite.tint = 0x7d247a;
                }.bind(this));
                sprite.on('pointerout', function (this: GameRenderer) {
                    sprite.tint = 0x9c3298;
                }.bind(this));
            }

            scrollbox.update();
        }
        this.quizContainer?.addChild(scrollbox);
        return scrollbox;
    }

    public renderChosenCardContainer(cards: number[], maxChosenCards: number) {
        let scrollX = 0;
        if(this.quizChosenCardContainer != null) {
            scrollX = this.quizChosenCardContainer.scrollLeft;
            this.quizContainer?.removeChild(this.quizChosenCardContainer);
        }
        this.quizChosenCardContainer = this.renderCardContainer(
            cards,
            maxChosenCards,
            function (this: GameRenderer, card: number) {
                (this.events.onPickCard.bind(this))(0, card);
            }.bind(this),
            this.screenHeight * (1 - GameRenderer.quizContainerPosTop - GameRenderer.quizCardHeight * 2.1) - (this.quizProgressBar == undefined ? 0 : this.quizProgressBar.height)
        );
        this.quizChosenCardContainer.scrollLeft = scrollX;
    }

    public renderAvailableCardContainer(cards: number[]) {
        let scrollX = 0;
        if(this.quizAvailableCardContainer != null) {
            scrollX = this.quizAvailableCardContainer.scrollLeft;
            this.quizContainer?.removeChild(this.quizAvailableCardContainer);
        }
        this.quizAvailableCardContainer = this.renderCardContainer(
            cards,
            -1,
            function (this: GameRenderer, card: number) {
                (this.events.onPickCard.bind(this))(1, card);
            }.bind(this),
            this.screenHeight * (1 - GameRenderer.quizContainerPosTop - GameRenderer.quizCardHeight) - (this.quizProgressBar == undefined ? 0 : this.quizProgressBar.height)
        );
        this.quizAvailableCardContainer.scrollLeft = scrollX;
    }

    public openCardQuiz(quiz: CardQuiz | undefined) {
        if (this.inQuiz) return;
        this.inQuiz = true;
        if (quiz != null) {
            this.renderQuizContainer();
            let s = "";
            switch (quiz.type) {
                case 0: {
                    s = "cấp số cộng";
                    break;
                }
                case 1: {
                    s = "cấp số nhân";
                    break;
                }
                case 2: {
                    s = "hệ số nhị thức newton của biểu thức (x+1)^n (x, n nguyên dương)";
                    break;
                }
            }
            const text0 = new PIXI.Text(`Hãy sắp xếp các thẻ theo thứ tự để tạo thành một dãy ${s}:`, new PIXI.TextStyle({
                fontSize: 18,
                fontWeight: "bold"
            }));
            text0.anchor.set(0.5, 0.5);
            text0.position.set(this.screenWidth * 0.5, this.screenHeight * 0.3);
            this.quizContainer?.addChild(text0);
        }
    }

    // TÌM SCALE CHO ĐỒ THỊ THEO TRỤC X HOẶC TRỤC Y
    // Thuật toán:
    // - Do yêu cầu điểm ở xa nhất phải nằm trong khung đồ thị
    // nên cần phải tìm vị trí xa nhất của nó (trên 1 trục)
    // + Tìm vị trí lower và upper
    // + So sánh giá trị tuyệt đối của chúng và tìm ra max
    // - Khi đó scale = <độ dài khung đồ thị> / <max * 2>
    private static getGraphScale(quiz: MatchingQuiz, graphLength: number, axisX: boolean): number {
        let lower: number | undefined = undefined;
        let upper: number | undefined = undefined;
        for(const v of quiz.answer){
            lower = Utils.safeMin(lower, axisX ? v.begin.x : v.begin.y);
            lower = Utils.safeMin(lower, axisX ? v.end.x : v.end.y);
            upper = Utils.safeMax(upper, axisX ? v.begin.x : v.begin.y);
            upper = Utils.safeMax(upper, axisX ? v.end.x : v.end.y);
        }
        for(const p of quiz.dummies){
            lower = Utils.safeMin(lower, axisX ? p.x : p.y);
            upper = Utils.safeMax(upper, axisX ? p.x : p.y);
        }
        return upper === undefined || lower === undefined ? 1 : graphLength / (Math.max(Math.abs(upper), Math.abs(lower)) * 2);
    }

    private renderGraphPoint(p: Point) {8
        const r = Math.min(this.viewportScaleX, this.viewportScaleY) * 8;
        const x = this.screenWidth * 0.5 + p.x * this.quizGraphScaleX;
        const y = this.screenHeight * 0.5 - p.y * this.quizGraphScaleY;
        const point = new PIXI.Graphics();
        point.zIndex = 1;
        this.quizGraph?.addChild(point);

        point.beginFill(0xfcba03);
        point.drawCircle(x, y, r);
        point.endFill();

        point.interactive = true;
        point.buttonMode = true;
        point.on('pointerdown', function (this: GameRenderer) {
            (this.events.onSelectPoint.bind(this))(p);
        }.bind(this));
        let toolTip: PIXI.Text;
        point.on('pointerover', function (this: GameRenderer) {
            toolTip = new PIXI.Text(`(${p.x},${p.y})`, new PIXI.TextStyle({
                fontSize: 14
            }));
            toolTip.position.set(
                x + 15 * this.viewportScaleX,
                y + 7 * this.viewportScaleY
            );
            toolTip.zIndex = 2;
            this.quizGraph?.addChild(toolTip);
        }.bind(this));
        point.on('pointerout', function (this: GameRenderer) {
            this.quizGraph?.removeChild(toolTip);
        }.bind(this));
    }

    public renderGraphVector(selectedPoint: PIXI.Point, graphPos: PIXI.Point) : any {
        const r = Math.min(this.viewportScaleX, this.viewportScaleY) * 5;
        const x1 = this.screenWidth * 0.5 + selectedPoint.x * this.quizGraphScaleX;
        const y1 = this.screenHeight * 0.5 - selectedPoint.y * this.quizGraphScaleY;
        const x2 = this.screenWidth * 0.5 + graphPos.x * this.quizGraphScaleX;
        const y2 = this.screenHeight * 0.5 - graphPos.y * this.quizGraphScaleY;
        const vect = new PIXI.Graphics();
        vect.lineStyle(r, 0xe04a4a, 1);
        vect.moveTo(x1, y1);
        vect.lineTo(x2, y2);
        this.quizGraph?.addChild(vect);
        return function (this: GameRenderer) {
            this.quizGraph?.removeChild(vect);
        }.bind(this);
    }

    public openMatchingQuiz(quiz: MatchingQuiz | undefined) {
        if (this.inQuiz) return;
        this.inQuiz = true;
        if (quiz != null) {
            this.renderQuizContainer();

            // vị trí x (căn lề trái)
            const leftAlignedX = this.screenWidth * 0.2;

            // lề trên cùng
            const topPadding = this.screenHeight * 0.2;

            const text0 = new PIXI.Text(`Hãy tìm các cặp A(x, y) và B(x, y) sao cho T(v, A) = B với v = (${quiz.direction.x}, ${quiz.direction.y})`, new PIXI.TextStyle({
                fontSize: 18,
                fontWeight: "bold"
            }));
            text0.position.set(leftAlignedX, topPadding);
            this.quizContainer?.addChild(text0);

            this.quizGraph = new PIXI.Container();
            this.quizGraph.sortableChildren = true;
            this.quizContainer?.addChild(this.quizGraph);

            const graphPaddingX = GameRenderer.quizContainerWidth * 0.2;
            const graphX1 = GameRenderer.quizContainerPosLeft + graphPaddingX;
            const graphX2 = 1 - graphX1;
            const graphPaddingY = GameRenderer.quizContainerHeight * 0.2;
            const graphY1 = GameRenderer.quizContainerPosTop + graphPaddingY;
            const graphY2 = 1 - graphY1;

            const axis = new PIXI.Graphics();
            axis.lineStyle(3, 0x636363, 1);
            axis.moveTo(this.screenWidth * 0.5, this.screenHeight * graphY1);
            axis.lineTo(this.screenWidth * 0.5, this.screenHeight * graphY2);
            axis.moveTo(this.screenWidth * graphX1, this.screenHeight * 0.5);
            axis.lineTo(this.screenWidth * graphX2, this.screenHeight * 0.5);
            this.quizGraph.addChild(axis);

            this.quizGraphScaleX = GameRenderer.getGraphScale(quiz, this.screenWidth * (graphX2 - graphX1), true);
            this.quizGraphScaleY = GameRenderer.getGraphScale(quiz, this.screenHeight * (graphY2 - graphY1), false);
            //console.log(this.screenWidth * (graphX2 - graphX1), this.screenHeight * (graphY2 - graphY1));
            //console.log(scaleX, scaleY);
            for (const p of quiz.dummies) {
                this.renderGraphPoint(p);
            }
            for (const v of quiz.answer) {
                this.renderGraphPoint(v.begin);
                this.renderGraphPoint(v.end);
            }
        }
    }

    public destroy(){
        this.app.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true
        });
    }
}