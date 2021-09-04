import Config from "../Config";
import GameManager from "../manager/GameManager";
export default class Snake extends Laya.Sprite {
    currentSpeed: string = "slow";
    snakeInitSize: number = 1
    snakeSize: number;
    snakeLength: number = 24
    kill: number = 0;
    alive: boolean = true;
    speed: number;
    skinId: number;
    curRotation: number; // 当前摇杆的旋转角度
    nextRotation: number; // 下一个转角角度
    bodySpace: number;
    bodyArr: Array<Laya.Sprite> = [];
    pathArr: Array<Object> = [];
    eatBean: number = 0;
    bodyBeanNum: number = 6;//吃几颗豆增加一节身体
    bodyMaxNum: number = 500; // 身体长度上限 500/6 = 30;
    headWidth: number = 116;
    id: string = "";
    bot: boolean = false;
    head: Laya.Sprite;

    constructor(id: string, skinId: number, x: number, y: number, angle: number = 0) {
        super()
        this.id = id;
        this.rotation = angle;
        this.curRotation = this.rotation;
        this.nextRotation = this.rotation;
        this.alive = true;
        this.speed = Config.speedConfig[this.currentSpeed];
        this.skinId = skinId + 100;
        this.visible = false;
        this.snakeSize = this.snakeInitSize;


        this.width = Config.snakeBodyRadius;
        this.height = Config.snakeBodyRadius;
        this.zOrder = 11000
        this.pivot(this.width / 2, this.height / 2);
        this.pos(x, y)

        this.head = new Laya.Sprite();
        this.head.loadImage(`assets/${this.skinId}_head.png`, Laya.Handler.create(this, this.loaded, [x, y]))
        // this.head = this.loadImage(`assets/${this.skinId}_head.png`, Laya.Handler.create(this, this.loaded, [x, y]))
    }

    loaded(): void {
        this.addChild(this.head);
        this.head.pos(this.head.width / 2, this.height / 2);
        this.snakeScale(this.head, "head");
        this.visible = true

        this.bodySpace = Math.floor(this.width / 10 * 8)
        for (let index = 1; index <= this.getBodyNum(); index++) {
            this.addBody(this.x - index * this.bodySpace, this.y, this.rotation)
        }
        for (let index = 0; index < this.bodySpace * this.getBodyNum(); index++) {
            this.pathArr.push({
                x: this.x - index
                , y: this.y
            })
        }
    }

    move(): void {
        if (this.alive) {
            this.bodySpace = Math.floor(this.width / 10 * 8)
            this.headMove()
            this.bodyMove()
            this.speedChange()
            this.rotationChange()
            this.bodyCheck()
        }
    }


    headMove(): void {
        let angle = this.rotation * Math.PI / 180;
        let x = this.speed * Math.cos(angle);
        let y = this.speed * Math.sin(angle);

        this.rotation = this.nextRotation;

        let pos = { x: this.x, y: this.y }
        let posBefore = { x: this.x, y: this.y }
        if (!(this.x + x >= Config.mapWidth - this.width / 2 || this.x + x <= this.width / 2)) {
            this.x += x
            pos.x = this.x
        } else {
            // this.destroy()
            return;
        }
        if (!(this.y + y >= Config.mapHeight - this.width / 2 || this.y + y <= this.width / 2)) {
            this.y += y
            pos.y = this.y
        } else {
            // this.destroy()
            return;
        }

        for (let index = 1; index <= this.speed; index++) {
            angle = Math.atan2(pos.y - posBefore.y, pos.x - posBefore.x);
            this.pathArr.unshift({
                x: index * Math.cos(angle) + posBefore.x
                , y: index * Math.sin(angle) + posBefore.y
            })
        }
    }

    bodyMove(): void {
        for (let index = 0; index < this.bodyArr.length; index++) {
            let element = this.bodyArr[index];
            let path = this.pathArr[(index + 1) * this.bodySpace];
            if (path) {
                // element.rotation = Math.atan2(path["y"] - element.y, path["x"] - element.x) / Math.PI * 180; // 身体跟着旋转
                element.pos(path["x"], path["y"]);
            }
            if (this.pathArr.length > this.bodyArr.length * (1 + this.bodySpace)) {
                this.pathArr.pop();
            }
        }
    }

