export default class Config {
    public static mapWidth: number = 5000;
    public static mapHeight: number = 5000;
    public static initWidth: number = 40;
    public static beanSpawnMax: number = 300;//豆豆的上限
    public static beanSpawnCnt: number = 20;//每次随机生成的豆豆的数量
    public static beanSkinLength: number = 4;
    public static beanRadius: number = 5;
    public static snakeSpawnCnt: number = 10;// 机器人的生成数量
    public static snakeSkinLength: number = 4;
    public static speedConfig: { [key: string]: number } = { "slow": 6, "fast": 8, "rotation": 10 }
}