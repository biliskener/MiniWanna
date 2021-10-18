import { EventKeyboard, KeyCode, SystemEvent } from "cc";
import { BaseScene } from "../../../framework/base/BaseScene";
import { SceneManager } from "../../../framework/base/SceneManager";
import { cc_macro, cc_systemEvent } from "../../../framework/core/nox";
import { NoxScene } from "../../../framework/view/NoxScene";
import { NoxViewMgr } from "../../../framework/view/NoxViewMgr";
import { SceneId } from "../../const/SceneId";
import { AllViewTypes } from "../AllViewTypes";
import { MenuScene } from "./MenuScene";

export class SplashScene extends BaseScene {
    protected constructor() {
        super(SceneId.splash, AllViewTypes.SplashScene);
    }

    //界面对象初始化，添加打开关闭的事件监听
    public init(): void {
    }

    //界面对象销毁，移除打开关闭的事件监听
    public onRelease(): void {
    }

    // 加载界面时的调用
    public onInitWidget(): void {
        super.onInitWidget();
    }

    //销毁界面时的调用
    public onReleaseWidget(): void {
        super.onReleaseWidget();
    }

    //界面打开时的调用
    public onEnter(): void {
        super.onEnter();
        cc_systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    //界面关闭时的调用
    public onExit(): void {
        cc_systemEvent.off(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        super.onExit();
    }

    private onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.SHIFT_LEFT:
                SceneManager.replaceScene(MenuScene.create());
                break;
        }
    }

    public static create(): SplashScene {
        var view = new SplashScene();
        view.init();
        return view;
    }
}
