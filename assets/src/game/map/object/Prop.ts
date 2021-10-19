import { GameData } from "../../data/GameData";
import { Collider2D, Contact2DType, IPhysics2DContact, Node, _decorator } from "cc";
import { ObjectTag } from "../../const/ObjectTag";
import { BaseObject } from "./BaseObject";
import { noxSound } from "../../../framework/core/noxSound";
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Prop extends BaseObject {
    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.syncState();
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.map.levelName, this.node.name);
        if (!state) {
            noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
            GameData.INSTANCE.currSavedData.setObjectState(this.map.levelName, this.node.name, 1)
            GameData.INSTANCE.currSavedData.addPropCount();
            this.syncState();
        }
    }

    private syncState(): void {
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.map.levelName, this.node.name);
        this.map.deferredActivateNode(this.node, !state);
    }
}
