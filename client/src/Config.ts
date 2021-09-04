export default class Config{
    static mapWidth:number = 5000;
    static mapHeight:number = 5000;
    // static beanInitCnt:number = 1;
    static snakeBodyRadius:number = 64;
    static speedConfig: { [key: string]: number } = { "slow": 6, "fast": 8, "rotation": 10 }
}