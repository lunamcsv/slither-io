export interface IBase {
    id: string;
}
export interface IStatus extends IBase {
    rotation: number;
    pos: Laya.Vector2;
}

export interface ISnakeData extends IBase {
    pos: Laya.Vector2;
    rotation: number;
    alive: boolean;
}

export interface IBeanData extends IBase {
    pos: Laya.Vector2;
    skin: number;
    alive: boolean;
}

export interface IPath {
    x: number;
    y: number;
}

export interface IGlobalData {
    snakes: ISnakeData[];
    beans: IBeanData[];
}