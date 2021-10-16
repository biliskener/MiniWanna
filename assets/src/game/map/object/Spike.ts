import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, _decorator } from "cc";
import { cc_assert } from "../../../framework/core/nox";
import { ObjectGroup } from "../../const/ObjectGroup";
import { ObjectTag } from "../../const/ObjectTag";
import { GameMap } from "../GameMap";
import { BaseObject } from "./BaseObject";
import { Player } from "./Player";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Spike extends BaseObject {
    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            otherCollider.getComponent(Player).isDying = true;
        }
    }
}
