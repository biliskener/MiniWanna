import { Button, Director, Node, Tween, UIOpacity, Widget } from "cc";
import { GuideConfig } from "../config/GuideConfig";
import { ZOrder } from "../const/ZOrder";
import { cc_assert, cc_director, cc_isValid, cc_tween } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxEvent1, noxListenerBase } from "../core/noxEvent";
import { noxScheduler } from "../core/noxScheduler";
import { BlurredLayer } from "../ui/BlurredLayer";
import { NoxTipWidget } from "../view/NoxTipWidget";
import { NoxView, ViewType } from "../view/NoxView";
import { NoxViewMgr } from "../view/NoxViewMgr";

const GUIDE_ACTION_TAG = 10234;

const ENABLE_PANEL_BG: boolean = true;
const OPTIMIZE_PANEL_BG: boolean = true;
const ALONE_PANEL_BG: boolean = true;

function setVisibleEx(node: Node, visible: boolean): void {
    noxcc.setNodeOpacity(node, visible ? 255 : 0);
}

function isVisibleEx(node: Node): boolean {
    let tf = node.getComponent(UIOpacity);
    return tf ? tf.opacity != 0 : true;
}

export class BasePanel extends NoxView {
    public static Event = {
        TopPanelDirty: new noxEvent1<BasePanel>(),
        CheckGuide: new noxEvent1<BasePanel>(),
    };

    private static DEFAULT_MASK_OPACITY = 192;
    private static Panels: BasePanel[] = [];
    private static _isBlurring: boolean = false;
    private static _blurredBg: BlurredLayer = null as any as BlurredLayer;

    public static hideTopMost(): void {
        NoxTipWidget.hideCurrentTipWidget();
    }

    private _anyClickClose: boolean = false;        // 为true时, 点击任意处会关闭
    private _hideBelow: boolean = true;             // 为true时，代表要隐藏自己下面的界面
    private _showBlurBg: boolean = true;            // 为true时, 代表有Blur背景
    private _isNeedTransparent: boolean = false;    // 背景是否透明
    private _blurListener: noxListenerBase = null as any as noxListenerBase;

    protected _panelName: string = "";              // 面板的名称
    public _isShowResourceUI: boolean = false;      // 是否显示资源界面
    protected _showAction: Tween<Node> = null as any as Tween<Node>;

    protected constructor(viewType: ViewType) {
        super(viewType);
    }

    onInitWidget(): void {
        super.onInitWidget();
        var container = this.getContainerNode() as Node;
        container.addComponent(Button);
        container.on("click", this.onOutsideClick, this);
    }

    onReleaseWidget(): void {
        var container = this.getContainerNode() as Node;
        container.removeComponent(Button);
        container.off("click", this.onOutsideClick, this);
        super.onReleaseWidget();
    }

    //界面打开时的调用
    onEnter(): void {
        super.onEnter();

        if (ENABLE_PANEL_BG) {
            if (OPTIMIZE_PANEL_BG) {
                BasePanel.delayCheckPanels();
            }
            else {
                this._blurListener = BlurredLayer.director_after_blur.addListener(this, this.afterBlur);
                if (this._showBlurBg) {
                    BasePanel.updateBg();
                }
                else {
                    BasePanel.updatePanels();
                }
            }
        }
        if (this._showAction) {
            this._showAction.clone(this.node).start();
        }
    }

    //界面关闭时的调用
    onExit(): void {
        if (ENABLE_PANEL_BG) {
            if (!ALONE_PANEL_BG) {
                if (BasePanel._blurredBg.node.parent == this.getContainerNode()) {
                    noxcc.setParent(BasePanel._blurredBg.node, null);
                }
            }

            if (OPTIMIZE_PANEL_BG) {
                BasePanel.delayCheckPanels();
            }
            else {
                this._blurListener.remove();
                this._blurListener = null as any as noxListenerBase;
                if (this._showBlurBg) {
                    BasePanel.updateBg();
                }
            }
        }

        Tween.stopAllByTag(GUIDE_ACTION_TAG, this.node);
        super.onExit();
    }

    onFadeInEnd(canceled: boolean): void {
        super.onFadeInEnd(canceled);

        this.delayCheckGuide();
    }

    private onOutsideClick(): void {
        if (this._anyClickClose) {
            this.hide();
        }
    }

