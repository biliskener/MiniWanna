import { AnimationState, BlockInputEvents, Event, EventTouch, Node, Prefab, SpriteFrame, Tween, Widget } from "cc";
import { ResConfig } from "../config/ResConfig";
import { cc_assert, CC_DEBUG, cc_isValid, cc_log, cc_size, cc_tween, nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { NoxComponent } from "../core/NoxComponent";
import { noxScheduler } from "../core/noxScheduler";
import { AssetsTable } from "../core/T";
import { ActiveIndicator } from "../mgr/ActiveIndicator";
import { NoxResMgr } from "../mgr/NoxResMgr";
import { NoxScene } from "./NoxScene";
import { NoxViewMgr } from "./NoxViewMgr";

export interface ViewType {
    module: number,
    hierarchy: number,
    flags: number,
    resPath?: string,
    name?: string,
}

export const ViewFlag = {
    None: 0,        // 无标志
    Main: 1,        // 主界面
    Form: 2,        // 弹窗
    FullScreen: 8,  // 全屏模式
    Panel: 2,       // 全屏弹窗
    Dialog: 2,      // 对话框
};

enum NoxViewState {
    Closed = 0,
    Closing = 1,
    Opening = 2,
    Opened = 3,
}

export class NoxView extends NoxComponent {
    protected mViewType: ViewType = null as any as ViewType;// 类型
    private mContainerNode: Node;                           // 节点, 注意不要改成private
    private mBlockNode: Node;                               // 阻断输入节点

    // 风格或属性
    private mOpenAnim: string = "";                         // 打开界面时需要播放的动画名称
    private mCloseAnim: string = "";                        // 关闭界面时需要播放的动画名称
    protected mOpenAction: Tween<Node> | null = null;       // 打开界面时的Action
    protected mCloseAction: Tween<Node> | null = null;      // 关闭界面时的Action

    // 状态
    private mPrefabLoading: boolean = false;                // 是否正在进行资源装载，即装载mRoot
    private mViewState: NoxViewState = NoxViewState.Closed;
    private mIsRunning: boolean = false;                    // 节点是否在运行(处在当前场景, 并且节点已经显示就绪才会为true)
    private mOpenAnimState: AnimationState | null = null;   // 打开的动画状态
    private mCloseAnimState: AnimationState | null = null;  // 关闭的动画状态
    private mOpenActionState: Tween<Node> | null = null;    // 打开界面的Action
    private mCloseActionState: Tween<Node> | null = null;   // 关闭界面的Action

    private mOpenDelayHandle: noxScheduler.TimerID = null;                  // 打开界面的延迟调用句柄
    private mEnterDelayHandle: noxScheduler.TimerID = null;                 // 进入界面的延迟调用句柄
    private mAutoRemoveTimeCallback: noxScheduler.TimerID | null = null;    // 界面关闭时是否自动销毁定时回调
    private mShowViewCallback: ((view: NoxView) => void) | null = null;     // 显示视图的回调
    private mHideViewCallback: ((view: NoxView) => void) | null = null;     // 隐藏视图的回调

    private mOutsideClickCallback: (() => void) | null = null;

    private mAttachedScene: NoxScene | null = null;                   // 获得所属的场景

    private mCompletedCountAssest: number = 0;       // 记录加载完成的数量
    private mTotalCountAssest: number = 0;           // 记录加载要完成的数量

    constructor(viewType: ViewType) {
        super();
        this.mViewType = viewType;
        this.mContainerNode = noxcc.createNodeAndFullSize();
        this.mContainerNode.addComponent(BlockInputEvents);
        this.mContainerNode.active = false;
        this.mBlockNode = noxcc.createNodeAndFullSize();
        this.mBlockNode.addComponent(BlockInputEvents);
        this.mBlockNode.active = false;
        noxcc.setZOrder(this.mBlockNode, 100);
        noxcc.addChild(this.mContainerNode, this.mBlockNode);
    }

    // 清除所有数据, 此对象不会再使用, 或者放回池中
    onRelease(): void {
    }

    protected getLoadAssetsTable(): AssetsTable {
        return {};
    }

    protected getCleanupAssetsTable(): AssetsTable {
        return {};
    }

    // 加载界面时的调用
    public onInitWidget(): void {
    }

    //销毁界面时的调用
    public onReleaseWidget(): void {
    }

    //界面打开后的调用
    public onOpened(): void {
    }

    //界面打开后的调用(延迟调用)
    public onOpenedDelay(): void {
    }

    //界面关闭前的调用
    public onClosed(): void {
    }

    //界面被激活时的调用, 所属场景变为当前场景时会触发
    public onEnter(): void {
    }

    //界面被激活时的调用, 所属场景变为当前场景时会触发(延迟调用)
    public onEnterDelay(): void {
    }

    //界面失去激活时的调用, 所属场景不作为当前运行场景时会触发
    public onExit(): void {
    }

    //每帧调用(真正可见状态时)
    public onUpdate(dt: number): void {
    }

    // 界面开始显示, 此操作之后界面可能在开始加载或播放打开动画
    // 不要在此处触发流程控制逻辑
    public onOpening(): void {
    }

    // 界面开始隐藏, 此操作之后界面可能在播放关闭动画
    // 不要在此处触发流程控制逻辑
    public onClosing(): void {
    }

    //界面淡入动画开始
    protected onFadeInBegin(): void {
    }

    //界面淡入动画结束
    protected onFadeInEnd(canceled: boolean): void {
    }

    //界面淡出动画开始
    protected onFadeOutBegin(): void {
    }

    //界面淡出动画结束
    protected onFadeOutEnd(canceled: boolean): void {
    }

    // 被添加到视图中
    public onAttachViewCanvas(): void {
        var sceneNode = this.getAttachedScene().getSceneNode();
        this.mContainerNode.active = false;
        noxcc.setParent(this.mContainerNode, null);
        noxcc.setZOrder(this.mContainerNode, this.calcZOrder());
        noxcc.addChild(sceneNode, this.mContainerNode);
        (this.mContainerNode.getComponent(Widget) as Widget).updateAlignment();
    }

    // 从视图中移除
    public onDetachViewCanvas(): void {
        noxcc.setParent(this.mContainerNode, null);
    }

    // 创建打开界面的Action
    protected prepareOpenAction(): Tween<Node> | null {
        return null;
    }

    // 创建关闭界面的Action
    protected prepareCloseAction(): Tween<Node> | null {
        return null;
    }

    //载入界面资源
    public loadPrefab(): void {
        let self = this;

        if (!self.mPrefabLoading) {
            if (self.mViewType.resPath) {
                self.mPrefabLoading = true;
                let resPath = nox.pathJoin(ResConfig.viewPath, self.mViewType.resPath);
                NoxViewMgr.addScreenBlock();
                ActiveIndicator.showLoading();
                NoxResMgr.loadAssetsTable(this.getLoadAssetsTable(), (errors: Error[]) => {
                    if (errors.length > 0) {
                        cc_assert(false, "load asset failed: " + errors[0].message);
                    }
                    NoxResMgr.loadPrefabAsync(resPath, function (err: Error | null, prefab: Prefab) {
                        ActiveIndicator.hideLoading();
                        NoxViewMgr.removeScreenBlock();
                        cc_assert(prefab, "load root failed: " + resPath);

                        self.mPrefabLoading = false;
                        CC_DEBUG && nox.log("资源加载完成:" + resPath);

                        if (self.node) {
                            return;
                        }

                        // 确保需要实例化节点的情况
                        if (self.mViewState == NoxViewState.Opening) {
                            var node = noxcc.instantiate(prefab);
                            noxcc.addComponentInstance(node, self);
                            self.processRootLoaded();
                        }
                    }, function (completedCount: number, totalCount: number, item: any) {
                        self.mCompletedCountAssest = completedCount;
                        self.mTotalCountAssest = totalCount;
                        if (self.mTotalCountAssest != 0) {
                            cc_log(" load assest : " + self.mCompletedCountAssest + "/" + self.mTotalCountAssest);
                        }
                    });
                });
            }
            else {
                var node = noxcc.createNode();
                noxcc.addComponentInstance(node, self);
                self.processRootLoaded();
            }
        }
    }

    public getCompletedCountAssest() {
        return this.mCompletedCountAssest;
    }

    public getTotalCountAssest() {
        return this.mTotalCountAssest;
    }

    //获取当前view加载的进度， 如果场景有加载多个 view， 各个scene 应自行计算
    public getLoadingProcess(): number {
        if (this.mTotalCountAssest > 0) {
            let process = this.mCompletedCountAssest / this.mTotalCountAssest;
            if (process >= 1.0) {
                process = 1.0;
            }
            return process;
        }
        return 0;
    }

    public processRootLoaded(): void {
        this.mContainerNode.active = false;
        this.node.active = false;
        noxcc.addChild(this.mContainerNode, this.node);
        this.onInitWidget();
        if (this.mViewState == NoxViewState.Opening) {
            this.initView();
        }
        else {
            CC_DEBUG && cc_assert(false, "fatal error");
        }
    }

    private stopOpenAnim(): void {
        let self = this;
        if (self.mOpenAnimState) {
            let openAnimState = self.mOpenAnimState;
            self.mOpenAnimState = null;
            openAnimState.stop();
            self.updateBlock();
            cc_assert(false, "need test"); // 此处要考虑stop时会不会触发finished事件
            self.onFadeInEnd(true);
        }
        if (self.mOpenActionState) {
            let openActionState = self.mOpenActionState;
            self.mOpenActionState = null;
            openActionState.stop();
            self.updateBlock();
            self.onFadeInEnd(true);
        }
    }

    private stopCloseAnim(): void {
        let self = this;
        if (self.mCloseAnimState) {
            let closeAnimState = self.mCloseAnimState;
            self.mCloseAnimState = null;
            closeAnimState.stop();
            self.mHideViewCallback = null;
            cc_assert(false, "need test"); // 此处要考虑stop时会不会触发finished事件
            self.updateBlock();
            self.onFadeOutEnd(true);
            self.onCloseAnimEnd(true);
        }
        if (self.mCloseActionState) {
            let closeActionState = self.mCloseActionState;
            self.mCloseActionState = null;
            closeActionState.stop();
            self.mHideViewCallback = null;
            self.updateBlock();
            self.onFadeOutEnd(true);
            self.onCloseAnimEnd(true);
        }
    }

    // 显示视图, 业务层不要使用
    public doShowView(scene: NoxScene): void {
        let self = this;

        self.mHideViewCallback = null;

        self.stopCloseAnim();

        // 保存显示回调
        if (self.mViewState < NoxViewState.Opening) {
            self.mViewState = NoxViewState.Opening;

            self.mAttachedScene = scene;
            this.onAttachViewCanvas();

            self.onOpening();

            if (self.node) {
                self.initView();
            }
            else {
                // 进入节点加载状态
                self.loadPrefab();
            }
        }
    }

    // 隐藏视图, 业务层不要使用
    public doHideView(noCleanup?: boolean, ignoreAnim?: boolean): void {
        let self = this;

        self.mShowViewCallback = null;

        // 打开动画和动作需要取消
        self.stopOpenAnim();

        // 保存隐藏回调
        if (self.mViewState >= NoxViewState.Opening) {
            self.mViewState = NoxViewState.Closing;
            self.mAttachedScene = null;
            self.onClosing();
            self.playCloseAnim(noCleanup, ignoreAnim);
            self.removeTimeoutCallback();
        }
        // 有动画的情况
        else if (ignoreAnim && (this.mCloseAnimState || this.mCloseActionState)) {
            self.stopCloseAnim();
            if (!noCleanup) {
                self.doCleanup();
            }
        }
        else if (!noCleanup) {
            if (!(this.mCloseAnimState || this.mCloseActionState)) {
                self.hideViewReal();
                self.doCleanup();
            }
            else {
                //? 动画中没办法改变cleanup的行为
                //cc_assert(false, "fatal error");
            }
        }
    }

    // 取消激活视图, 业务层不要使用
    public doDeactiveView(): void {
        this.stopOpenAnim();
        this.stopCloseAnim();
        if (this.mIsRunning) {
            this.mIsRunning = false;
            noxScheduler.unscheduleTimeout(this.mEnterDelayHandle);
            this.mEnterDelayHandle = null;
            this.onExit();
            this.node.active = false;
        }
    }

    // 激活视图, 业务层不要使用
    public doActiveView(): void {
        if (this.mViewState >= NoxViewState.Opening && this.node) {
            if (!this.mIsRunning) {
                this.mIsRunning = true;
                let widget = this.node.getComponent(Widget);
                if (widget) {
                    widget.updateAlignment();
                }
                this.node.active = true;
                this.onEnter();
                this.mEnterDelayHandle = noxScheduler.scheduleTimeout(() => { this.onEnterDelay(); }, 0);
                this.playOpenAnim();
            }
        }
    }

    // 显示视图
    protected showView(ignoreAnim?: boolean, callback?: (view: NoxView) => void): void {
        let self = this;
        if (self.mViewState < NoxViewState.Opening) {
            this.mHideViewCallback = null;
            this.mShowViewCallback = callback || null;
            NoxViewMgr.addView(this);
        }
        else {
            NoxViewMgr.makeAsTopView(this);
        }
    }

    // 隐藏视图, noCleanup为true时代表不销毁节点, ignoreAnim代表不播放动画
    protected hideView(noCleanup?: boolean, ignoreAnim?: boolean, callback?: (view: NoxView) => void) {
        let self = this;
        if (self.mViewState >= NoxViewState.Opening) {
            this.mShowViewCallback = null;
            this.mHideViewCallback = callback || null;
            NoxViewMgr.removeView(this, noCleanup, ignoreAnim);
        }
        else if (ignoreAnim || !noCleanup) {
            this.mShowViewCallback = null;
            this.mHideViewCallback = callback || null;
            self.doHideView(noCleanup, ignoreAnim);
        }
    }

    //如果有动画播放关闭动画，真实关闭界面
    private hideViewReal(): void {
        let self = this;

        CC_DEBUG && cc_assert(self.mViewState < NoxViewState.Opening, "fatal error");
        CC_DEBUG && cc_assert(!self.mOpenAnimState && !self.mOpenActionState, "fatal error");

        let hideCallback = self.mHideViewCallback;
        self.mHideViewCallback = null;

        self.removeTimeoutCallback();

        if (self.node) {
            self.doDeactiveView();
            if (self.mViewState == NoxViewState.Closing) {
                self.mViewState = NoxViewState.Closed;
                noxScheduler.unscheduleTimeout(this.mOpenDelayHandle);
                self.mOpenDelayHandle = null;
                self.onClosed();
            }
            else {
                CC_DEBUG && cc_assert(self.mViewState == NoxViewState.Closed, "fatal error");
            }
            self.mContainerNode.active = false;
        }

        hideCallback && hideCallback(this);
    }

    public doCleanup(): void {
        // 必须先调用回调，再销毁，因为销毁之后，成员变量被清空了
        if (this.node) {
            this.onReleaseWidget();
        }

        if (this.mContainerNode) {
            this.onRelease();
        }

        if (this.mContainerNode) {
            cc_assert(this.mContainerNode != null && this.node.parent == this.mContainerNode);
            this.mContainerNode.destroy();
            this.mContainerNode._destroyImmediate();
            cc_assert(this.mContainerNode == null && this.node == null);
        }
    }

    public playOpenAnim() {
        let self = this;

        var openAction = null;

        if (self.mOpenAnim) {
            // 动画在播时不做任何事
            if (!self.mOpenAnimState) {
                let anim = noxcc.getAnimation(self.node);
                if (anim) {
                    anim.play(self.mOpenAnim);
                    var openAnimState = self.mOpenAnimState = anim.getState(self.mOpenAnim);
                    self.updateBlock();
                    self.onFadeInBegin();
                    self.mOpenAnimState.once('finished', function () {
                        if (self.mOpenAnimState == openAnimState) {
                            self.mOpenAnimState = null;
                            self.updateBlock();
                            self.onFadeInEnd(false);
                            self.onOpenAnimEnd();
                        }
                    });
                }
                else {
                    self.onFadeInBegin();
                    self.onFadeInEnd(false);
                    self.onOpenAnimEnd();
                }
            }
            else {
                // 动作在播时不做任何事
            }
        }
        // 注意必须一步完成下面代码
        else if (null != (openAction = self.mOpenAction ? self.mOpenAction.clone(self.node) : self.prepareOpenAction())) {
            if (self.mOpenActionState == null) {
                let action = cc_tween(self.node).then(openAction).call(
                    () => {
                        if (self.mOpenActionState == action) {
                            self.mOpenActionState = null;
                            self.updateBlock();
                            self.onFadeInEnd(false);
                            self.onOpenAnimEnd();
                        }
                    }
                );
                self.updateBlock();
                self.onFadeInBegin();
                self.mOpenActionState = action.start();
            }
            else {
                // 动作在播时不做任何事
            }
        }
        else {
            self.onFadeInBegin();
            self.onFadeInEnd(false);
            self.onOpenAnimEnd();
        }
    }

    public playCloseAnim(noCleanup?: boolean, ignoreAnim?: boolean): void {
        let self = this;
        if (self.node) {
            let closeAction = null;
            if (self.mCloseAnim && !ignoreAnim) {
                let anim = noxcc.getAnimation(self.node);
                if (anim) {
                    anim.play(self.mCloseAnim);
                    var closeAnimState = self.mCloseAnimState = anim.getState(self.mCloseAnim);
                    self.updateBlock();
                    self.onFadeOutBegin();
                    self.mCloseAnimState.once("finished", function () {
                        if (self.mCloseAnimState == closeAnimState) {
                            self.mCloseAnimState = null;
                            self.updateBlock();
                            self.onFadeOutEnd(false);
                            self.onCloseAnimEnd(false);
                            if (!noCleanup) {
                                self.doCleanup();
                            }
                        }
                    });
                }
                else {
                    self.onFadeOutBegin();
                    self.onFadeOutEnd(false);
                    self.onCloseAnimEnd(false);
                    if (!noCleanup) {
                        self.doCleanup();
                    }
                }
            }
            else if (!ignoreAnim && null != (closeAction = self.mCloseAction ? self.mCloseAction.clone(self.node) : self.prepareCloseAction())) {
                let action = cc_tween(self.node).then(closeAction).call(() => {
                    if (self.mCloseActionState == action) {
                        self.mCloseActionState = null;
                        self.updateBlock();
                        self.onFadeOutEnd(false);
                        self.onCloseAnimEnd(false);
                        if (!noCleanup) {
                            self.doCleanup();
                        }
                    }
                });
                self.updateBlock();
                self.onFadeOutBegin();
                self.mCloseActionState = action.start();
            }
            else {
                self.onFadeOutBegin();
                self.onFadeOutEnd(false);
                self.onCloseAnimEnd(false);
                if (!noCleanup) {
                    self.doCleanup();
                }
            }
        }
        else {
            self.onFadeOutBegin();
            self.onFadeOutEnd(false);
            self.onCloseAnimEnd(false);
            if (!noCleanup) {
                self.doCleanup();
            }
        }
    }

    // 界面完全就绪之后要做的事情, 注意可能会被多次调用
    private onOpenAnimEnd(): void {
        let self = this;
    }

    // 界面在完全消失之前要做的事情, 注意可能会被多次调用
    private onCloseAnimEnd(canceled: boolean): void {
        let self = this;
        if (self.mViewState < NoxViewState.Opening) {
            self.hideViewReal();
        }
        else {
            CC_DEBUG && cc_assert(false, "fatal error");
        }
    }

    private initView(): void {
        let self = this;

        //noxcc.setActive(self.mContainerNode, !self.mIsDeactivated);
        CC_DEBUG && cc_assert(self.mViewState == NoxViewState.Opening, "fatal error");

        self.mContainerNode.active = true;
        self.mViewState = NoxViewState.Opened;
        self.onOpened();
        self.mOpenDelayHandle = noxScheduler.scheduleTimeout(() => { this.onOpenedDelay(); }, 0);

        if (self.getAttachedScene() == NoxViewMgr.getRunningScene()) {
            self.doActiveView();
        }

        self.mShowViewCallback && self.mShowViewCallback(this);
    }

    private removeTimeoutCallback(): void {
        let self = this;
        // 特别注意这个函数在doCleanup之后会被调用，而实际上这个类是个组件类
        // 组件类被销毁时，成员变量都被清空了。该死的cocos设计。
    }

    public suspendView(): void {
    }

    public resumeView(): void {
    }

    public updateBlock(): void {
        if (this.mOpenAnimState || this.mOpenActionState) {
            this.mBlockNode.active = true;
        }
        else if (this.mCloseAnimState || this.mCloseActionState) {
            this.mBlockNode.active = true;
        }
        else {
            this.mBlockNode.active = false;
        }
    }

    public addOutsideClick(callback: () => void): void {
        var self = this;

        var outsideClickNode = noxcc.findNode("anyClick", this.mContainerNode);
        if (outsideClickNode == null) {
            var node = noxcc.createNode(cc_size(4096, 4096));
            noxcc.setTag(node, "anyClick");
            noxcc.setZOrder(node, 0);
            noxcc.addChild(this.mContainerNode, node);
        }
        this.mOutsideClickCallback = callback;

        outsideClickNode.targetOff(this);
        outsideClickNode.on(Node.EventType.TOUCH_END, function (event: EventTouch) {
            var pos = noxcc.getLocationInNodeFromTouch(event, self.node);
            if (!noxcc.arect(self.node).contains(pos)) {
                self.mOutsideClickCallback && self.mOutsideClickCallback();
            }
        }, this, false);
    }

    public getViewType(): ViewType {
        return this.mViewType;
    }

    public isClose(): boolean {
        return this.mViewState <= NoxViewState.Closing;
    }

    public isClosing(): boolean {
        return this.mViewState == NoxViewState.Closing;
    }

    public isClosed(): boolean {
        return this.mViewState <= NoxViewState.Closed;
    }

    public isOpen(): boolean {
        return this.mViewState >= NoxViewState.Opening;
    }

    public isOpening(): boolean {
        return this.mViewState == NoxViewState.Opening;
    }

    public isOpened(): boolean {
        return this.mViewState >= NoxViewState.Opened;
    }

    public isLoading(): boolean {
        // 可见, 但节点还在加载中
        return this.mViewState >= NoxViewState.Opening && cc_isValid(this.node) && this.mPrefabLoading;
    }

    public isRunning(): boolean {
        return this.mIsRunning;
    }

    public isPlayOpeningAnim(): boolean {
        return this.mOpenAnimState != null || this.mOpenActionState != null;
    }

    public isSuspendable(): boolean {
        return this.isForm();
    }

    public isWholeScreen(): boolean {
        return (this.mViewType.flags & ViewFlag.FullScreen) != 0;
    }

    public isForm(): boolean {
        return (this.mViewType.flags & ViewFlag.Form) != 0;
    }

    public calcZOrder(): number {
        return this.mViewType.module/* + this.mViewType.hierarchy*/;
    }

    // 不要将其改成public
    protected getSceneNode(): Node | null {
        return this.mContainerNode.parent;
    }

    // 获得容器节点，目前来说就是其父节点
    protected getContainerNode(): Node {
        return this.mContainerNode;
    }

    protected getAttachedScene(): NoxScene {
        return this.mAttachedScene as NoxScene;
    }
}
