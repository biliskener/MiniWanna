import { Button } from "cc";
import { BaseScene } from "../../../framework/base/BaseScene";
import { SceneManager } from "../../../framework/base/SceneManager";
import { noxcc } from "../../../framework/core/noxcc";
import { noxSound } from "../../../framework/core/noxSound";
import { NoxScene } from "../../../framework/view/NoxScene";
import { NoxViewMgr } from "../../../framework/view/NoxViewMgr";
import { SceneId } from "../../const/SceneId";
import { GameData } from "../../data/GameData";
import { AllViewTypes } from "../AllViewTypes";
import { LevelScene } from "./LevelScene";


export class MenuScene extends BaseScene {
    private mNewGameButton: Button;
    private mContinueButton: Button;

    protected constructor() {
        super(SceneId.menu, AllViewTypes.MenuScene);
    }

    public init(): void {
    }

    public onRelease(): void {
    }

    public onInitWidget(): void {
        super.onInitWidget();

        this.mNewGameButton = noxcc.findButton("menu/new_game", this.node);
        this.mContinueButton = noxcc.findButton("menu/continue_game", this.node);
        noxcc.addClick(this.mNewGameButton, this, this.onNewGame);
        noxcc.addClick(this.mContinueButton, this, this.onContinueGame);

        if (GameData.INSTANCE.loadGame()) {
            this.mContinueButton.node.active = true;
        }
        else {
            this.mContinueButton.node.active = false;
        }
    }

    //销毁界面时的调用
    public onReleaseWidget(): void {
        super.onReleaseWidget();
    }

    //界面打开时的调用
    public onEnter(): void {
        super.onEnter();
        noxSound.playBgWithSoundNames(["sound/escape/BgmMenu.mp3"]);
    }

    //界面关闭时的调用
    public onExit(): void {
        super.onExit();
        noxSound.stopBackgroundSound();
    }

    //每帧调用(真正可见状态时)
    public onUpdate(dt: number): void {
    }

    private onNewGame(): void {
        GameData.INSTANCE.clear();
        GameData.INSTANCE.saveGame();
        SceneManager.pushScene(LevelScene.create());
    }

    private onContinueGame(): void {
        SceneManager.pushScene(LevelScene.create());
    }

    public static create(): MenuScene {
        var view = new MenuScene();
        view.init();
        return view;
    }
}