    public delayCheckGuide(): void {
        if (GuideConfig.isEnableGuide()) {
            Tween.stopAllByTag(GUIDE_ACTION_TAG, this.node);
            var action = cc_tween(this.node).delay(0).call(() => {
                BasePanel.Event.CheckGuide.dispatchEvent(this);
                this.checkGuide();
            });
            action.tag(GUIDE_ACTION_TAG);
            action.start();
        }
    }

    public checkGuide(): void {
    }

    private static getRunningPanels(): BasePanel[] {
        var views: NoxView[] = NoxViewMgr.getRunningScene().getAllViews();
        var panels = [];
        for (var i = 0; i < views.length; ++i) {
            var view = views[i];
            if (view.isRunning() && view instanceof BasePanel) {
                panels.push(view);
            }
        }
        return panels;
    }

    private static updateBg(): void {
        if (ALONE_PANEL_BG) {
            if (cc_isValid(BasePanel._blurredBg)) {
                noxcc.setParent(BasePanel._blurredBg.node, null);
            }
            else {
                var blurredBg = BlurredLayer.create(BasePanel.DEFAULT_MASK_OPACITY);
                //blurredBg.getComponent(cc.RenderComponent).srcBlendFactor = cc.macro.BlendFactor.ONE;
                //blurredBg.getComponent(cc.RenderComponent).dstBlendFactor = cc.macro.ONE_MINUS_SRC_ALPHA;
                BasePanel._blurredBg = blurredBg;

                noxcc.getOrAddComponent(blurredBg.node, Widget);
            }
        }

        BasePanel.Panels = BasePanel.getRunningPanels();

        // 1.当前场景的所有层设置为不可见, 除了引导层和底层
        var parent = NoxViewMgr.getRunningScene().getSceneNode();
        var children = parent.children;
        for (var i = 1; i < children.length; ++i) {
            var child = children[i];
            var zOrder = noxcc.getZOrder(child);
            if (zOrder != ZOrder.ui && zOrder != ZOrder.toast) {
                setVisibleEx(child, zOrder < ZOrder.guide_begin || zOrder > ZOrder.guide_end);
            }
        }

        // 2.所有的层设置为不可见, 然后找到有背景的顶层
        var topPanelWithBg = null;
        for (i = BasePanel.Panels.length - 1; i >= 0; --i) {
            var panel = BasePanel.Panels[i];
            setVisibleEx(panel.getContainerNode() as Node, false);
            if (panel._showBlurBg && (topPanelWithBg == null)/* && !(panel instanceof ActiveIndicator)*/) {
                topPanelWithBg = panel;
            }
        }

        if (!cc_isValid(BasePanel._blurredBg)) {
            BasePanel._blurredBg = null as any as BlurredLayer;
        }

        if (!ALONE_PANEL_BG) {
            if (topPanelWithBg != null) {
                // 3.把背景移交给新的顶层
                if (!BasePanel._blurredBg) {
                    var blurredBg = BlurredLayer.create(BasePanel.DEFAULT_MASK_OPACITY);
                    //blurredBg.getComponent(cc.RenderComponent).srcBlendFactor = cc.macro.BlendFactor.ONE;
                    //blurredBg.getComponent(cc.RenderComponent).dstBlendFactor = cc.macro.ONE_MINUS_SRC_ALPHA;
                    BasePanel._blurredBg = blurredBg;
                    BasePanel._isBlurring = true;
                }
                noxcc.setParent(BasePanel._blurredBg.node, null);
                (topPanelWithBg.getContainerNode() as Node).insertChild(BasePanel._blurredBg.node, 0);
            }
            else {
                // 4.若无顶层则销毁背景
                if (BasePanel._blurredBg) {
                    noxcc.setParent(BasePanel._blurredBg.node, null);
                    BasePanel._blurredBg.node.destroy();
                    BasePanel._blurredBg = null as any as BlurredLayer;
                }
            }
        }

        // 5.若刚添加的顶层, 则更新面板
        if (OPTIMIZE_PANEL_BG || !BasePanel._isBlurring) {
            this.updatePanels();
        }

        if (ALONE_PANEL_BG) {
            if (topPanelWithBg) {
                children = parent.children;
                let topPanelContainer = topPanelWithBg.getContainerNode() as Node;
                let index = children.indexOf(topPanelContainer);
                cc_assert(index >= 0, "fatal error");
                noxcc.setZOrder(BasePanel._blurredBg.node, noxcc.getZOrder(topPanelContainer));
                parent.insertChild(BasePanel._blurredBg.node, index);
            }
        }
    }

