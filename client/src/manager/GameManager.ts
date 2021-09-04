import Bean from "../script/Bean"
import Snake from "../script/Snake"
import Config from "../Config";
import GameConfig from "../GameConfig";
import Joystick from "../fgui/extension/Joystick";
import { IBase, IGlobalData, IRotation, ISnakeData } from "../types/index";
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
    beanRandomTimer: any
    SnakeAINum: number = 5
    snakeArr: Array<Snake> = []
    snakeMap: { [key: string]: Snake } = {};
    beanMap: { [key: string]: Bean } = {};

    battleView: fgui.GComponent;
    battleMap: Laya.Sprite;

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

    handleMsg(type: string, data: any):void{
        if (type == "updateSnake") {
            this.updateSnake(data);
        } else if (type == "addSnake") {
            this.addSnake(data)
        } else if (type == "initGlobalConfig") {
            this.initGlobalConfig(data);
        } else if (type == "removeSnake") {
            this.removeSnake(data);
        }

    }

    addSnake(data: ISnakeData): void {
        let id = data.id;
        let snake = new Snake(id, 1, data.pos.x, data.pos.y);
        this.snakeMap[id] = snake;
        if (this.room.sessionId == id) {
            this.snakeSelf = snake;
        }
        this.snakeArr.push(snake);
        this.battleMap.addChild(snake);
        // console.log("addSnake:", data,this.snakeMap);
    }

    updateSnake(data: IRotation[]): void {
        data.forEach(element => {
            let id = element.id;
            let rotation = element.rotation;
            let snake = this.snakeMap[id];
            if (!snake) return;
            snake.curRotation = rotation;
        });
    }

    removeSnake(data: IBase): void {
        this.snakeMap[data.id].destroy();
    }

    initGlobalConfig(data: IGlobalData):void{
        console.log(data);
        let snakes = data.snakes;
        let beans = data.beans;
        snakes.forEach(element => {
            let id = element.id;
            let pos = element.pos;
            let snake = new Snake(id, 1, pos.x, pos.y);
            this.snakeMap[id] = snake;
            if (this.room.sessionId == id) {
                this.snakeSelf = snake;
            }
            this.snakeArr.push(snake);
            this.battleMap.addChild(snake);
        });
        beans.forEach(bean => {
            let id = bean.id;
            let pos = bean.pos;
            let skin = bean.skin;
            let snake = new Bean(id, skin, pos.x, pos.y);
            this.beanMap[id] = snake;
            this.battleMap.addChild(snake);
        });
    }

    init(): void {
        this.addEvent();
        this.battleView = fgui.UIPackage.createObject("Slither", "Main") as fairygui.GComponent;
        this.battleView.makeFullScreen();
        fgui.GRoot.inst.addChild(this.battleView);
        this.initSocket();
        this.startGame();
    }


    addEvent() {
        Laya.stage.on(Joystick.JoystickMoving, this, this.onTouchMove);
    }

    onTouchMove(evt: { [key: string]: any }): void {
        // console.log(evt.degree);
        let rotation = evt.degree;
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

    addBean(beanOrder: number, x?: number, y?: number, colorNum?: number): void {
        // let bean = new Bean(x, y, colorNum)
        // bean.orderNum = beanOrder;
        // this.beans[beanOrder] = bean;
        // this.battleMap.addChild(bean);
        // this.beanNum++;
    }

    //游戏主循环
    gameLoop(): void {
        this.snakeMove()
        this.mapMove();
    }

    snakeMove(): void {
        for (let index = 0; index < this.snakeArr.length; index++) {
            let snakeAI = this.snakeArr[index]
            snakeAI.move()
        }
    }


    //做地图相对移动，以便能让玩家的蛇始终居中
    mapMove(): void {
        if (!this.snakeSelf) { return };
        let mapScale = this.snakeSelf.snakeInitSize / this.snakeSelf.snakeSize < 0.7 ? 0.7 : this.snakeSelf.snakeInitSize / this.snakeSelf.snakeSize
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
