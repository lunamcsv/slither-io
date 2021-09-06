import { Client } from "colyseus";
import { pointInCircle, Vector } from "sat"
import { StateHandlerRoom } from "../rooms/stateHandler";
import { ISnakeData } from "../types";
import Bean from "./Bean";
import Config from "./Config";
import { GAME_START } from "./constants";
import Snake from "./Snake";
import { BoundingBox, createQuadTree, QuadTree } from 'simplequad';
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
    public beanQuadTree: QuadTree;
    public init() {
        this.createBeanQuadTree();
        this.createBean();
        this.createSnake();
    }

    createBeanQuadTree() {
        let bounds: BoundingBox = {
            x: 0,
            y: 0,
            width: Config.mapWidth,
            height: Config.mapHeight,
        };
        this.beanQuadTree = createQuadTree(bounds, Config.beanSpawnMax);
    }


    public createBean() {
        for (let i = 0; i < Config.beanSpawnMax; i++) {
            let id = `${i}`;
            let skin = Math.floor(Math.random() * Config.beanSkinCnt + 1);
            let x = Math.floor(Math.random() * Config.mapWidth);
            let y = Math.floor(Math.random() * Config.mapHeight);
            let pos = new Vector(x, y);
            let bean = new Bean(id, pos, Config.beanRadius, skin);
            this.beanArr.push(bean);
            this.beansMap[id] = bean;
            let bounds: BoundingBox = {
                x,
                y,
                width: Config.beanRadius * 2,
                height: Config.beanRadius * 2,
            };
            let beanBounds = {
                ...bounds,
                id
            }
            this.beanQuadTree.add(beanBounds);
        }
    }

    public createSnake() {
        for (let i = 0; i < Config.snakeSpawnCnt; i++) {
            let id = `${i}`;
            let skinId = Math.floor(Math.random() * Config.beanSkinCnt + 1);
            let x = Math.floor(Math.random() * (Config.mapWidth - 400)) + 200,
                y = Math.floor(Math.random() * (Config.mapWidth - 400)) + 200,
                pos = new Vector(x, y);
            // let rotation = Math.floor(Math.random() * 360);
            let rotation = 0;
            let snake = new Snake(id, skinId, pos, Config.snakeBodyRadius / 2, rotation);
            snake.handler = this;
            snake.bot = true;
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
        // let rotation = Math.floor(Math.random() * 360);
        let rotation = 0;
        let snake = new Snake(id, skin, pos, Config.snakeBodyRadius / 2, rotation);
        snake.handler = this;
        this.snakeArr.push(snake);
        this.snakeMap[id] = snake;
        this.broadcast("addSnake", { id, pos });
    }

    public addSnake() {
        // todo 对象池管理
    }

    public initConfig(client: Client) {
        let snakes = this.snakeArr.map((snake: Snake) => {
            let { alive, id, pos, rotation } = snake;
            // if (alive) {
            return {
                id, pos, rotation, alive
            }
            // }
        });

        let beans = this.beanArr.map((bean: Bean) => {
            let { alive, id, skin, pos } = bean;
            // if (alive) {
            return {
                id, skin, pos, alive
            }
            // }
        });

        let data = { type: "initGlobalConfig", data: { snakes, beans } }
        client.send("cmd", data);
    }


    public startGame() {
        this.broadcast(GAME_START, {})
        // 开始刷新（每一帧刷新一次）
        this.room.setSimulationInterval(this.update.bind(this), 16);
        this.room.clock.setInterval(this.sendUpdates.bind(this), 100);
        // setInterval(sendUpdates, 1000 / c.networkUpdateFactor);
    }

    public update(): void {
        this.hitTestSnake();
        this.snakeMove();
        this.eatBean();
        this.sendUpdates();
    }

    public sendUpdates() {
        let data = this.snakeArr.map((snake) => {
            let { id, pos, rotation, currentSpeed } = snake;
            return {
                id, pos, rotation, currentSpeed
            }
        })
        this.broadcast("updateSnake", data);
    }


    public broadcast(type: string, data: any) {
        this.room.broadcastAll(type, data);
    }

    public snakeMove(): void {
        this.snakeArr.forEach((snake) => {
            snake.move();
        });
    }

    public removeSnake(snake: Snake) {
        snake.alive = false;
        let { id, pos } = snake;
        let { x, y } = pos;
        this.broadcast("removeSnake", { id });
        this.addBean(x, y);
        snake.bodyArr.forEach((body) => {
            let { pos } = body;
            let { x, y } = pos;
            this.addBean(x, y);
        });
        this.respawnSnake(snake);
    }

    public respawnSnake(snake: Snake): void {
        // snake.alive = true;
    }

    public addBean(x: number, y: number): void {// todo 对象池 随机生产
        let len = this.beanArr.length;
        let id = `${len}`;
        let skin = Math.floor(Math.random() * Config.beanSkinCnt + 1);
        let pos = new Vector(x, y);
        let bean = new Bean(id, pos, Config.beanRadius, skin);
        this.beanArr.push(bean);
        this.beansMap[id] = bean;
        let bounds: BoundingBox = {
            x,
            y,
            width: Config.beanRadius * 2,
            height: Config.beanRadius * 2,
        };
        let beanBounds = {
            ...bounds,
            id
        }
        this.beanQuadTree.add(beanBounds);
        this.broadcast("addBean", { id, pos, skin });
    }

    removeBean(bean: Bean, snake: Snake) {
        bean.destroy();
        this.broadcast("removeBean", { beanId: bean.id, snakeId: snake.id });
    }


    public eatBean(): void {
        // 四叉树
        for (let j = 0; j < this.snakeArr.length; j++) {
            let snake = this.snakeArr[j];
            if (snake.alive) {
                let { pos, width } = snake;
                let { x, y } = pos;
                let hitTestDistance = width + 50;
                let snakeBounds = {
                    x, y, width: hitTestDistance, height: hitTestDistance
                }
                this.beanQuadTree.query(snakeBounds).forEach((bean) => {
                    let b = this.beansMap[bean['id']];
                    snake.eatBean++;
                    this.removeBean(b, snake);
                    this.beanQuadTree.remove(bean);
                });

            }
        }
    }

    public hitTestSnake(): void {
        let len = this.snakeArr.length;
        for (let i = 0; i < len; i++) {
            let snake = this.snakeArr[i];
            let { pos, alive } = snake;
            if (alive) {
                let { x, y } = pos;
                let angle = snake.rotation * Math.PI / 180;
                let nextStepX = snake.speed * Math.cos(angle) + x;
                let nextStepY = snake.speed * Math.sin(angle) + y;
                for (let j = 0; j < len; j++) {
                    let target = this.snakeArr[j];
                    if (target.alive) {
                        if (i == j) {
                            continue;
                        }
                        let vector = new Vector(nextStepX, nextStepY);
                        let result = pointInCircle(vector, target);
                        if (result) {
                            this.removeSnake(snake);
                            continue;
                        }
                        for (let k = 0; k < target.bodyArr.length; k++) {
                            let body = target.bodyArr[k];
                            result = pointInCircle(vector, body);
                            if (result) {
                                this.removeSnake(snake);
                                continue;
                            }
                        }
                    }
                }

            }

        }
    }

    public destroy() {
        this.room.clock.clear();
    }
}