import { Client } from "colyseus";
import { Circle, Vector } from "sat"
import { StateHandlerRoom } from "../rooms/stateHandler";
import { ISnakeData } from "../types";
import Bean from "./Bean";
import Config from "./Config";
import { GAME_START } from "./constants";
import Snake from "./Snake";
export default class LogicManager {
    public room: StateHandlerRoom;

    constructor(room: StateHandlerRoom) {
        this.room = room;
    }

    private beanArr: Bean[] = [];
    private beansMap: { [id: string]: Bean } = {};
    private beanOrder: number = 0;
    public snakeArr: Snake[] = [];
    public snakeMap: { [key: string]: Snake } = {};
    public init() {
        this.createBean();
        this.createSnake();
    }

    public addBean(x:number,y:number): void {// todo 对象池 随机生产
        let id = `${this.beanOrder}`;
        let skinId = Math.floor(Math.random() * Config.beanSkinLength + 1);
        let pos = new Vector(Math.random() * Config.mapWidth, Math.random() * Config.mapHeight);
        let bean = new Bean(id, pos, Config.beanRadius, skinId);
        this.beanArr[this.beanOrder] = bean;
        this.beansMap[id] = bean;
        this.beanOrder++;
    }

    public createBean() {
        for (let i = 0; i < Config.beanSpawnMax; i++) {
            let id = `${i}`;
            let skin = Math.floor(Math.random() * Config.beanSkinLength + 1);
            let pos = new Vector(Math.random() * Config.mapWidth, Math.random() * Config.mapHeight);
            let bean = new Bean(id, pos, Config.beanRadius, skin);
            this.beanArr[i] = bean;
            this.beansMap[id] = bean;
        }
    }

    public createSnake() {
        for (let i = 0; i < Config.snakeSpawnCnt; i++) {
            let id = `${i}`;
            let skinId = Math.floor(Math.random() * Config.beanSkinLength + 1);
            let pos = new Vector(Math.random() * Config.mapWidth, Math.random() * Config.mapHeight);
            let snake = new Snake(id, skinId, pos, Config.initWidth);
            snake.bot = true
            this.snakeArr.push(snake);
            this.snakeMap[id] = snake;
        }
    }

    public createRoleSnake(data: ISnakeData) { // 根据用户信息设置相关
        let { id } = data;
        let x = Math.floor(Math.random() * (Config.mapWidth - 400)) + 200,
            y = Math.floor(Math.random() * (Config.mapWidth - 400)) + 200,
            skin = Math.floor(Math.random() * Config.snakeSkinLength + 1),
            pos = new Vector(x, y);
        let snake = new Snake(id, skin, pos, Config.initWidth);
        this.snakeArr.push(snake);
        this.snakeMap[id] = snake;
        this.broadcast("addSnake", { id, pos });
    }

    public addSnake() {
        // todo 对象池管理
    }

    public initConfig(client: Client) {
        let snakes = this.snakeArr.map((snake: Snake) => {
            let { alive, id, pos, curRotation } = snake;
            if (alive) {
                return {
                    id, pos, rotation: curRotation
                }
            }
        });

        let beans = this.beanArr.map((bean: Bean) => {
            let { alive, id, skin, pos } = bean;
            if (alive) {
                return {
                    id, skin, pos
                }
            }
        });

        let data = { type: "initGlobalConfig", data: { snakes, beans } }
        client.send("cmd", data);
    }


    public startGame() {
        this.broadcast(GAME_START, {})
        // 开始刷新（每一帧刷新一次）
        this.room.setSimulationInterval(this.update.bind(this), 16);
        this.room.clock.setInterval(this.sendUpdates.bind(this), 25);
        // setInterval(sendUpdates, 1000 / c.networkUpdateFactor);
    }

    public sendUpdates() {
        let data = this.snakeArr.map((snake) => {
            let { id, pos, curRotation } = snake;
            return {
                id, pos, rotation: curRotation
            }
        })
        this.broadcast("updateSnake", data);
    }


    public broadcast(type: string, data: any) {
        // console.log(type, data);
        this.room.broadcastAll(type, data);
    }

    public update(): void {
        this.snakeMove();
        this.checkMap();
        // this.eateBean()
    }

    public snakeMove(): void {
        this.snakeArr.map((snake) => {
            if (snake.alive) {
                snake.move();
            }
        });
        // for (let index = 0; index < this.snakeArr.length; index++) {
        //     let snake = this.snakeArr[index]
        //     snake.move();
        //     let hitDis: number = 90 / snake.speedObj["rotation"] * snake.speed + snake.r / 2; // 预测碰撞点
        //     let hitPos: Object = { x: 0, y: 0 }
        //     hitPos["x"] = hitDis * Math.cos(snake.rotation * Math.PI / 180) + snake.pos.x
        //     hitPos["y"] = hitDis * Math.sin(snake.rotation * Math.PI / 180) + snake.pos.y
        // let hiten: Boolean = false
        //判断是否快碰撞到边界
        // if (hitPos["x"] >= Config.mapWidth - snake.r / 2 || hitPos["x"] <= snake.r / 2
        //     || hitPos["y"] >= Config.mapHeight - snake.r / 2 || hitPos["y"] <= snake.r / 2) {
        //     snake.reverseRotation()
        // }

        //判断是否撞倒玩家蛇
        // if (distance(hitPos["x"], hitPos["y"], this.snakeSelf.x, this.snakeSelf.y) <= this.snakeSelf.width) {
        //     snake.reverseRotation()
        //     hiten = true
        // }
        // for (let index = 0; index < this.snakeSelf.bodyArr.length; index++) {
        //     if (hiten) break
        //     let element = this.snakeSelf.bodyArr[index];
        //     if (distance(hitPos["x"], hitPos["y"], element.x, element.y) <= element.width) {
        //         snake.reverseRotation()
        //         hiten = true
        //     }
        // }

        //判断AI之间是否自己碰撞
        // for (let i = 0; i < this.snakeArr.length; i++) {
        //     if (hiten) break
        //     let elementsnake: Snake = this.snakeArr[i];
        //     if (index == i) continue
        //     if (distance(hitPos["x"], hitPos["y"], elementsnake.x, elementsnake.y) <= elementsnake.width) {
        //         snake.reverseRotation()
        //         hiten = true
        //     }
        //     for (let index = 0; index < elementsnake.bodyArr.length; index++) {
        //         if (hiten) break
        //         let element = elementsnake.bodyArr[index];
        //         if (distance(hitPos["x"], hitPos["y"], element.x, element.y) <= element.width) {
        //             snake.reverseRotation()
        //             hiten = true
        //         }
        //     }
        // }
        // }
    }

    public checkMap(): void {
        for (let i = 0; i < this.snakeArr.length; i++) {
            let snake = this.snakeArr[i];
            let { id, pos, alive, bot, r } = snake;
            if (alive) {
                let { x, y } = pos;
                // if (!bot) console.log(pos)
                if (x - r <= 0 || x + r >= Config.mapWidth) {
                    snake.alive = false;
                    this.broadcast("removeSnake", { id });
                    continue;
                }
                if (y - r <= 0 || y + r >= Config.mapHeight) {
                    snake.alive = false;
                    this.broadcast("removeSnake", { id });
                    continue;
                }
            }
        }
    }



    public eatBean(): void {
        // 四叉树 todo
        for (let i = 0; i < this.beanArr.length; i++) {
            let bean = this.beanArr[i];
            for (let j = 0; j < this.snakeArr.length; j++) {
                let snake = this.snakeArr[j];
                SAT.testCircleCircle(bean, snake);
            }
        }


    }
}