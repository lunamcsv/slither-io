export interface IBase {
    id: string;
}
export interface IRotation extends IBase {
    rotation: number
}

export interface ISnakeData extends IBase {
    pos:Laya.Vector2;
    
}

export interface IBeanData extends IBase{
    pos:Laya.Vector2;
    skin:number;
}

export interface IGlobalData{
    snakes:ISnakeData[];
    beans:IBeanData[];
}