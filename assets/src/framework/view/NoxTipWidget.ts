import { Node } from "cc";
import { ZOrder } from "../const/ZOrder";
import { cc_assert, CC_DEBUG, cc_v2 } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { NoxComponent } from "../core/NoxComponent";
import { NoxViewMgr } from "./NoxViewMgr";

// 提示信息窗口
export class NoxTipWidget extends NoxComponent {
    static gCurrentTipWidget: NoxTipWidget | null = null;

    public constructor() {
        super();
    }

    protected onLoad(): void {
        super.onLoad();
        noxcc.setZOrder(this.node, ZOrder.tip);
    }

    protected onEnable(): void {
        super.onEnable();

        NoxTipWidget.hideCurrentTipWidget();
        NoxTipWidget.gCurrentTipWidget = this;
    }

    protected onDisable(): void {
        CC_DEBUG && cc_assert(NoxTipWidget.gCurrentTipWidget == this, "gCurrentTipWidget dismatch");
        NoxTipWidget.gCurrentTipWidget = null;
        super.onDisable();
    }

    public show(sourceNode?: Node, yGap?: number): void {
        let self = this;

        CC_DEBUG && cc_assert(noxcc.ax(this.node) == 0.5 && noxcc.ay(this.node) == 0.5, "impossible");

        var hw = noxcc.w(this.node) / 2;
        var hh = noxcc.h(this.node) / 2;

        var parent = this.getTargetParent();
        if (sourceNode) {
            var lPos = cc_v2(noxcc.cx(sourceNode), noxcc.atop(sourceNode)).add2f(0, hh + (yGap ?? 6));
            var gPos = noxcc.convertPosAR(lPos, sourceNode, parent);
            if (gPos.x - hw < noxcc.aleft(parent)) {
                gPos.x = hw + noxcc.aleft(parent);
            }
            else if (gPos.x + hw > noxcc.aright(parent)) {
                gPos.x = noxcc.aright(parent) - hw;
            }

            if (gPos.y + hh > noxcc.atop(parent)) {
                gPos.y = noxcc.atop(parent) - hh;
            }
            else if (gPos.y - hh < noxcc.abottom(parent)) {
                gPos.y = hh + noxcc.abottom(parent);
            }
            this.node.setPosition(gPos.x, gPos.y);
        }

        parent.addChild(this.node);
    }

    public hide(): void {
        let self = this;
        this.node.destroy();
    }

    public getTargetParent(): Node {
        return NoxViewMgr.getRunningScene().getSceneNode();
    }

    // 隐藏当前的提示信息窗口
    public static hideCurrentTipWidget(): void {
        if (NoxTipWidget.gCurrentTipWidget) {
            NoxTipWidget.gCurrentTipWidget.hide();
        }
    }
}
