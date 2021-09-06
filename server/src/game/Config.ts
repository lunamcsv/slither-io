export default class Config {
    public static mapWidth: number = 5000;
    public static mapHeight: number = 5000;
    public static snakeInitLength: number = 20;
    public static defaultScaleRatio: number = 1; // 蛇身默认缩放
    public static bodyMaxNum: number = 30;// 蛇身长度上限
    public static beanSpawnMax: number = 600;//豆豆的上限
    public static beanSpawnCnt: number = 20;//每次随机生成的豆豆的数量
    public static beanSkinCnt: number = 13;
    public static beanRadius: number = 24;
    public static snakeBodyRadius: number = 64/2;
    public static snakeSpawnCnt: number = 0;// 机器人的生成数量
    public static snakeSkinLength: number = 4;
    public static speedConfig: { [key: string]: number } = { "slow": 6, "fast": 10, "rotation": 10 }
}