    snakeScale(ele: Laya.Sprite, eleType: string = "body"): void {
        // todo
        let x = ele.x, y = ele.y;
        ele.pivot(ele.width / 2, ele.height / 2)
        ele.graphics.clear()
        // ele.loadImage("images/" + eleType + this.skinId + ".png", 0, 0, Config.snakeBodyRadius * this.snakeSize, Config.snakeBodyRadius * this.snakeSize)
        ele.pivot(ele.width / 2, ele.height / 2)
        if (eleType == "body") {
            ele.width = Config.snakeBodyRadius * this.snakeSize;
            ele.height = Config.snakeBodyRadius * this.snakeSize;
        } else {
            ele.width = ele.width * this.snakeSize;
            ele.height = ele.height * this.snakeSize;
        }
        ele.pos(x, y)
        Config.speedConfig["rotation"] = 4 / this.snakeSize;
    }

    speedChange(): void {
        let currentSpeed = Config.speedConfig[this.currentSpeed];
        this.speed = this.currentSpeed == 'slow' ? (this.speed > currentSpeed ? this.speed - 1 : currentSpeed) : (this.speed < currentSpeed ? this.speed + 1 : currentSpeed);
    }

    rotationChange(): void {
        let rotationSpan = Math.abs(this.curRotation - this.nextRotation); // 转角差值
        let rotation = Config.speedConfig['rotation'];
        let perRotation = rotationSpan < rotation ? rotationSpan : rotation;
        if (this.curRotation < 0 && this.nextRotation > 0 && Math.abs(this.curRotation) + this.nextRotation > 180) {
            perRotation = (180 - this.nextRotation) + (180 + this.curRotation) < rotation ? (180 - this.nextRotation) + (180 + this.curRotation) : rotation;
            this.nextRotation += perRotation;
        } else {
            this.nextRotation += this.curRotation > this.nextRotation && rotationSpan <= 180 ? perRotation : -perRotation;
        }
        this.nextRotation = Math.abs(this.nextRotation) > 180 ? (this.nextRotation > 0 ? this.nextRotation - 360 : this.nextRotation + 360) : this.nextRotation;
        
    }

    addBody(x: number, y: number, r: number): void {
        let body: Laya.Sprite = new Laya.Sprite();
        let zOrder = this.zOrder - this.bodyArr.length - 1;
        body.visible = false;
        body.alpha = 0;
        body.zOrder = zOrder;
        body.loadImage(`assets/${this.skinId}_body_${zOrder % 2 + 1}.png`, Laya.Handler.create(this, () => {
            this.snakeScale(body, "body")
            body.pos(x, y)
            body.rotation = r

            GameManager.inst.battleMap.addChild(body)

            body.visible = true
            body.alpha = 1
        }))

        this.bodyArr.push(body)
    }

    bodyCheck() {
        if (this.eatBean >= this.bodyBeanNum && this.bodyArr.length < this.bodyMaxNum) {
            let addBodyNum = Math.floor(this.eatBean / this.bodyBeanNum)
            let x = this.bodyArr[this.bodyArr.length - 1].x
            let y = this.bodyArr[this.bodyArr.length - 1].y
            let r = this.bodyArr[this.bodyArr.length - 1].rotation
            for (let index = 0; index < addBodyNum; index++) {
                this.addBody(this.bodySpace * Math.cos(r * Math.PI / 180), this.bodySpace * Math.sin(r * Math.PI / 180), r)
            }
            for (let index = 0; index < this.bodySpace * addBodyNum; index++) {
                this.pathArr.push({ x: this.x - index * Math.cos(r * Math.PI / 180), y: this.y - index * Math.sin(r * Math.PI / 180) })
            }
            this.eatBean = this.eatBean % this.bodyBeanNum

            if (this.snakeSize < 1) { // 折算能量转换长度
                this.snakeSize = this.snakeInitSize + (1 - this.snakeInitSize) / this.bodyMaxNum * this.bodyArr.length;
                this.bodyArr.forEach(element => {
                    this.snakeScale(element, "body")
                })
                this.snakeScale(this)
            } else {
                this.snakeSize = 1
            }
        }

    }

    getBodyNum(): number {
        return Math.floor(this.snakeLength / this.bodyBeanNum)
    }

    destroy() {
        this.alive = false;
        this.visible = false;
        this.bodyArr.forEach((body) => {
            body.visible = false
        })
    }
}