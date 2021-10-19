import { Button, EventKeyboard, KeyCode, Label, Node, SystemEvent } from "cc";
import { BaseScene } from "../../../framework/base/BaseScene";
import { SceneManager } from "../../../framework/base/SceneManager";
import { cc_assert, cc_find, cc_systemEvent } from "../../../framework/core/nox";
import { noxcc } from "../../../framework/core/noxcc";
import { SceneId } from "../../const/SceneId";
import { GameData } from "../../data/GameData";
import { AllViewTypes } from "../AllViewTypes";
import { LevelScene } from "./LevelScene";
import { SelectScene } from "./SelectScene";


export class MenuScene extends BaseScene {
    private mSaveNodes: { [key: string]: Node } = {};
    private mCursorNode: Node = null;
    private mCursorOriginX: number;
    private mCursorSpacingX: number;
    private mCursorIndex: number;
    private mLeftButtonDown: boolean;
    private mRightButtonDown: boolean;

    protected constructor() {
        super(SceneId.menu, AllViewTypes.MenuScene);
    }

    public init(): void {
    }

    public onRelease(): void {
    }

    public onInitWidget(): void {
        super.onInitWidget();

        for (var i = 1; i <= 3; ++i) {
            var saveNode = cc_find("save" + i, this.node);
            cc_assert(saveNode);
            this.mSaveNodes[i] = saveNode;
        }
        this.mCursorNode = cc_find("cursor", this.node);
        this.mCursorOriginX = this.mCursorNode.position.x;
        this.mCursorSpacingX = this.mSaveNodes[2].position.x - this.mSaveNodes[1].position.x;
        this.mCursorIndex = 1;
    }

    //销毁界面时的调用
    public onReleaseWidget(): void {
        super.onReleaseWidget();
    }

    //界面打开时的调用
    public onEnter(): void {
        super.onEnter();

        cc_systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc_systemEvent.on(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        GameData.INSTANCE.loadAllSavedData();
        this.showSavedData();
    }

    //界面关闭时的调用
    public onExit(): void {
        GameData.INSTANCE.unloadAllSavedData();

        cc_systemEvent.off(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc_systemEvent.off(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        super.onExit();
    }

    private onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
                if (!this.mLeftButtonDown) {
                    this.mLeftButtonDown = true;
                    this.cursorMove(-1);
                }
                break;
            case KeyCode.ARROW_RIGHT:
                if (!this.mRightButtonDown) {
                    this.mRightButtonDown = true;
                    this.cursorMove(1);
                }
                break;
            case KeyCode.SHIFT_LEFT:
                this.startGame();
                break;
        }
    }

    private onKeyUp(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
                this.mLeftButtonDown = false;
                break;
            case KeyCode.ARROW_RIGHT:
                this.mRightButtonDown = false;
                break;
        }
    }

    private cursorMove(value: number) {
        this.mCursorIndex += value;
        this.mCursorIndex = Math.min(3, this.mCursorIndex);
        this.mCursorIndex = Math.max(1, this.mCursorIndex);
        noxcc.setX(this.mCursorNode, this.mCursorOriginX + (this.mCursorIndex - 1) * this.mCursorSpacingX);
    }

    private showSavedData() {
        for (var i = 1; i <= 3; ++i) {
            var savedData = GameData.INSTANCE.getSavedData(i);
            var saveNode = this.mSaveNodes[i];
            saveNode.getChildByName("mode").getComponent(Label).string = savedData.mode;
            saveNode.getChildByName("death").getComponent(Label).string = "death: " + savedData.deathCount;
            saveNode.getChildByName("time").getComponent(Label).string = "time: " + this.formatTime(savedData.gameTime);
        }
    }

    private formatTime(time: number) {
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor(time / 60) % 60;
        var seconds = Math.floor(time) % 60;
        return string.format("%d:%02d:%02d", hours, minutes, seconds);
    }

    private startGame() {
        GameData.INSTANCE.setCurrSaveId(this.mCursorIndex);
        GameData.INSTANCE.loadGame();
        SceneManager.replaceScene(SelectScene.create());
    }

    /*
    private onNewGame(): void {
        GameData.INSTANCE.clear();
        GameData.INSTANCE.saveGame();
        SceneManager.pushScene(LevelScene.create());
    }

    private onContinueGame(): void {
        SceneManager.pushScene(LevelScene.create());
    }
    */

    public static create(): MenuScene {
        var view = new MenuScene();
        view.init();
        return view;
    }
}
