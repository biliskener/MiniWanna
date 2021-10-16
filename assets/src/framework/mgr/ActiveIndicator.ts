import { BlockInputEvents, Color, Label, sp, Sprite, Tween, UIOpacity } from "cc";
import { UIConfig } from "../config/UIConfig";
import { ZOrder } from "../const/ZOrder";
import { cc_tween } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxEvent0 } from "../core/noxEvent";
import { noxTime } from "../core/noxTime";
import { NoxComponent } from "../core/NoxComponent";
import { NoxScene } from "../view/NoxScene";
import { SpriteUtil } from "../util/SpriteUtil";
import { SpineUtil } from "../util/SpineUtil";
import { RichTextUtil } from "../util/RichTextUtil";
import { NoxViewMgr } from "../view/NoxViewMgr";

const TIME_OUT = 30;

export class BaseIndicator extends NoxComponent {
    private mLabel: Label = null as any as Label;
    private mBack: Sprite = null as any as Sprite;
    private mBones: sp.Skeleton = null as any as sp.Skeleton;

    private mUserData: any = null;
    private mTimeStamp: number = 0;

    public constructor() {
        super();
    }

    public init(): void {
        this.mBack = SpriteUtil.createScale9Sprite("_default/white");
        this.mBack.color = Color.BLACK;
        noxcc.getOrAddComponent(this.mBack.node, UIOpacity).opacity = UIConfig.MASK_OPACITY_LIGHT;
        noxcc.setParent(this.mBack.node, this.node);
        noxcc.addFullSizeWidget(this.mBack.node);

        this.mBones = SpineUtil.createSpineAnim("spine/dengdai", "default", "animation", true);
        noxcc.setParent(this.mBones.node, this.node);

        this.mLabel = RichTextUtil.createLabel("", { size: UIConfig.FontSize.S2 });
        noxcc.addY(this.mLabel.node, -80);
        noxcc.setParent(this.mLabel.node, this.node);

        this.node.addComponent(BlockInputEvents);
    }

    public show(text?: string, hideDuration?: number | null, userData?: any, timeOutDuration?: number): void {
        this.node.active = true;
        Tween.stopAllByTarget(this.node);

        var timeout = timeOutDuration ?? TIME_OUT;
        if (timeout > 0) {
            cc_tween(this.node).delay(timeout).call(() => {
                ActiveIndicator.Event.TimeOut.dispatchEvent();
            }).start();
        }

        this.mUserData = userData;
        this.mTimeStamp = noxTime.getRunningTime();
        noxcc.getOrAddComponent(this.node, UIOpacity).opacity = 0;
        this.mLabel.node.active = false;
        this.mBones.node.active = false;
        this.mLabel.string = text ?? "";

        var duration = hideDuration ?? 0;

        var self = this;
        cc_tween(this.node).delay(duration).call(() => {
            noxcc.getOrAddComponent(self.node, UIOpacity).opacity = 255;
            self.mLabel.node.active = true;
            self.mBones.node.active = true;
            self.mBones.setAnimation(1, "animation", true);
        }).start();
    }

    public hide(): any {
        var userData = this.mUserData;
        this.mUserData = null;
        Tween.stopAllByTarget(this.node);
        this.node.active = false;
        return userData;
    }

    public getDuration(): number {
        return noxTime.getRunningTime() - this.mTimeStamp;
    }

    public getUserData(): any {
        return this.mUserData;
    }

    public static create(): BaseIndicator {
        var node = noxcc.createNodeAndFullSize();
        noxcc.setZOrder(node, ZOrder.toast);
        var indicator = node.addComponent(BaseIndicator);
        indicator.init();
        node.active = false;
        return indicator;
    }
}

export module ActiveIndicator {
    export const Event = {
        TimeOut: new noxEvent0(),
    };
    let mLoadingIndicator: BaseIndicator = null as any as BaseIndicator;
    let mCommonIndicator: BaseIndicator = null as any as BaseIndicator;
    let mIsShowingCommon: boolean = false;
    let mIsShowingLoading: number = 0;

    export function init(): void {
        mLoadingIndicator = BaseIndicator.create();
        mCommonIndicator = BaseIndicator.create();

        noxcc.setZOrder(mLoadingIndicator.node, ZOrder.indicator);
        noxcc.setZOrder(mCommonIndicator.node, ZOrder.indicator);
        noxcc.setParent(mLoadingIndicator.node, NoxViewMgr.getRoot());
        noxcc.setParent(mCommonIndicator.node, NoxViewMgr.getRoot());
    }

    export function shut(): void {
        mLoadingIndicator.node.destroy();
        mLoadingIndicator = null as any as BaseIndicator;
        mCommonIndicator.node.destroy();
        mCommonIndicator = null as any as BaseIndicator;
    }

    export function attach(scene: NoxScene): void {
        if (true) return;
        noxcc.setParent(mLoadingIndicator.node, scene.getSceneNode());
        noxcc.setParent(mCommonIndicator.node, scene.getSceneNode());
    }

    export function detach(): void {
        if (true) return;
        noxcc.setParent(mLoadingIndicator.node, null);
        noxcc.setParent(mCommonIndicator.node, null);
    }

    // 显示常规指示器
    export function show(text?: string, hideDuration?: number, userData?: any, timeOutDuration?: number): void {
        // 先隐藏装载的指示器
        if (mIsShowingLoading) {
            mLoadingIndicator.hide();
        }
        mIsShowingCommon = true;
        mCommonIndicator.hide();
        mCommonIndicator.show(text, hideDuration, userData, timeOutDuration);
    }

    // 隐藏常规指示器
    export function hide(): any {
        if (mIsShowingCommon) {
            mIsShowingCommon = false;
            // 若正在装载, 则显示装载
            if (mIsShowingLoading) {
                mLoadingIndicator.show("", null, null, 0);
            }
            return mCommonIndicator.hide();
        }
        return null;
    }

    export function isShow(): boolean {
        return mIsShowingCommon;
    }

    // 显示装载中
    export function showLoading(): void {
        if (mIsShowingLoading++ == 0) {
            if (!mIsShowingCommon) {
                mLoadingIndicator.show("", 0.1, null, 0);
            }
        }
    }

    // 隐藏装载中
    export function hideLoading(): void {
        if (--mIsShowingLoading == 0) {
            if (!mIsShowingCommon) {
                mLoadingIndicator.hide();
            }
        }
    }

    // 获得指示器的时间
    export function getDuration(): number {
        return mCommonIndicator.getDuration();
    }

    // 获得指示器的数据
    export function getUserData(): any {
        return mCommonIndicator.getUserData();
    }
}
