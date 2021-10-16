import { SceneManager } from "../framework/base/SceneManager";
import { cc_assert } from "../framework/core/nox";
import { noxSound } from "../framework/core/noxSound";
import { GameConfig } from "./config/GameConfig";
import { GameData } from "./data/GameData";
import { SettingData } from "./data/SettingData";
import { MenuScene } from "./ui/scene/MenuScene";
import { SplashScene } from "./ui/scene/SplashScene";

export class MyGame {
    private static gInstance: MyGame = null as any as MyGame;
    public static createInstance(): MyGame {
        cc_assert(this.gInstance == null)
        this.gInstance = new MyGame();
        this.gInstance.init();
        return this.gInstance;
    }
    public static get INSTANCE(): MyGame {
        return this.gInstance;
    }

    private constructor() {
    }

    public init() {
        GameData.createInstance();

        SettingData.createInstance();
        noxSound.setMusicOn(SettingData.INSTANCE.enableSound);
        noxSound.setEffectOn(SettingData.INSTANCE.enableSound);

        if (GameConfig.useIwbtLevels) {
            SceneManager.pushScene(SplashScene.create());
        }
        else {
            SceneManager.pushScene(MenuScene.create());
        }
    }

    public update(dt: number) {
    }
}
