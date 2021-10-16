import { GameData } from "../../data/GameData";
import { _decorator } from "cc";
import { cc_tween } from "../../../framework/core/nox";
import { BaseObject } from "./BaseObject";

type LayerVisibilityParams = {
    initInvisible?: boolean,    // 初始时时否不可见
    startDelay?: number,        // 转场开始的停顿时间
    stopDelay: number,          // 转场结束的停顿时间
}

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class LayerVisibility extends BaseObject {
    private params: LayerVisibilityParams;

    start(): void {
        if (this.params) {
            this.syncState();
        }
    }

    private syncState(): void {
        var state = GameData.INSTANCE.savedData.getObjectState(this.map.levelName, this.node.name);
        if (this.params.initInvisible) {
            this.map.deferredActivateNode(this.node, !!state);
        }
        else {
            this.map.deferredActivateNode(this.node, !state);
        }
    }

    doTransition(callback: () => any) {
        if (!this.params) {
            callback && callback();
            return;
        }

        var startDelay = this.params.startDelay || 0;
        var stopDelay = this.params.stopDelay || 0;
        var updateCallback = () => {
            if (this.params.initInvisible) {
                this.map.deferredActivateNode(this.node, true);
            }
            else {
                this.map.deferredActivateNode(this.node, false);
            }
        };

        var doneCallback = () => {
            GameData.INSTANCE.savedData.setObjectState(this.map.levelName, this.node.name, 1);
            this.syncState();
            callback && callback();
        };

        if (startDelay || stopDelay) {
            cc_tween(this.node)
                .delay(startDelay).call(updateCallback)
                .delay(stopDelay).call(doneCallback)
                .start();
        }
        else {
            updateCallback();
            doneCallback();
        }
    }
}
