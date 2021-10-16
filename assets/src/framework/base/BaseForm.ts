import { Node, Tween, TweenSystem } from "cc";
import { cc_tween, cc_v3 } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxTime } from "../core/noxTime";
import { ViewType } from "../view/NoxView";
import { BasePanel } from "./BasePanel";

export class BaseForm extends BasePanel {
    protected constructor(viewType: ViewType) {
        super(viewType);
    }

    protected prepareOpenAction(): Tween<Node> | null {
        var self = this;
        if (TweenSystem.instance.ActionManager.getNumberOfRunningActionsInTarget(self.node) == 0) {
            var dstPos = self.node.getPosition();
            self.node.setPosition(dstPos.x, noxcc.abottom(self.node.parent as Node) - noxcc.h(self.node));
            return cc_tween(self.node).to(
                noxTime.absTime(BaseForm.ACTION_DURATION),
                { position: dstPos },
                { easing: "backOut" }
            );
        }
        return null;
    }

    protected prepareCloseAction(): Tween<Node> | null {
        var self = this;
        if (TweenSystem.instance.ActionManager.getNumberOfRunningActionsInTarget(self.node) == 0) {
            var dstPos = cc_v3(
                self.node.position.x,
                noxcc.abottom(self.node.parent as Node) - noxcc.h(self.node),
                self.node.position.z,
            );
            return cc_tween(self.node).to(
                noxTime.absTime(BaseForm.ACTION_DURATION),
                { position: dstPos },
                { easing: "backIn" }
            );
        }
        return null;
    }

    //界面淡入动画开始
    onFadeInBegin(): void {
        super.onFadeInBegin();
        this.onShowActionStart();
    }

    //界面淡入动画结束
    onFadeInEnd(canceled: boolean): void {
        this.onShowActionFinished();
        super.onFadeInEnd(canceled);
    }

    //界面淡出动画开始
    onFadeOutBegin(): void {
        super.onFadeOutBegin();
        this.onHideActionStart();
    }

    //界面淡出动画结束
    onFadeOutEnd(canceled: boolean): void {
        this.onHideActionFinished();
        super.onFadeOutEnd(canceled);
    }

    protected onShowActionStart(): void {
    }

    protected onShowActionFinished(): void {
    }

    protected onHideActionStart(): void {
    }

    protected onHideActionFinished(): void {
    }
}

export module BaseForm {
    export const ACTION_DURATION = 0.3;
}
