import { Circle, Vector } from "sat"
import Config from "./Config"
import LogicManager from "./LogicManager";

/**
 * Snake extends laya.display.Sprite
 */
export default class Snake extends Circle {
    speedNow: string = "slow"
    snakeInitSize: number = 1
    scaleRatio: number; // 缩放倍率
    snakeLength: number = 24
    kill: number = 0;
    alive: boolean = true;
    head: Circle;
    speed: number
    skin: number = 1; // 皮肤
    curRotation: number
    bodySpace: number; // 身体之间的间隔
    nextRotation: number
    rotation: number
    bodyArr: Array<Circle> = []
    pathArr: Array<Object> = []
    eatBean: number = 0
    bodyBeanNum: number = 6//吃几颗豆增加一节身体
    bodyMaxNum: number = 500
    bot: boolean = false
    id: string = "";
    handler: LogicManager;

    // constructor(skin: number = Math.floor(Math.random() * (5 - 1 + 1) + 1), pos:Vector) {
    constructor(id: string, skin: number, pos: Vector, r: number, angle: number = 0) {
        super(pos, r);
        this.id = id;
        this.rotation = angle;
        this.curRotation = this.rotation;
        this.speed = Config.speedConfig[this.speedNow];
        this.skin = skin;
        this.scaleRatio = this.snakeInitSize;
        this.init();
    }

    init(): void {
        this.nextRotation = this.rotation;
        this.snakeScale(this);
        this.alive = true;
        this.bodySpace = Math.floor(this.width / 10 * 8); // 间隔0.4倍
        for (let index = 1; index <= this.getBodyNum(); index++) {
            this.addBody(this.pos.x - index * this.bodySpace, this.pos.y, this.rotation)
        }
        for (let index = 0; index < this.bodySpace * this.getBodyNum(); index++) {
            this.pathArr.push({
                x: this.pos.x - index
                , y: this.pos.y
            })
        }
    }

    get width(): number {
        return this.r * 2;
    }

    move(): void {
        if (this.alive) {
            // this.bodySpace = Math.floor(this.width / 10 * 8)
            this.headMove()
            this.bodyMove()
            this.speedChange()
            this.rotationChange()
            // this.bodyCheck()
            // console.log(this.pos);
        }
    }

    headMove(): void {
        let angle = this.rotation * Math.PI / 180;
        let x = this.speed * Math.cos(angle);
        let y = this.speed * Math.sin(angle);
        let nextPosX = this.pos.x + x;
        let nextPosY = this.pos.y + y;
        if (!(nextPosX >= Config.mapWidth - this.r - 26|| nextPosX <= this.r + 26)) {
            this.pos.x = nextPosX;
        } else {
            if (!this.bot && this.alive) {
                console.log("moveOut:", Date.now())
            }
            this.destroy();
            return;
        }
        if (!(nextPosY >= Config.mapHeight - this.r || nextPosY <= this.r)) {
            this.pos.y = nextPosY;
        } else {
            if (!this.bot && this.alive) {
                console.log("moveOut:", Date.now())
            }
            this.destroy();
            return;
        }

        let posBefore = { x: this.pos.x, y: this.pos.y };
        let nextAngle = Math.atan2(nextPosY - posBefore.y, nextPosX - posBefore.x);
        
        for (let index = 1; index <= this.speed; index++) {
            this.pathArr.unshift({ x: index * Math.cos(nextAngle) + posBefore.x, y: index * Math.sin(nextAngle) + posBefore.y })
        }
        this.rotation = this.nextRotation;

    }

    bodyMove(): void {
        let len = this.bodyArr.length;
        for (let index = 0; index < len; index++) {
            let element = this.bodyArr[index];
            let path = this.pathArr[(index + 1) * this.bodySpace];
            if (path) {
                let x = path["x"], y = path["y"];
                element.pos = new Vector(x, y);
            }
            if (this.pathArr.length > len * (1 + this.bodySpace)) {
                this.pathArr.pop();
            }
        }
    }

    snakeScale(ele: Circle, eleType: string = "head"): void {
        ele.r = this.r * this.scaleRatio;
        // ele.pos = new Vector(); // todo
        // let x = ele.x, y = ele.y;
        // ele.pivot(ele.width / 2, ele.height / 2)
        // ele.graphics.clear()
        // ele.loadImage("images/" + eleType + this.skin + ".png", 0, 0, this.r * this.scaleRatio, this.r * this.scaleRatio)
        // ele.pivot(ele.width / 2, ele.height / 2)
        // ele.pos(x, y)
        this.bodySpace = Math.floor(this.width / 10 * 8)
        Config.speedConfig["rotation"] = 4 / this.scaleRatio
    }

