import { Collider2D, Contact2DType, IPhysics2DContact, Node, Tween, Vec3, _decorator } from "cc";
import { ObjectTag } from "../../../const/ObjectTag";
import { BaseObject } from "../BaseObject";
import { LevelScript28A } from "./LevelScript28A";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class LevelScript28B extends BaseObject {
    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.getComponent(Collider2D).on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        LevelScript28A.CURRENTON.touchingFinalPlatform = true;
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        LevelScript28A.CURRENTON.touchingFinalPlatform = false;
    }
}
