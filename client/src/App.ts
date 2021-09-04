import Joystick from "./fgui/extension/Joystick";
import GameManager from "./manager/GameManager";

export default class App {
    constructor() {
        this.initConfig();
        this.load();
    }

    initConfig(): void {
        fgui.UIObjectFactory.setExtension("ui://Slither/joystick", Joystick);
        fgui.UIConfig.packageFileExtension = "bin";
        Laya.stage.addChild(fgui.GRoot.inst.displayObject);
    }

    //加载资源
    load(): void {
        //加载资源
        Laya.loader.load("res/atlas/assets.atlas", Laya.Handler.create(this, () => {
            // this.loading.text = "";
            //资源加载完成则进入开始界面
            // this.gameStartSence()
            // this.init();
            this.loadRes();
        }), null, Laya.Loader.ATLAS);
    }

    loadRes(): void {
        fgui.UIPackage.loadPackage("./res/fgui/Slither", Laya.Handler.create(this, this.init));
    }

    init(): void {
        GameManager.inst.init();
    }
}