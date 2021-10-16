import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, _decorator } from "cc";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { Player } from "../Player";
import { PlayerStatus } from "../PlayerStatus";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class SetMapAngle extends Component {
    public targetAngle: number = 0;

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        var player = otherNode.getComponent(Player);
        if (player) {
            if (player.checkCanRotateMap(this.targetAngle)) {
                player.startRotateMap(this.targetAngle);
            }
            else if (player.playerStatus == PlayerStatus.PLAYER_FLIPPING) {
                GameData.INSTANCE.flipedRotateAngle = this.targetAngle;
            }
        }
    }
}
