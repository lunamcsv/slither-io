import { Circle, Vector } from "sat"
export default class Bean extends Circle {
    skin: number;
    radius: number = 24;
    id: string;
    alive: boolean = true;

    constructor(id: string, pos: Vector, radius: number, skin: number) {
        super();
        this.id = id;
        this.radius = radius;
        this.init(pos, skin);
    }

    init(pos: Vector, skin: number) {
        this.alive = true;
        this.pos = pos;
        this.skin = skin;

    }

    destroy() {
        this.alive = false;
    }
}