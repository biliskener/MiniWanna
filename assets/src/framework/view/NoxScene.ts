import { Node, UITransform } from "cc";
import { cc_assert, CC_DEBUG, cc_isValid } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { NoxTipWidget } from "./NoxTipWidget";
import { NoxView, ViewType } from "./NoxView";
import { NoxViewMgr } from "./NoxViewMgr";

export class NoxScene {
    private mSceneNode: Node = null as any as Node;     // 场景节点
    private mViewStack: NoxView[] = [];                 // 视图栈

    private mTipTopLayer: Node | null = null;
    private mTipLinkNodes: Node[] = [];

    public constructor() {
    }

    // 场景节点被创建之后触发
    protected onCreate(): void {
    }

    // 场景节点被销毁之前触发
    protected onDestroy(): void {
    }

    // 场景被启用(添加到视图中)
    protected onEnter(): void {
    }

    // 场景被禁用(从视图中移除)
    protected onExit(): void {
    }

    // 场景被挂起(失去顶层场景的身份)
    protected onSuspend(): void {
    }

    // 场景被恢复(重新作为顶层场景的身份)
    protected onResume(): void {
    }

    public create(): void {
        if (this.mSceneNode == null) {
            let parentNode: Node = NoxViewMgr.getRoot();

            this.createSceneNode(parentNode);

            //this.createTipLayer(parentNode);

            this.onCreate();
        }
    }

    public destroy(): void {
        if (this.mSceneNode) {
            CC_DEBUG && cc_assert(this.mSceneNode.parent == null, "fatal error");
            this.onDestroy();
            while (this.mViewStack.length) {
                var view = this.mViewStack[this.mViewStack.length - 1];
                this.removeView(this.mViewStack[this.mViewStack.length - 1], false, true);
            }
            noxcc.destroy(this.mSceneNode);
            this.mSceneNode = null as any as Node;
        }
    }

    public enter(): void {
        CC_DEBUG && cc_assert(this.mSceneNode.parent == null, "fatal error");
        noxcc.setParent(this.mSceneNode, NoxViewMgr.getRoot());
        this.activeViews();
        this.onEnter();
    }

    public exit(): void {
        CC_DEBUG && cc_assert(this.mSceneNode.parent != null, "fatal error");
        noxcc.setParent(this.mSceneNode, null);
        this.deactiveViews();
        this.onExit();
    }

    // 当前场景是否正在运行
    public isRunning(): boolean {
        return this.mSceneNode && this.mSceneNode.activeInHierarchy;
    }

    // 取消激活此场景的所有视图
    private deactiveViews(): void {
        for (var i = this.mViewStack.length - 1; i >= 0; --i) {
            var view: NoxView = this.mViewStack[i];
            view.doDeactiveView();
        }
    }

    // 激活此场景的所有视图
    private activeViews(): void {
        for (var i = 0; i < this.mViewStack.length; ++i) {
            var view: NoxView = this.mViewStack[i];
            view.doActiveView();
        }
    }

    public calcViewIndex(view: NoxView) {
        for (var i = 0; i < this.mViewStack.length; ++i) {
            var view2 = this.mViewStack[i];
            if (view.calcZOrder() < view2.calcZOrder()) {
                return i;
            }
        }
        return this.mViewStack.length;
    }

    public findView(typeOrName: ViewType): NoxView {
        for (var i = this.mViewStack.length - 1; i >= 0; --i) {
            var view = this.mViewStack[i];
            if (view.getViewType() == typeOrName) {
                return view;
            }
        }
        return null as any as NoxView;
    }

    public getAllViews(): NoxView[] {
        return this.mViewStack.slice();
    }

    public addView(view: NoxView) {
        NoxTipWidget.hideCurrentTipWidget();

        var index = this.calcViewIndex(view);
        if (index >= this.mViewStack.length) {
            this.mViewStack.push(view);
        }
        else {
            this.mViewStack.splice(index, 0, view);
        }
        view.doShowView(this);
        this.checkAllViewStates();
    }

    public removeView(view: NoxView, noCleanup?: boolean, ignoreAnim?: boolean): void {
        NoxTipWidget.hideCurrentTipWidget();

        var index = this.mViewStack.indexOf(view);
        if (index >= 0) {
            this.mViewStack.splice(index, 1);
            view.doHideView(noCleanup, ignoreAnim);
            this.checkAllViewStates();
        }
    }

    // 检查所有View的挂起状态
    public checkAllViewStates(): void {
        // 可以考虑把BasePanel那一套背景的处理移过来
        /*
        var wholeScreenViewFound: boolean = false;  // 是否发现过全屏界面
        var firstSuspendableFound: boolean = false; // 是否发现过可挂起窗口
        for(var i = this.mViewStack.length - 1; i >= 0; --i) {
            var view = this.mViewStack[i];
            if(wholeScreenViewFound) {
                // 上面有全屏界面时, 自己要隐藏
                view.doDeactiveView();
            }
            else if(firstSuspendableFound) {
                // 上面有Form界面
                if(view.isSuspendable()) {
                    // 自己作为Form时, 自己要隐藏
                    view.doDeactiveView();
                }
                else {
                    // 自己不作为Form时, 自己依然可见
                    view.doActiveView();
                }
            }
            else {
                // 上面没有Form界面时, 自己依然可见
                view.doActiveView();
            }

            wholeScreenViewFound = wholeScreenViewFound || view.isWholeScreen();
            firstSuspendableFound = firstSuspendableFound || view.isSuspendable();
        }
        */
    }

    public makeAsTopView(view: NoxView) {
        var index = this.mViewStack.indexOf(view);
        if (index >= 0) {
            var oldIndex = index;
            this.mViewStack.splice(index, 1);
            index = this.calcViewIndex(view);
            if (index >= this.mViewStack.length) {
                this.mViewStack.push(view);
            }
            else {
                this.mViewStack.splice(index, 0, view);
            }
            if (oldIndex != index) {
                this.checkAllViewStates();
                if (cc_isValid(view.node) && view.isRunning() && !view.isPlayOpeningAnim()) {
                    //view.playOpenAnim();
                }
            }
        }
    }

    private createSceneNode(parentNode: Node): void {
        let node = noxcc.createNodeAndFullSize();
        noxcc.getOrAddComponent(node, UITransform).setContentSize(noxcc.size(parentNode));
        this.mSceneNode = node;
    }

    /*
    private createTipLayer(parentNode: cc.Node): void {
        let node = noxcc.newNode();

        node.setContentSize(parentNode.getContentSize());
        let widget = node.addComponent(cc.Widget);
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.left = 0;
        widget.right = 0;
        widget.top = 0;
        widget.bottom = 0;

        this.mTipTopLayer = node;

        NoxViewMgr.getRoot().addChild(this.mTipTopLayer, ZOrder.tip_touch);

        this.mTipTopLayer.on(cc.Node.EventType.TOUCH_START, this.onTipTouchBegan, this, true);
    }

    private onTipTouchBegan(touch: cc.Event.EventTouch): void {
    }
    */

    public processUpdate(dt: number): void {
        /*
        var views = this.mViewStack.slice(0);
        for (var i = views.length - 1; i >= 0; --i) {
            var view = views[i];
            if (view.isRunning()) {
                view.onUpdate(dt);
            }
        }
        */
    }

    public getSceneNode(): Node {
        return this.mSceneNode;
    }
}