    speedChange(): void {
        this.speed = this.speedNow == 'slow' ?
            (this.speed > Config.speedConfig[this.speedNow] ? this.speed - 1 : Config.speedConfig[this.speedNow])
            : (this.speed < Config.speedConfig[this.speedNow] ? this.speed + 1 : Config.speedConfig[this.speedNow])
    }

    rotationChange(): void {
        let perRotation = Math.abs(this.curRotation - this.nextRotation) < Config.speedConfig['rotation'] ? Math.abs(this.curRotation - this.nextRotation) : Config.speedConfig['rotation']
        if (this.curRotation < -0 && this.nextRotation > 0 && Math.abs(this.curRotation) + this.nextRotation > 180) {
            perRotation = (180 - this.nextRotation) + (180 + this.curRotation) < Config.speedConfig['rotation'] ? (180 - this.nextRotation) + (180 + this.curRotation) : Config.speedConfig['rotation']
            this.nextRotation += perRotation
        } else {
            this.nextRotation += this.curRotation > this.nextRotation && Math.abs(this.curRotation - this.nextRotation) <= 180 ? perRotation : -perRotation
        }
        this.nextRotation = Math.abs(this.nextRotation) > 180 ? (this.nextRotation > 0 ? this.nextRotation - 360 : this.nextRotation + 360) : this.nextRotation
    }

    addBody(x: number, y: number, r: number): void {
        // let body: Sprite = new Sprite()
        // let zOrder = this.zOrder - this.bodyArr.length - 1
        // body.visible = false
        // body.alpha = 0
        // body.zOrder = zOrder
        // body.loadImage("images/body" + this.skin + ".png", 0, 0, 0, 0, new Handler(this, () => {

        // body.pos(x, y)
        // body.rotation = r

        // body.visible = true
        // body.alpha = 1
        // }))
        let body = new Circle(new Vector(x, y), this.r);
        this.snakeScale(body, "body")
        this.bodyArr.push(body)
    }

    bodyCheck() {
        // if (this.eatBean >= this.bodyBeanNum && this.bodyArr.length < this.bodyMaxNum) {
        //     let addBodyNum = Math.floor(this.eatBean / this.bodyBeanNum)
        //     let x = this.bodyArr[this.bodyArr.length - 1].pos.x;
        //     let y = this.bodyArr[this.bodyArr.length - 1].pos.y;
        //     let r = this.bodyArr[this.bodyArr.length - 1].rotation
        //     for (let index = 0; index < addBodyNum; index++) {
        //         this.addBody(this.bodySpace * Math.cos(r * Math.PI / 180), this.bodySpace * Math.sin(r * Math.PI / 180), r)
        //     }
        //     for (let index = 0; index < this.bodySpace * addBodyNum; index++) {
        //         this.pathArr.push({
        //             x: this.pos.x - index * Math.cos(r * Math.PI / 180)
        //             , y: this.pos.y - index * Math.sin(r * Math.PI / 180)
        //         })
        //     }
        //     this.eatBean = this.eatBean % this.bodyBeanNum

        //     if (this.scaleRatio < 1) {
        //         this.scaleRatio = this.snakeInitSize + (1 - this.snakeInitSize) / this.bodyMaxNum * this.bodyArr.length
        //         this.bodyArr.forEach(element => {
        //             this.snakeScale(element, "body")
        //         })
        //         this.snakeScale(this)
        //     } else {
        //         this.scaleRatio = 1
        //     }
        // }

    }

    getBodyNum(): number {
        return Math.floor(this.snakeLength / this.bodyBeanNum)
    }

    reverseRotation(): void {
        this.curRotation = this.rotation > 0 ? this.rotation - 180 : this.rotation + 180
    }

    destroy() {
        this.alive = false;
        this.handler.removeSnake(this);
        // game.addBean(game.beanOrder, this.pos.x, this.pos.y);
        // this.visible = false;
        // this.bodyArr.forEach((body) => {
        //     game.addBean(game.beanOrder, body.x, body.y);
        //     body.visible = false
        // })
    }
}