import { Collider2D, Contact2DType, IPhysics2DContact, TiledMap, _decorator } from "cc";
import { cc_tween } from "../../../../framework/core/nox";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { BaseObject } from "../BaseObject";
import { Player } from "../Player";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class LevelScript39 extends BaseObject {
    private static triggerCount: number = 0;

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        LevelScript39.triggerCount = 0;
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
        this.map.deferredActivateNode(this.node, false);
        if (++LevelScript39.triggerCount == 4) {
            cc_tween(this.node).call(() => {
                Player.currenton().startRotateMap((this.map.getAngle() + 180) % 360);
            }).start();
        }
    }
}
