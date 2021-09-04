import { Circle, Vector } from "sat"
import Config from "./Config"

/**
 * Snake extends laya.display.Sprite
 */
export default class Snake extends Circle {
    speedNow: string = "slow"
    snakeInitSize: number = 0.45
    snakeSize: number
    snakeLength: number = 24
    kill: number = 0;
    alive: boolean = true;
    head: Circle;
    speed: number
    skin: number = 1; // 皮肤
    curRotation: number
    bodySpace: number
    rotationTemp: number
    rotation: number
    bodyArr: Array<Circle> = []
    pathArr: Array<Object> = []
    eatBean: number = 0
    bodyBeanNum: number = 6//吃几颗豆增加一节身体
    bodyMaxNum: number = 500
    bot: boolean = false
    id: string = "";

    // constructor(skin: number = Math.floor(Math.random() * (5 - 1 + 1) + 1), pos:Vector) {
    constructor(id: string, skin: number, pos: Vector, r: number) {
        super(pos, r);
        this.id = id;
        this.rotation = 0;
        this.curRotation = this.rotation;
        this.speed = Config.speedConfig[this.speedNow];
        this.skin = skin;
        this.snakeSize = this.snakeInitSize;
        this.init();
    }



    init(): void {
        this.rotationTemp = this.rotation;
        this.snakeScale(this);
        this.alive = true;
        this.bodySpace = Math.floor(this.r / 10 * 8)
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

    move(): void {
        if (this.alive) {
            this.bodySpace = Math.floor(this.r / 10 * 8)
            this.headMove()
            this.bodyMove()
            this.speedChange()
            this.rotationChange()
            // this.bodyCheck()
            // console.log(this.pos);
        }
    }

    moveOut(): void {
        //碰到边界了
        this.destroy();
    }

    headMove(): void {
        let x = this.speed * Math.cos(this.rotation * Math.PI / 180)
        let y = this.speed * Math.sin(this.rotation * Math.PI / 180)
        this.rotation = this.rotationTemp

        let pos = { x: this.pos.x, y: this.pos.y }
        let posBefore = { x: this.pos.x, y: this.pos.y }
        if (!(this.pos.x + x >= Config.mapWidth - this.r / 2 || this.pos.x + x <= this.r / 2)) {
            this.pos.x += x
            pos.x = this.pos.x
        } else {
            this.moveOut()
        }
        if (!(this.pos.y + y >= Config.mapHeight - this.r / 2 || this.pos.y + y <= this.r / 2)) {
            this.pos.y += y
            pos.y = this.pos.y
        } else {
            this.moveOut()
        }

        for (let index = 1; index <= this.speed; index++) {
            this.pathArr.unshift({
                x: index * Math.cos(Math.atan2(pos.y - posBefore.y, pos.x - posBefore.x)) + posBefore.x
                , y: index * Math.sin(Math.atan2(pos.y - posBefore.y, pos.x - posBefore.x)) + posBefore.y
            })
        }

    }

    bodyMove(): void {
        for (let index = 0; index < this.bodyArr.length; index++) {
            let element = this.bodyArr[index];
            if (this.pathArr[(index + 1) * this.bodySpace]) {
                // element.rotation = Math.atan2(
                //     this.pathArr[(index + 1) * this.bodySpace]["y"] - element.y
                //     , this.pathArr[(index + 1) * this.bodySpace]["x"] - element.x
                // ) / Math.PI * 180
                let x = this.pathArr[(index + 1) * this.bodySpace]["x"],
                    y = this.pathArr[(index + 1) * this.bodySpace]["y"];
                element.pos = new Vector(x, y);
            }
            if (this.pathArr.length > this.bodyArr.length * (1 + this.bodySpace)) {
                this.pathArr.pop();
            }
        }
    }

    snakeScale(ele: Circle, eleType: string = "head"): void {
        ele.r = this.r * this.snakeSize;
        // ele.pos = new Vector(); // todo
        // let x = ele.x, y = ele.y;
        // ele.pivot(ele.width / 2, ele.height / 2)
        // ele.graphics.clear()
        // ele.loadImage("images/" + eleType + this.skin + ".png", 0, 0, this.r * this.snakeSize, this.r * this.snakeSize)
        // ele.pivot(ele.width / 2, ele.height / 2)
        // ele.pos(x, y)
        this.bodySpace = Math.floor(this.r / 10 * 8)
        Config.speedConfig["rotation"] = 4 / this.snakeSize
    }

    speedChange(): void {
        this.speed = this.speedNow == 'slow' ?
            (this.speed > Config.speedConfig[this.speedNow] ? this.speed - 1 : Config.speedConfig[this.speedNow])
            : (this.speed < Config.speedConfig[this.speedNow] ? this.speed + 1 : Config.speedConfig[this.speedNow])
    }

    rotationChange(): void {
        let perRotation = Math.abs(this.curRotation - this.rotationTemp) < Config.speedConfig['rotation'] ? Math.abs(this.curRotation - this.rotationTemp) : Config.speedConfig['rotation']
        if (this.curRotation < -0 && this.rotationTemp > 0 && Math.abs(this.curRotation) + this.rotationTemp > 180) {
            perRotation = (180 - this.rotationTemp) + (180 + this.curRotation) < Config.speedConfig['rotation'] ? (180 - this.rotationTemp) + (180 + this.curRotation) : Config.speedConfig['rotation']
            this.rotationTemp += perRotation
        } else {
            this.rotationTemp += this.curRotation > this.rotationTemp && Math.abs(this.curRotation - this.rotationTemp) <= 180 ? perRotation : -perRotation
        }
        this.rotationTemp = Math.abs(this.rotationTemp) > 180 ? (this.rotationTemp > 0 ? this.rotationTemp - 360 : this.rotationTemp + 360) : this.rotationTemp
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

        // game.gameMainUI.map.addChild(body)

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

        //     if (this.snakeSize < 1) {
        //         this.snakeSize = this.snakeInitSize + (1 - this.snakeInitSize) / this.bodyMaxNum * this.bodyArr.length
        //         this.bodyArr.forEach(element => {
        //             this.snakeScale(element, "body")
        //         })
        //         this.snakeScale(this)
        //     } else {
        //         this.snakeSize = 1
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
        // game.addBean(game.beanOrder, this.pos.x, this.pos.y);
        // this.visible = false;
        // this.bodyArr.forEach((body) => {
        //     game.addBean(game.beanOrder, body.x, body.y);
        //     body.visible = false
        // })
    }
}