import { Collider2D, Contact2DType, IPhysics2DContact, Node, RenderComponent, TiledLayer, TiledMap, UIOpacity, UITransform, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { noxcc } from "../../../../framework/core/noxcc";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class ShowTile extends BaseObject {
    private params: { layer: string, resetTime: number };

    private targetLayer: TiledLayer;
    private resetTime: number;

    start(): void {
        this.targetLayer = this.map.getTiledMap().getLayer(this.params.layer);

        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        if (this.params.resetTime) {
            GameData.INSTANCE.currSavedData.setObjectState(this.map.levelName, this.node.name, 0);
        }
        this.syncState();
    }

    update(dt: number): void {
        if (noxcc.getNodeOpacity(this.node) == 0 && !this.map.isPaused() && this.params.resetTime) {
            this.resetTime += dt;
            if (this.resetTime >= this.params.resetTime) {
                noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
                GameData.INSTANCE.currSavedData.setObjectState(this.map.levelName, this.node.name, 0);
                this.syncState();
            }
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        if (noxcc.getNodeOpacity(this.node) == 255) {
            noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
            GameData.INSTANCE.currSavedData.setObjectState(this.map.levelName, this.node.name, 1);
            this.syncState();
        }
    }

    private syncState(): void {
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.map.levelName, this.node.name);
        this.resetTime = 0;
        this.map.deferredActivateNode(this.targetLayer.node, !!state);
        if (this.params.resetTime) {
            noxcc.setNodeOpacity(this.node, state ? 0 : 255);
        }
        else {
            cc_assert(false);
            this.map.deferredActivateNode(this.targetLayer.node, !state);
        }
    }
}
