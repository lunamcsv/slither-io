var polea = (() => {
  // src/GameConfig.ts
  var GameConfig = class {
    constructor() {
    }
    static init() {
      var reg = Laya.ClassUtils.regClass;
    }
  };
  GameConfig.width = 750;
  GameConfig.height = 1334;
  GameConfig.scaleMode = "fixedwidth";
  GameConfig.screenMode = "none";
  GameConfig.alignV = "top";
  GameConfig.alignH = "left";
  GameConfig.startScene = "Main/Main.scene";
  GameConfig.sceneRoot = "";
  GameConfig.debug = false;
  GameConfig.stat = true;
  GameConfig.physicsDebug = false;
  GameConfig.exportSceneToJson = true;
  GameConfig.init();

  // src/fgui/extension/Joystick.ts
  var _Joystick = class extends fgui.GComponent {
    constructFromXML(xml) {
      super.constructFromXML(xml);
      this._button = this.getChild("joystick").asButton;
      this._button.changeStateOnClick = false;
      this._thumb = this._button.getChild("btn_joystick");
      this._touchArea = this.getChild("joystick_touch");
      this._center = this.getChild("center");
      this._initX = this._center.x + this._center.width / 2;
      this._initY = this._center.y + this._center.height / 2;
      this._touchArea.on(Laya.Event.MOUSE_DOWN, this, this.onTouchDown);
    }
    constructor() {
      super();
      this.touchId = -1;
      this.radius = 60;
      this._curPos = new Laya.Point();
    }
    Trigger(evt) {
      this.onTouchDown(evt);
    }
    onTouchDown(evt) {
      if (this.touchId == -1) {
        this.touchId = evt.touchId;
        if (this._tweener != null) {
          this._tweener.kill();
          this._tweener = null;
        }
        fgui.GRoot.inst.globalToLocal(Laya.stage.mouseX, Laya.stage.mouseY, this._curPos);
        var bx = this._curPos.x - this.x;
        var by = this._curPos.y - this.y;
        this._button.selected = true;
        if (bx < 0)
          bx = 0;
        else if (bx > this._touchArea.width)
          bx = this._touchArea.width;
        if (by > fgui.GRoot.inst.height)
          by = fgui.GRoot.inst.height;
        else if (by < this._touchArea.y)
          by = this._touchArea.y;
        this._lastStageX = bx;
        this._lastStageY = by;
        this._startStageX = bx;
        this._startStageY = by;
        this._center.visible = true;
        this._center.x = bx - this._center.width / 2;
        this._center.y = by - this._center.height / 2;
        this._button.x = bx - this._button.width / 2;
        this._button.y = by - this._button.height / 2;
        var deltaX = bx - this._initX;
        var deltaY = by - this._initY;
        var degrees = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        this._thumb.rotation = degrees + 90;
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onTouchMove);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onTouchUp);
      }
    }
    onTouchUp(evt) {
      if (this.touchId != -1 && evt.touchId == this.touchId) {
        this.touchId = -1;
        this._thumb.rotation = this._thumb.rotation + 180;
        this._center.visible = false;
        this._tweener = fgui.GTween.to2(this._button.x, this._button.y, this._initX - this._button.width / 2, this._initY - this._button.height / 2, 0.3).setTarget(this._button, this._button.setXY).setEase(fgui.EaseType.CircOut).onComplete(this.onTweenComplete, this);
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onTouchMove);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onTouchUp);
        Laya.stage.event(_Joystick.JoystickUp);
      }
    }
    onTweenComplete() {
      this._tweener = null;
      this._button.selected = false;
      this._thumb.rotation = 0;
      this._center.visible = true;
      this._center.x = this._initX - this._center.width / 2;
      this._center.y = this._initY - this._center.height / 2;
    }
    onTouchMove(evt) {
      if (this.touchId != -1 && evt.touchId == this.touchId) {
        var bx = Laya.stage.mouseX - this.x;
        var by = Laya.stage.mouseY - this.y;
        var moveX = bx - this._lastStageX;
        var moveY = by - this._lastStageY;
        this._lastStageX = bx;
        this._lastStageY = by;
        var buttonX = this._button.x + moveX;
        var buttonY = this._button.y + moveY;
        var offsetX = buttonX + this._button.width / 2 - this._startStageX;
        var offsetY = buttonY + this._button.height / 2 - this._startStageY;
        var rad = Math.atan2(offsetY, offsetX);
        var degree = rad * 180 / Math.PI;
        this._thumb.rotation = degree + 90;
        var maxX = this.radius * Math.cos(rad);
        var maxY = this.radius * Math.sin(rad);
        if (Math.abs(offsetX) > Math.abs(maxX))
          offsetX = maxX;
        if (Math.abs(offsetY) > Math.abs(maxY))
          offsetY = maxY;
        buttonX = this._startStageX + offsetX;
        buttonY = this._startStageY + offsetY;
        if (buttonX < 0)
          buttonX = 0;
        if (buttonY > fgui.GRoot.inst.height)
          buttonY = fgui.GRoot.inst.height;
        this._button.x = buttonX - this._button.width / 2;
        this._button.y = buttonY - this._button.height / 2;
        Laya.stage.event(_Joystick.JoystickMoving, { degree });
      }
    }
  };
  var Joystick = _Joystick;
  Joystick.JoystickMoving = "JoystickMoving";
  Joystick.JoystickUp = "JoystickUp";

  // src/script/Bean.ts
  var Bean = class extends Laya.Sprite {
    constructor(id, skin, x, y) {
      super();
      this.alive = true;
      this.haveEaten = false;
      this.speed = 2;
      this.eatenTargetPos = { x: 0, y: 0 };
      this.haveEatenDis = 4;
      this.eatenPos = { x: 0, y: 0 };
      this.eatenInitPos = { x: 0, y: 0 };
      this.alive = true;
      this.id = id;
      this.skin = skin;
      this.zOrder = 0;
      this.visible = false;
      this.eatenInitPos["x"] = x;
      this.eatenInitPos["y"] = y;
      this.init(x, y);
    }
    init(x, y) {
      this.loadImage("assets/bean_" + this.skin + ".png", Laya.Handler.create(this, this.loaded, [x, y]));
    }
    loaded(x, y) {
      this.zOrder = 0;
      this.pivot(this.width / 2, this.height / 2);
      this.pos(x, y);
      this.visible = true;
    }
    destroy() {
    }
    hide(snake) {
      Laya.Tween.to(this, { x: snake.x, y: snake.y, scaleX: 0, scaleY: 0, alpha: 0 }, 100, null, Laya.Handler.create(this, this.hideComplete));
    }
    hideComplete() {
      this.alive = false;
    }
  };

  // src/Config.ts
  var Config = class {
  };
  Config.mapWidth = 5e3;
  Config.mapHeight = 5e3;
  Config.defaultScaleRatio = 0.5;
  Config.snakeBodyRadius = 64;
  Config.speedConfig = { "slow": 6, "fast": 10, "rotation": 10 };

  // src/script/Snake.ts
  var Snake = class extends Laya.Sprite {
    constructor(id, skinId, x, y, angle = 0) {
      super();
      this.currentSpeed = "slow";
      this.snakeLength = 0;
      this.kill = 0;
      this.alive = true;
      this.bodyArr = [];
      this.pathArr = [];
      this.eatBean = 0;
      this.bodyBeanNum = 6;
      this.bodyMaxNum = 30;
      this.id = "";
      this.bot = true;
      this.offset = new Laya.Point();
      this.id = id;
      this.rotation = angle;
      this.curRotation = this.rotation;
      this.nextRotation = this.rotation;
      this.alive = true;
      this.speedX = Config.speedConfig[this.currentSpeed];
      this.speedY = Config.speedConfig[this.currentSpeed];
      this.skinId = skinId + 100;
      this.visible = false;
      this.scaleRatio = Config.defaultScaleRatio;
      this.width = Config.snakeBodyRadius;
      this.height = Config.snakeBodyRadius;
      this.zOrder = 11e3;
      this.pivot(this.width / 2, this.height / 2);
      this.pos(x, y);
      this.head = new Laya.Sprite();
      this.head.loadImage(`assets/${this.skinId}_head.png`, Laya.Handler.create(this, this.loaded));
    }
    loaded() {
      this.addChild(this.head);
      this.head.pos(this.head.width / 2, this.height / 2);
      this.snakeScale(this.head, "head");
      this.visible = true;
      this.bodySpace = Math.floor(this.width / 10 * 8);
      for (let index = 1; index <= this.getBodyNum(); index++) {
        this.addBody(this.x - index * this.bodySpace, this.y, this.rotation);
      }
      for (let index = 0; index < this.bodySpace * this.getBodyNum(); index++) {
        this.pathArr.push({
          x: this.x - index,
          y: this.y
        });
      }
    }
    move() {
      if (this.alive) {
        this.headMove();
        this.bodyMove();
        this.speedChange();
        this.rotationChange();
        this.bodyCheck();
      }
    }
    headMove() {
      let posBefore = { x: this.x, y: this.y };
      let nextPosX = this.x + this.offset.x;
      let nextPosY = this.y + this.offset.y;
      this.head.rotation = this.nextRotation;
      if (!(nextPosX >= Config.mapWidth - this.head.width / 2 || nextPosX <= this.head.width / 2)) {
        this.x = nextPosX;
      } else {
        if (!this.bot) {
          console.log("moveOut:", Date.now());
        }
        return;
      }
      if (!(nextPosY >= Config.mapHeight - this.head.width / 2 || nextPosY <= this.head.width / 2)) {
        this.y = nextPosY;
      } else {
        return;
      }
      let nextAngle = Math.floor(Math.atan2(nextPosY - posBefore.y, nextPosX - posBefore.x) * 100) / 100;
      for (let index = 1; index <= Config.speedConfig[this.currentSpeed]; index++) {
        let pathX = index * Math.floor(Math.cos(nextAngle) * 10) / 10 + posBefore.x;
        let pathY = index * Math.floor(Math.sin(nextAngle) * 10) / 10 + posBefore.y;
        this.pathArr.unshift({ x: pathX, y: pathY });
      }
    }
    bodyMove() {
      for (let index = 0; index < this.bodyArr.length; index++) {
        let element = this.bodyArr[index];
        let path = this.pathArr[(index + 1) * this.bodySpace];
        if (path) {
          element.pos(path["x"], path["y"]);
        }
        if (this.pathArr.length > this.bodyArr.length * (1 + this.bodySpace)) {
          this.pathArr.pop();
        }
      }
    }
    snakeScale(ele, eleType = "body") {
      let x = ele.x, y = ele.y;
      ele.graphics.clear();
      if (eleType == "body") {
        ele.width = Config.snakeBodyRadius * this.scaleRatio;
        ele.height = Config.snakeBodyRadius * this.scaleRatio;
      } else {
        ele.width = ele.width * this.scaleRatio;
        ele.height = ele.height * this.scaleRatio;
      }
      ele.pivot(ele.width / 2, ele.height / 2);
      ele.pos(x, y);
      Config.speedConfig["rotation"] = 4 / this.scaleRatio;
    }
    speedChange() {
      let currentSpeed = Config.speedConfig[this.currentSpeed];
      this.speedX = this.currentSpeed == "slow" ? this.speedX > currentSpeed ? this.speedX - 1 : currentSpeed : this.speedX < currentSpeed ? this.speedX + 1 : currentSpeed;
      this.speedY = this.currentSpeed == "slow" ? this.speedY > currentSpeed ? this.speedY - 1 : currentSpeed : this.speedY < currentSpeed ? this.speedY + 1 : currentSpeed;
    }
    rotationChange() {
      if (this.curRotation == this.nextRotation) {
        return;
      }
      let rotationSpan = Math.abs(this.curRotation - this.nextRotation);
      let rotation = Config.speedConfig["rotation"];
      let perRotation = rotationSpan < rotation ? rotationSpan : rotation;
      if (this.curRotation < 0 && this.nextRotation > 0 && Math.abs(this.curRotation) + this.nextRotation > 180) {
        perRotation = 180 - this.nextRotation + (180 + this.curRotation) < rotation ? 180 - this.nextRotation + (180 + this.curRotation) : rotation;
        this.nextRotation += perRotation;
      } else {
        this.nextRotation += this.curRotation > this.nextRotation && rotationSpan <= 180 ? perRotation : -perRotation;
      }
      this.nextRotation = Math.abs(this.nextRotation) > 180 ? this.nextRotation > 0 ? this.nextRotation - 360 : this.nextRotation + 360 : this.nextRotation;
    }
    addBody(x, y, r) {
      let body = new Laya.Sprite();
      let zOrder = this.zOrder - this.bodyArr.length - 1;
      body.visible = false;
      body.alpha = 0;
      body.zOrder = zOrder;
      body.loadImage(`assets/${this.skinId}_body_${zOrder % 2 + 1}.png`, Laya.Handler.create(this, () => {
        this.snakeScale(body, "body");
        body.pos(x, y);
        body.rotation = r;
        GameManager.inst.battleMap.addChild(body);
        body.visible = true;
        body.alpha = 1;
      }));
      this.bodyArr.push(body);
    }
    bodyCheck() {
      if (this.eatBean >= this.bodyBeanNum && this.bodyArr.length < this.bodyMaxNum) {
        let addBodyNum = Math.floor(this.eatBean / this.bodyBeanNum);
        let r = this.bodyArr[this.bodyArr.length - 1].rotation;
        for (let index = 0; index < addBodyNum; index++) {
          this.addBody(this.bodySpace * Math.cos(r * Math.PI / 180), this.bodySpace * Math.sin(r * Math.PI / 180), r);
        }
        for (let index = 0; index < this.bodySpace * addBodyNum; index++) {
          this.pathArr.push({ x: this.x - index * Math.cos(r * Math.PI / 180), y: this.y - index * Math.sin(r * Math.PI / 180) });
        }
        this.eatBean = this.eatBean % this.bodyBeanNum;
        if (this.scaleRatio < 1) {
          this.scaleRatio = Config.defaultScaleRatio + (1 - Config.defaultScaleRatio) / this.bodyMaxNum * this.bodyArr.length;
          this.bodyArr.forEach((element) => {
            this.snakeScale(element, "body");
          });
          this.snakeScale(this, "head");
          this.snakeScale(this.head, "head");
        } else {
          this.scaleRatio = 1;
        }
      }
    }
    getBodyNum() {
      return Math.floor(this.snakeLength / this.bodyBeanNum);
    }
    destroy() {
      this.alive = false;
      this.visible = false;
      this.bodyArr.forEach((body) => {
        body.visible = false;
      });
    }
  };

  // src/manager/GameManager.ts
  var GameManager = class {
    constructor() {
      this.beanNum = 0;
      this.beanOrder = 0;
      this.beans = {};
      this.snakeArr = [];
      this.snakeMap = {};
      this.beanMap = {};
      this.onSpeedUp = false;
      if (GameManager._inst) {
        throw "singleton class is not use new constructor!";
      }
    }
    static get inst() {
      if (this._inst == null) {
        this._inst = new GameManager();
      }
      return this._inst;
    }
    initSocket() {
      let client = new Colyseus.Client("ws://localhost:2567/");
      client.joinOrCreate("state_handler").then((room) => {
        console.log(room.sessionId);
        this.room = room;
        this.room.onMessage("cmd", (message) => {
          this.handleMsg(message.type, message.data);
        });
        this.room.send("create_role");
      });
    }
    send(message) {
      this.room.send("cmd", message);
    }
    handleMsg(type, data) {
      if (type == "updateSnake") {
        this.updateSnake(data);
      } else if (type == "addSnake") {
        this.addSnake(data);
      } else if (type == "initGlobalConfig") {
        this.initGlobalConfig(data);
      } else if (type == "removeSnake") {
        this.removeSnake(data);
      } else if (type == "addBean") {
        this.addBean(data);
      } else if (type == "removeBean") {
        this.removeBean(data);
      }
    }
    addSnake(data) {
      let id = data.id;
      let snake = new Snake(id, 1, data.pos.x, data.pos.y);
      this.snakeMap[id] = snake;
      if (this.room.sessionId == id) {
        this.snakeSelf = snake;
        snake.bot = false;
      }
      this.snakeArr.push(snake);
      this.battleMap.addChild(snake);
    }
    removeBean(data) {
      let snake = data.snakeId;
      let bean = data.beanId;
      this.beanMap[bean].hide(this.snakeMap[snake]);
    }
    updateSnake(data) {
      data.forEach((element) => {
        let id = element.id;
        let snake = this.snakeMap[id];
        if (snake && snake.alive) {
          let rotation = element.rotation;
          let currentSpeed = element.currentSpeed;
          snake.curRotation = rotation;
          snake.currentSpeed = currentSpeed;
          let offsetx = element.pos.x - snake.x;
          let offsety = element.pos.y - snake.y;
          snake.offset.x = offsetx;
          snake.offset.y = offsety;
        }
      });
    }
    removeSnake(data) {
      this.snakeMap[data.id].destroy();
    }
    initGlobalConfig(data) {
      console.log(data);
      let snakes = data.snakes;
      let beans = data.beans;
      snakes.forEach((element) => {
        if (element.alive) {
          let id = element.id;
          let pos = element.pos;
          let rotation = element.rotation;
          console.log(rotation);
          let snake = new Snake(id, 1, pos.x, pos.y, rotation);
          this.snakeMap[id] = snake;
          if (this.room.sessionId == id) {
            this.snakeSelf = snake;
          }
          this.snakeArr.push(snake);
          this.battleMap.addChild(snake);
        }
      });
      beans.forEach((bean) => {
        if (bean.alive) {
          this.addBean(bean);
        }
      });
    }
    init() {
      this.battleView = fgui.UIPackage.createObject("Slither", "Main");
      this.battleView.makeFullScreen();
      fgui.GRoot.inst.addChild(this.battleView);
      this.addEvent();
      this.initSocket();
      this.startGame();
    }
    addEvent() {
      Laya.stage.on(Joystick.JoystickMoving, this, this.onTouchMove);
      this.btnSpeed = this.battleView.getChild("btn_speed").asButton;
      this.btnSpeed.on(Laya.Event.MOUSE_DOWN, this, this.changeSpeed);
      this.btnSpeed.on(Laya.Event.MOUSE_UP, this, this.changeSpeed);
    }
    changeSpeed() {
      this.onSpeedUp = !this.onSpeedUp;
      let onSpeedUp = this.onSpeedUp;
      this.room.send("updateSpeed", { id: this.room.sessionId, onSpeedUp });
    }
    onTouchMove(evt) {
      let rotation = Math.floor(evt.degree);
      this.room.send("updateRotation", { id: this.room.sessionId, rotation });
    }
    startGame() {
      this.createMap();
      Laya.timer.frameLoop(1, this, this.gameLoop);
    }
    createMap() {
      this.battleMap = this.battleView.getChild("map").displayObject;
      this.battleMap.width = Config.mapWidth;
      this.battleMap.height = Config.mapHeight;
    }
    addBean(data) {
      let id = data.id;
      let pos = data.pos;
      let skin = data.skin;
      let bean = new Bean(id, skin, pos.x, pos.y);
      this.beanMap[id] = bean;
      this.battleMap.addChild(bean);
    }
    gameLoop() {
      this.snakeMove();
      this.mapMove();
    }
    snakeMove() {
      for (let index = 0; index < this.snakeArr.length; index++) {
        let snake = this.snakeArr[index];
        snake.move();
      }
    }
    mapMove() {
      if (!this.snakeSelf) {
        return;
      }
      ;
      let mapScale = Config.defaultScaleRatio / this.snakeSelf.scaleRatio < 0.7 ? 0.7 : Config.defaultScaleRatio / this.snakeSelf.scaleRatio;
      let x = -1 * (this.snakeSelf.x + this.snakeSelf.width / 2) * mapScale + GameConfig.width / 2, y = -1 * (this.snakeSelf.y + this.snakeSelf.height / 2) * mapScale + GameConfig.height / 2;
      this.battleMap.x = x;
      this.battleMap.y = y;
      this.battleMap.scale(mapScale, mapScale);
    }
    createSnake() {
    }
  };

  // src/App.ts
  var App = class {
    constructor() {
      this.initConfig();
      this.load();
    }
    initConfig() {
      fgui.UIObjectFactory.setExtension("ui://Slither/joystick", Joystick);
      fgui.UIConfig.packageFileExtension = "bin";
      Laya.stage.addChild(fgui.GRoot.inst.displayObject);
    }
    load() {
      Laya.loader.load("res/atlas/assets.atlas", Laya.Handler.create(this, () => {
        this.loadRes();
      }), null, Laya.Loader.ATLAS);
    }
    loadRes() {
      fgui.UIPackage.loadPackage("./res/fgui/Slither", Laya.Handler.create(this, this.init));
    }
    init() {
      GameManager.inst.init();
    }
  };

  // src/Main.ts
  var Main = class {
    constructor() {
      if (window["Laya3D"])
        Laya3D.init(GameConfig.width, GameConfig.height);
      else
        Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
      Laya["Physics"] && Laya["Physics"].enable();
      Laya["DebugPanel"] && Laya["DebugPanel"].enable();
      Laya.stage.scaleMode = GameConfig.scaleMode;
      Laya.stage.screenMode = GameConfig.screenMode;
      Laya.stage.alignV = GameConfig.alignV;
      Laya.stage.alignH = GameConfig.alignH;
      Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
      if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
        Laya.enableDebugPanel();
      if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
        Laya["PhysicsDebugDraw"].enable();
      if (GameConfig.stat)
        Laya.Stat.show();
      Laya.alertGlobalError(true);
      Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
    }
    onVersionLoaded() {
      Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
    }
    onConfigLoaded() {
      new App();
    }
  };
  new Main();
})();
//# sourceMappingURL=bundle.js.map
