export default class Config{
    public static mapWidth:number = 5000;
    public static mapHeight:number = 5000;
    public static defaultScaleRatio: number = 0.5; // 蛇身默认缩放
    // static beanInitCnt:number = 1;
    public static snakeBodyRadius:number = 64;
    public static speedConfig: { [key: string]: number } = { "slow": 6, "fast": 10, "rotation": 10 }
}