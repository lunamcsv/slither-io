import Bean from "../script/Bean"
import Snake from "../script/Snake"
import Config from "../Config";
import GameConfig from "../GameConfig";
import Joystick from "../fgui/extension/Joystick";
import { IBase, IBeanData, IEatBean, IGlobalData, ISnakeData, IStatus } from "../../types/index";
declare const Colyseus: any;
export default class GameManager {

    nickname: string
    neturl: string
    skin: number
    gameMode: number//0组队模式，1无限模式
    beanNum: number = 0
    beanOrder: number = 0
    beans: Object = {}
    snakeSelf: Snake
    snakeArr: Array<Snake> = []
    snakeMap: { [key: string]: Snake } = {};
    beanMap: { [key: string]: Bean } = {};

    battleView: fgui.GComponent;
    battleMap: Laya.Sprite;
    btnSpeed: fgui.GButton;

    private static _inst: GameManager;
    public static get inst(): GameManager {
        if (this._inst == null) {
            this._inst = new GameManager();
        }
        return this._inst;
    }
    constructor() {
        if (GameManager._inst) {
            throw "singleton class is not use new constructor!";
        }
    }

    room: any;
    initSocket() {
        let client = new Colyseus.Client("ws://localhost:2567/");
        client.joinOrCreate("state_handler").then(room => {
            console.log(room.sessionId);
            this.room = room;
            this.room.onMessage("cmd", (message: any) => {
                this.handleMsg(message.type, message.data);
                // console.log(message);
            });
            this.room.send("create_role");
        });
    }

    send(message: { [key: string]: string }) {
        this.room.send("cmd", message);
    }

    handleMsg(type: string, data: any): void {
        if (type == "updateSnake") {
            this.updateSnake(data);
        } else if (type == "addSnake") {
            this.addSnake(data)
        } else if (type == "initGlobalConfig") {
            this.initGlobalConfig(data);
        } else if (type == "removeSnake") {
            this.removeSnake(data);
        } else if (type == "addBean") {
            this.addBean(data);
        } else if (type == "removeBean") {
            this.removeBean(data);
        }

    }

    addSnake(data: ISnakeData): void {
        let id = data.id;
        let snake = new Snake(id, 1, data.pos.x, data.pos.y);
        this.snakeMap[id] = snake;
        if (this.room.sessionId == id) {
            this.snakeSelf = snake;
            snake.bot = false;
        }
        this.snakeArr.push(snake);
        this.battleMap.addChild(snake);
        // console.log("addSnake:", data,this.snakeMap);
    }

    removeBean(data: IEatBean): void {
        let snake = data.snakeId;
        let bean = data.beanId;

        this.beanMap[bean].hide(this.snakeMap[snake]);
        // todo 对象池管理
    }

    updateSnake(data: IStatus[]): void {
        data.forEach(element => {
            let id = element.id;
            let snake = this.snakeMap[id];
            if (snake && snake.alive) {
                let rotation = element.rotation;
                let currentSpeed = element.currentSpeed;
                snake.curRotation = rotation;
                snake.currentSpeed = currentSpeed;
                let offsetx = element.pos.x - snake.x;
                let offsety = element.pos.y - snake.y;
                snake.offset.x = offsetx; // 与服务器的偏差值
                snake.offset.y = offsety;
                // snake.move();
                // if (!snake.bot) {
                //     console.log(snake.offset.x,offsetx);
                // }
            }
        });
    }

    removeSnake(data: IBase): void {
        this.snakeMap[data.id].destroy();
    }

    initGlobalConfig(data: IGlobalData): void {
        console.log(data);
        let snakes = data.snakes;
        let beans = data.beans;
        snakes.forEach(element => {
            if (element.alive) {
                let id = element.id;
                let pos = element.pos;
                let rotation = element.rotation;
                console.log(rotation);
                let snake = new Snake(id, 1, pos.x, pos.y, rotation);
                this.snakeMap[id] = snake;
                if (this.room.sessionId == id) {
                    this.snakeSelf = snake;
                }
                this.snakeArr.push(snake);
                this.battleMap.addChild(snake);

            }
        });
        beans.forEach(bean => {
            if (bean.alive) {
                this.addBean(bean);
            }
        });
    }

    init(): void {
        this.battleView = fgui.UIPackage.createObject("Slither", "Main") as fairygui.GComponent;
        this.battleView.makeFullScreen();
        fgui.GRoot.inst.addChild(this.battleView);
        this.addEvent();
        this.initSocket();
        this.startGame();
    }

    onSpeedUp: boolean = false;
    addEvent() {
        Laya.stage.on(Joystick.JoystickMoving, this, this.onTouchMove);
        this.btnSpeed = this.battleView.getChild("btn_speed").asButton;
        this.btnSpeed.on(Laya.Event.MOUSE_DOWN, this, this.changeSpeed);
        this.btnSpeed.on(Laya.Event.MOUSE_UP, this, this.changeSpeed);
    }

    changeSpeed() {
        this.onSpeedUp = !this.onSpeedUp;
        let onSpeedUp = this.onSpeedUp;
        this.room.send("updateSpeed", { id: this.room.sessionId, onSpeedUp });
    }

    onTouchMove(evt: { [key: string]: any }): void {
        let rotation = Math.floor(evt.degree);
        // console.log(rotation);
        this.room.send("updateRotation", { id: this.room.sessionId, rotation });
    }


    startGame(): void {
        this.createMap();
        Laya.timer.frameLoop(1, this, this.gameLoop)
    }

    createMap(): void {
        this.battleMap = this.battleView.getChild("map").displayObject;
        this.battleMap.width = Config.mapWidth;
        this.battleMap.height = Config.mapHeight;
    }

    addBean(data: IBeanData): void {
        // todo 使用对象池管理
        let id = data.id;
        let pos = data.pos;
        let skin = data.skin;
        let bean = new Bean(id, skin, pos.x, pos.y);
        this.beanMap[id] = bean;
        this.battleMap.addChild(bean);
    }

    //游戏主循环
    gameLoop(): void {
        this.snakeMove()
        this.mapMove();
    }

    snakeMove(): void {
        for (let index = 0; index < this.snakeArr.length; index++) {
            let snake = this.snakeArr[index];
            snake.move();
        }
    }


    //做地图相对移动，以便能让玩家的蛇始终居中
    mapMove(): void {
        if (!this.snakeSelf) { return };
        let mapScale = Config.defaultScaleRatio / this.snakeSelf.scaleRatio < 0.7 ? 0.7 : Config.defaultScaleRatio / this.snakeSelf.scaleRatio
        let x = -1 * (this.snakeSelf.x + this.snakeSelf.width / 2) * mapScale + GameConfig.width / 2,
            y = -1 * (this.snakeSelf.y + this.snakeSelf.height / 2) * mapScale + GameConfig.height / 2;
        this.battleMap.x = x;
        this.battleMap.y = y;

        this.battleMap.scale(mapScale, mapScale)

    }

    // todo 使用对象池创建
    createSnake() {
        // return new Snake();
    }


}

