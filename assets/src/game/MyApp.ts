import { debug, Node } from "cc";
import { cc_assert, cc_game, cc_setDisplayStats } from "../framework/core/nox";
import { MapUtil } from "../framework/util/MapUtil";
import { initObjectGroup } from "./const/ObjectGroup";
import { Restart } from "./map/Restart";
import { MyGame } from "./MyGame";

export class MyApp {
    private static gInstance: MyApp = null as any as MyApp;
    public static createInstance(): MyApp {
        cc_assert(this.gInstance == null)
        this.gInstance = new MyApp();
        this.gInstance.init();
        return this.gInstance;
    }
    public static get INSTANCE(): MyApp {
        return this.gInstance;
    }

    private constructor() {
    }

    public init() {
        // 不显示 FPS
        cc_setDisplayStats(false);

        // 按 F2 重启游戏的常驻节点
        var node = new Node();
        node.addComponent(Restart);
        cc_game.addPersistRootNode(node);

        MyGame.createInstance();
    }

    public update(dt: number) {
        MyGame.INSTANCE.update(dt);
    }
}
