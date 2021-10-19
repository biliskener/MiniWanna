import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { noxcc } from "../../../../framework/core/noxcc";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { LevelScene } from "../../../ui/scene/LevelScene";
import { BaseObject } from "../BaseObject";
import { Player } from "../Player";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Gate extends BaseObject {
    public gateName: string = "";
    public targetLevelName: string = "";
    public targetGateName: string = "";

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.getComponent(Collider2D).on(Contact2DType.END_CONTACT, this.onEndContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        var player = Player.currenton();
        if (player) {
            var index = player.touchingGates.indexOf(this);
            if (index >= 0) {
                player.touchingGates.splice(index, 1);
            }
            else {
                cc_assert(false);
            }
        }
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        var player = Player.currenton();
        var player = Player.currenton();
        if (player) {
            var index = player.touchingGates.indexOf(this);
            if (index < 0) {
                player.touchingGates.push(this);
            }
            else {
                cc_assert(false);
            }
        }
    }

    public enterGate(): void {
        var player = Player.currenton();
        if (this.targetLevelName && this.targetLevelName != this.map.levelName) {
            LevelScene.currenton().loadLevel(this.targetLevelName, this.targetGateName, true);
        }
        else if (this.targetGateName) {
            var targetGate = this.node.parent.getChildByName(this.targetGateName);
            noxcc.setPosAR(player.node, targetGate.position.x, targetGate.position.y);

            GameData.INSTANCE.currSavedData.setLevelAndGate(this.map.levelName, this.targetGateName);
            GameData.INSTANCE.saveGame();
        }
        else {
            cc_assert(false, "fatal error");
        }
    }
}
