import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import LogicManager from "../game/LogicManager";

// export class Player extends Schema {
//     @type("number")
//     x = Math.floor(Math.random() * 400);

//     @type("number")
//     y = Math.floor(Math.random() * 400);
// }

// export class State extends Schema {
//     @type({ map: Player })
//     players = new MapSchema<Player>();

//     something = "This attribute won't be sent to the client-side";

//     createPlayer(sessionId: string) {
//         this.players.set(sessionId, new Player());
//     }

//     removePlayer(sessionId: string) {
//         this.players.delete(sessionId);
//     }

//     movePlayer (sessionId: string, movement: any) {
//         if (movement.x) {
//             this.players.get(sessionId).x += movement.x * 10;

//         } else if (movement.y) {
//             this.players.get(sessionId).y += movement.y * 10;
//         }
//     }
// }

export class StateHandlerRoom extends Room {
    maxClients = 4;
    LogicManager: LogicManager;
    onCreate(options) {
        console.log("StateHandlerRoom created!", options);
        this.LogicManager = new LogicManager(this);
        this.LogicManager.init();
        // this.setState(new State());

        // this.onMessage("move", (client, data) => {
        // console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
        // this.state.movePlayer(client.sessionId, data);
        // });
        this.onMessage("create_role", (client) => {
            // 根据用户信息设置角色皮肤
            console.log("create_role:", client.sessionId)
            if (!this.roleMap[client.sessionId]) {
                this.roleMap[client.sessionId] = client;
                this.LogicManager.createRoleSnake({ id: client.sessionId });
            }
        })

        this.onMessage("updateRotation", (client, data) => {
            this.LogicManager.snakeMap[client.sessionId].curRotation = data.rotation;
        })

        this.onMessage("updateSpeed", (client, data) => {
            this.LogicManager.snakeMap[client.sessionId].currentSpeed = data.onSpeedUp ? "fast" : "slow";
        })
    }


    onAuth(client, options, req) {
        return true;
    }

    broadcastAll(type: string, data: any) {
        // data = JSON.stringify(data);
        // console.log(data);
        this.broadcast("cmd", { type, data });

    }

    onJoin(client: Client) {
        console.log("onJoin");
        if (!this.isStart) {
            this.LogicManager.startGame();
            this.isStart = true;
        } else {
            // this.broadcast(GAME_START, {}); // 通知开始游戏
        }
        this.LogicManager.initConfig(client);

        // if (!this.roleMap[client.sessionId]) {
        //     this.roleMap[client.sessionId] = client;
        // 为这个客户端创建一个角色
        // this.LogicManager.createSnake(client.sessionId);
        // }
        // 初始化场地信息
        // this.LogicManager.initGlobal(client);

        // client.send("hello", "world");
        // this.state.createPlayer(client.sessionId);
    }

    onLeave(client) {
        // this.state.removePlayer(client.sessionId);
        if (!this.roleMap[client.sessionId]) {
            delete this.roleMap[client.sessionId];
        }
        if (Object.keys(this.roleMap).length == 0) {
            console.log("房间没有用户了")
            this.LogicManager.destroy();
        }
    }

    onDispose() {
        console.log("Dispose StateHandlerRoom");
    }

    public isStart: boolean = false;
    public roleMap: {
        [key: string]: Client
    } = {};
    startGame() {
        if (!this.isStart) {
            this.LogicManager = new LogicManager(this);
            this.LogicManager.init();
        }
    }

}
