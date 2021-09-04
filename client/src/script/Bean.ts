import Snake from "./Snake"
export default class Bean extends Laya.Sprite {
    skin: number
    orderNum: number

    haveEaten: boolean = false
    eatenTarget: Snake
    speed: number = 2
    eatenTargetPos: Object = { x: 0, y: 0 }
    haveEatenDis: number = 4
    eatenPos: Object = { x: 0, y: 0 }
    eatenInitPos: Object = { x: 0, y: 0 }
    id: string;
    constructor(
        id: string, skin: number, x: number, y: number) {
        super();
        this.id = id;
        this.skin = skin
        this.zOrder = 0
        this.visible = false
        this.eatenInitPos["x"] = x
        this.eatenInitPos["y"] = y
        this.init(x, y)
    }

    init(x: number, y: number): void {
        this.loadImage("assets/bean_" + this.skin + ".png", Laya.Handler.create(this, this.loaded, [x, y]))
    }

    loaded(x: number, y: number): void {
        this.zOrder = 0
        this.pivot(this.width / 2, this.height / 2)
        this.pos(x, y)
        this.visible = true
    }

    destroy() {
        this.visible = false;
    }
}