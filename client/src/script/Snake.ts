import { IPath } from "../../types/index";
import Config from "../Config";
import GameManager from "../manager/GameManager";
export default class Snake extends Laya.Sprite {
    currentSpeed: string = "slow";
    scaleRatio: number; // 缩放倍率
    snakeLength: number = 18;
    kill: number = 0;
    alive: boolean = true;
    speedX: number;
    speedY: number;
    skinId: number;
    curRotation: number; // 当前摇杆的旋转角度
    nextRotation: number; // 下一个转角角度
    bodySpace: number;
    bodyArr: Array<Laya.Sprite> = [];
    pathArr: Array<IPath> = [];
    eatBean: number = 0;
    bodyBeanNum: number = 6;//吃几颗豆增加一节身体
    bodyMaxNum: number = 30; // 身体长度上限
    id: string = "";
    bot: boolean = true;
    head: Laya.Sprite;
    defend: Laya.Sprite;
    offset: Laya.Point = new Laya.Point();
    originWidth: number;
    originHeight: number;

    constructor(id: string, skinId: number, x: number, y: number, angle: number = 0) {
        super()
        this.id = id;
        this.rotation = angle;
        this.curRotation = this.rotation;
        this.nextRotation = this.rotation;
        this.alive = true;
        this.speedX = Config.speedConfig[this.currentSpeed];
        this.speedY = Config.speedConfig[this.currentSpeed];
        this.skinId = skinId + 100;
        this.scaleRatio = Config.defaultScaleRatio;
        this.zOrder = 11000
        this.pos(x, y)
        // this.loadImage(`assets/${this.skinId}_head.png`, Laya.Handler.create(this, this.loaded))
        this.loaded();
        this.addHead();
        this.addDefend();
    }

    loaded(): void {
        this.width = Config.snakeBodyRadius;
        this.height = Config.snakeBodyRadius;
        this.snakeScale(this, "head");
        this.bodySpace = Math.floor(this.scaleRatio * Config.snakeBodyRadius / 10 * 8)
        for (let index = 1; index <= this.getBodyNum(); index++) {
            this.addBody(this.x - index * this.bodySpace, this.y, this.rotation)
        }
        // for (let index = 0; index < this.bodySpace * this.getBodyNum(); index++) {
        // this.pathArr.push({
        //     x: this.x, y: this.y
        // })
        // }
    }

    addHead() {
        this.head = new Laya.Sprite();
        this.head.loadImage(`assets/101_body_1.png`);
        // this.head.loadImage(`assets/${this.skinId}_head.png`);
        
        this.head.x = this.width / 2;
        this.head.y = this.height / 2;
        this.head.pivot(this.head.width / 2, this.head.height / 2);
        this.addChild(this.head);
        let txt: Laya.Text = new Laya.Text();
        txt.text = "数据正在加载中";
        txt.color = "#6C6C6C";
        txt.fontSize = 20 * Laya.Browser.pixelRatio;
        txt.pos(-txt.width / 2.5, -70);
        this.addChild(txt);
    }


    addDefend() {
        this.defend = new Laya.Sprite();
        this.defend.loadImage(`assets/defend.png`);
        // this.defend.scaleX = this.scaleRatio;
        // this.defend.scaleY = this.scaleRatio;
        this.defend.x = this.width / 2;
        this.defend.y = this.height / 2;
        this.defend.pivot(this.defend.width / 2, this.defend.height / 2);
        this.addChild(this.defend);
    }

    showDefend() {
        this.defend.visible = true;
    }

    hideDefend() {
        this.defend.visible = false;
    }

    move(): void {
        if (this.alive) {
            this.headMove()
            this.bodyMove()
            this.speedChange()
            this.rotationChange()
            this.bodyCheck()
        }
    }

    // curtime: number = Date.now();
    headMove(): void {
        // let angle = Math.floor(this.rotation * Math.PI / 180 * 100) / 100;
        // let x = Math.floor(this.speedX * Math.floor(Math.cos(angle) * 100) / 100);
        // let y = Math.floor(this.speedY * Math.floor(Math.sin(angle) * 100) / 100);

        let posBefore = { x: this.x, y: this.y };
        // let x = Laya.MathUtil.lerp(0, this.offset.x, 0.5);
        // let y = Laya.MathUtil.lerp(0, this.offset.y, 0.5);
        // x = Math.round(x);
        // y = Math.round(y);
        // if (this.offset.x > this.speedX) {
        //     offsetx = this.offset.x > this.speedX ? this.speedX : 0;
        //     this.offset.x -= this.speedX;
        // }
        let nextPosX = this.x + this.offset.x;
        let nextPosY = this.y + this.offset.y;
        // this.rotation = this.nextRotation;
        if (!(nextPosX >= Config.mapWidth - this.width / 2 || nextPosX <= this.width / 2)) {
            this.x = nextPosX;
        } else {
            // this.destroy()
            // if (!this.bot) {
            //     console.log("moveOut:", Date.now())
            // }
            return;
        }
        if (!(nextPosY >= Config.mapHeight - this.width / 2 || nextPosY <= this.width / 2)) {
            this.y = nextPosY;
        } else {
            // this.destroy()
            // if (!this.bot) {
            //     console.log("moveOut:", Date.now())
            // }
            return;
        }

        let nextAngle = Math.floor(Math.atan2(nextPosY - posBefore.y, nextPosX - posBefore.x) * 100) / 100;
        // if (!this.bot) {
        //     console.log("nextAngle:", nextAngle)
        // }
        // let move = Math.max(this.offset.x, this.offset.y);
        
        let pathX = Math.floor(Math.cos(nextAngle) * 10) / 10 * this.offset.x;
        let pathY = Math.floor(Math.sin(nextAngle) * 10) / 10 * this.offset.y;
        for (let index = 0; index < this.bodyArr.length; index++) {
            // let pathX = index<this.offset.x ? index * Math.floor(Math.cos(nextAngle) * 10) / 10 + posBefore.x : this.offset.x * Math.floor(Math.cos(nextAngle) * 10) / 10 + posBefore.x ;
            // let pathY = index<this.offset.y ? index * Math.floor(Math.sin(nextAngle) * 10) / 10 + posBefore.y : this.offset.y * Math.floor(Math.sin(nextAngle) * 10) / 10 + posBefore.y ;
            // if (index == 0) {
                // this.pathArr.push({ x: pathX, y: pathY })

            // } else {
                this.pathArr.push({ x: this.bodyArr[index - 1].x, y: this.bodyArr[index - 1].y });
            // }
            // if (!this.bot) {
            //     console.log("pathArr:", pathX, pathY)
        }
        // }
        this.offset.x = 0;
        this.offset.y = 0;
    }