    private static updatePanels() {
        BasePanel.Panels = BasePanel.getRunningPanels();

        var panelCount = BasePanel.Panels.length;
        var topPanel = panelCount > 0 ? BasePanel.Panels[panelCount - 1] : null;

        var visiblePanels: BasePanel[] = [];
        if (panelCount > 0) {

            var isVisible = true;
            var opacity = 0;

            for (var i = panelCount - 1; i >= 0; --i) {
                var panel = BasePanel.Panels[i];
                setVisibleEx(panel.getContainerNode() as Node, isVisible);
                if (panel._hideBelow && isVisible) {
                    isVisible = false;
                }

                if (isVisibleEx(panel.getContainerNode() as Node)) {
                    if (panel._hideBelow) {
                        visiblePanels.push(panel);
                    }
                    var backNode = noxcc.findNode("_back_", panel.getContainerNode() as Node);
                    if (backNode) {
                        if (panel._isNeedTransparent) {
                            noxcc.setNodeOpacity(backNode, 0);
                        }
                        else {
                            if (opacity == 0) {
                                opacity = BasePanel.DEFAULT_MASK_OPACITY;
                                noxcc.setNodeOpacity(backNode, opacity);
                            }
                            else {
                                noxcc.setNodeOpacity(backNode, 0);
                            }
                        }
                    }
                }
            }
        }

        if (!topPanel || topPanel.calcZOrder() != ZOrder.indicator && topPanel.calcZOrder() != ZOrder.dialog) {
            BasePanel.Event.TopPanelDirty.dispatchEvent(topPanel as BasePanel);
        }

        var parent = NoxViewMgr.getRunningScene().getSceneNode();
        var children = parent.children;

        var topZOrder = visiblePanels.length > 0 ? visiblePanels[0].calcZOrder() : -1;
        var bottomZOrder = visiblePanels.length > 0 ? visiblePanels[visiblePanels.length - 1].calcZOrder() : -1;
        for (var i = 1; i < children.length; ++i) {
            var child = children[i];
            var zOrder = noxcc.getZOrder(child);
            if (zOrder != ZOrder.ui && zOrder != ZOrder.toast) {
                if (zOrder < bottomZOrder) {
                    setVisibleEx(children[i], false);
                }
                else if (zOrder > topZOrder) {
                    setVisibleEx(children[i], true);
                }
            }
        }
    }

    private afterBlur() {
        // 只让最顶层处理
        if (this == BasePanel.Panels[BasePanel.Panels.length - 1]) {
            BasePanel._isBlurring = false;
            BasePanel.updatePanels();
        }
    }

    public setHideBelow(value: boolean): void {
        this._hideBelow = value;
    }

    public setShowBlurBg(value: boolean): void {
        this._showBlurBg = value;
    }

    public isShowBlurBg(): boolean {
        return this._showBlurBg;
    }

    public setAnyClickClose(value: boolean): void {
        this._anyClickClose = value;
    }

    public isAnyClickClose(): boolean {
        return this._anyClickClose;
    }

    public show(action?: Tween<Node>): void {
        this.showView();
        if (action) {
            this._showAction = action;
        }
    }

    public hide(): void {
        this.hideView();
    }

    private static gCheckPanelsTimerID: noxScheduler.TimerID = null as any as noxScheduler.TimerID;
    private static gAfterUpdateRegistered: boolean = false;
    private static gPanelsNeedCheck: boolean = false;
    private static delayCheckPanels(): void {
        if (false) {
            if (BasePanel.gCheckPanelsTimerID == null) {
                BasePanel.gCheckPanelsTimerID = noxScheduler.scheduleTimeout(function () {
                    BasePanel.gCheckPanelsTimerID = null as any as noxScheduler.TimerID;
                    BasePanel.checkPanels();
                }, 0);
            }
        }
        else {
            BasePanel.gPanelsNeedCheck = true;
            if (!BasePanel.gAfterUpdateRegistered) {
                BasePanel.gAfterUpdateRegistered = true;
                cc_director.on(Director.EVENT_AFTER_UPDATE, function () {
                    if (BasePanel.gPanelsNeedCheck) {
                        BasePanel.gPanelsNeedCheck = false;
                        BasePanel.checkPanels();
                    }
                });
            }
        }
    }

    private static checkPanels(): void {
        BasePanel.updateBg();
    }
}
