import { Node, Tween } from "cc";
import { GuideConfig } from "../config/GuideConfig";
import { cc_tween } from "../core/nox";
import { noxEvent1 } from "../core/noxEvent";
import { NoticeManager } from "../mgr/NoticeManager";
import { NoxView, ViewType } from "../view/NoxView";

const GUIDE_ACTION_TAG = 10234;

// 不要随便往基类里面添加有具体逻辑的接口, 否则会导致循环依赖问题
export class BaseScene extends NoxView {
    public static Event = {
        CheckGuide: new noxEvent1<BaseScene>(),
    };

    public _sceneId: number = -1;

    public constructor(sceneId: number, viewType: ViewType) {
        super(viewType);
        this._sceneId = sceneId;
    }

    public getSceneNode(): Node {
        return super.getSceneNode();
    }

    public show() {
        this.showView();
    }

    public hide() {
        this.hideView();
    }

    public onEnable(): void {
        super.onEnable();

        /*
        if (this._sceneId == SceneId.city) {
            MarqueeManager.attach(this);
        }
        else {
            MarqueeManager.stop();
        }
         */
        NoticeManager.bindToRunningScene();

        this.checkUnlockModule();
    }

    public onDisable(): void {
        //MarqueeManager.unattach();
        NoticeManager.unbindFromRunningScene();

        Tween.stopAllByTag(GUIDE_ACTION_TAG, this.node);
        super.onDisable();
    }

    protected onFadeInEnd(canceled: boolean): void {
        super.onFadeInEnd(canceled);

        this.delayCheckGuide();
    }

    public delayCheckGuide(): void {
        if (GuideConfig.isEnableGuide()) {
            Tween.stopAllByTag(GUIDE_ACTION_TAG, this.node);
            var action = cc_tween(this.node).tag(GUIDE_ACTION_TAG).delay(0).call(() => {
                BaseScene.Event.CheckGuide.dispatchEvent(this);
                this.checkGuide();
            });
            action.tag(GUIDE_ACTION_TAG);
            action.start();
        }
    }

    public checkGuide(): void {
    }

    public onGuide(): void {
    }

    public checkUnlockModule(): void {

    }
}