    bodyMove(): void {
        console.log(JSON.stringify(this.pathArr));
        for (let index = 0; index < this.bodyArr.length; index++) {
            let element = this.bodyArr[index];
            let path = this.pathArr[index];
            // if (path) {
            // element.rotation = Math.atan2(path["y"] - element.y, path["x"] - element.x) / Math.PI * 180; // 身体跟着旋转
            element.pos(path["x"] , path["y"] );
            // }
            // if (this.pathArr.length > this.bodyArr.length) {
            //     this.pathArr.pop();
            //     console.log(this.pathArr)
            // }
        }
        this.pathArr.length = 0;
    }

    snakeScale(ele: Laya.Sprite, eleType: string = "body"): void {
        // if (eleType == "body") {
        // ele.width = Config.snakeBodyRadius * this.scaleRatio;
        // ele.height = Config.snakeBodyRadius * this.scaleRatio;

        // ele.scaleX = this.scaleRatio;
        // ele.scaleY = this.scaleRatio;

        // } else {
        // ele.width = this.originWidth * this.scaleRatio;
        // ele.height = this.originHeight * this.scaleRatio;

        ele.scaleX = this.scaleRatio;
        ele.scaleY = this.scaleRatio;
        // }
        ele.pivot(ele.width / 2, ele.height / 2)
        Config.speedConfig["rotation"] = 4 / this.scaleRatio;
    }

    speedChange(): void {
        let currentSpeed = Config.speedConfig[this.currentSpeed];
        // this.speed = this.currentSpeed == 'slow' ? (this.speed > currentSpeed ? this.speed - 1 : currentSpeed) : (this.speed < currentSpeed ? this.speed + 1 : currentSpeed);
        this.speedX = this.currentSpeed == 'slow' ? (this.speedX > currentSpeed ? this.speedX - 1 : currentSpeed) : (this.speedX < currentSpeed ? this.speedX + 1 : currentSpeed);
        this.speedY = this.currentSpeed == 'slow' ? (this.speedY > currentSpeed ? this.speedY - 1 : currentSpeed) : (this.speedY < currentSpeed ? this.speedY + 1 : currentSpeed);
    }

    rotationChange(): void {
        if (this.curRotation == this.nextRotation) {
            return;
        }
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
        body.zOrder = zOrder;
        body.loadImage(`assets/${this.skinId}_body_${zOrder % 2 + 1}.png`, Laya.Handler.create(this, () => {
            this.snakeScale(body, "body")
            body.pos(x, y)
            body.rotation = r;
            GameManager.inst.battleMap.addChild(body)
        }))

        this.bodyArr.push(body)
    }

    bodyCheck() {
        if (this.eatBean >= this.bodyBeanNum && this.bodyArr.length < this.bodyMaxNum) {
            let addBodyNum = Math.floor(this.eatBean / this.bodyBeanNum)
            let r = this.bodyArr[this.bodyArr.length - 1].rotation
            for (let index = 0; index < addBodyNum; index++) {
                this.addBody(this.bodySpace * Math.cos(r * Math.PI / 180), this.bodySpace * Math.sin(r * Math.PI / 180), r)
            }
            for (let index = 0; index < this.bodySpace * addBodyNum; index++) {
                this.pathArr.push({ x: this.x - index * Math.cos(r * Math.PI / 180), y: this.y - index * Math.sin(r * Math.PI / 180) })
            }
            this.eatBean = this.eatBean % this.bodyBeanNum;// 剩余未被消化的豆豆

            if (this.scaleRatio < 1) { // 折算能量转换长度
                this.scaleRatio = Config.defaultScaleRatio + (1 - Config.defaultScaleRatio) / this.bodyMaxNum * this.bodyArr.length;
                this.bodyArr.forEach(element => {
                    this.snakeScale(element, "body");
                })
                this.snakeScale(this, "head");
            } else {
                this.scaleRatio = 1;
            }
            this.bodySpace = Math.floor(Config.snakeBodyRadius * this.scaleRatio / 10 * 8)
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