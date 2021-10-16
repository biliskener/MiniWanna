import { BaseScene } from "../../../framework/base/BaseScene";
import { SceneId } from "../../const/SceneId";
import { AllViewTypes } from "../AllViewTypes";

export class BossScene extends BaseScene {
    protected constructor() {
        super(SceneId.boss, AllViewTypes.BossScene);
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
    }

    //界面关闭时的调用
    public onExit(): void {
        super.onExit();
    }

    //每帧调用(真正可见状态时)
    public onUpdate(dt: number): void {
    }

    public static create(): BossScene {
        var view = new BossScene();
        view.init();
        return view;
    }
}
