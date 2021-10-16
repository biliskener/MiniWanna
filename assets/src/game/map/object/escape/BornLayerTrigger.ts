import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledLayer, TiledMap, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

type BornLayerTriggerParams = {
    targetLayers: string
}

// 出生点的层触发器，比较特殊

@ccclass
@disallowMultiple
export class BornLayerTrigger extends BaseObject {
    private params: BornLayerTriggerParams;

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        var state = GameData.INSTANCE.savedData.getObjectState(this.map.levelName, this.node.name);
        if (!state) {
            noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
            GameData.INSTANCE.savedData.setObjectState(this.map.levelName, this.node.name, 1);
            this.map.deferredActivateNode(this.node, false);
            // 平台消失
            let layerNames = this.params.targetLayers.split("|");
            for (let layerName of layerNames) {
                let layer = this.map.getTiledMap().getLayer(layerName)
                cc_assert(layer, layerName);
                this.map.deferredActivateNode(layer.node, false);
            }
        }
    }
}
