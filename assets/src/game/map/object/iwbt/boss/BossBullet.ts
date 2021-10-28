import { Collider2D, Contact2DType, IPhysics2DContact, _decorator } from "cc";
import { noxcc } from "../../../../../framework/core/noxcc";
import { GameConfig } from "../../../../config/GameConfig";
import { ObjectGroup } from "../../../../const/ObjectGroup";
import { ObjectTag } from "../../../../const/ObjectTag";
import { CameraControl } from "../../../CameraControl";
import { BaseObject } from "../../BaseObject";
import { Player } from "../../Player";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
@disallowMultiple
export class BossBullet extends BaseObject {
    public speedX: number = 0;
    public speedY: number = 0;

    public autoRemove: boolean = false;

    start() {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }
    
    update(dt: number): void {
        if (this.speedX || this.speedY) {
            noxcc.addXY(this.node, this.speedX * dt, this.speedY * dt);
        }

        var pos = noxcc.convertPosAR(noxcc.pos(this.node), this.node.parent, this.map.node);
        pos.x += noxcc.aw(this.map.node);
        pos.y += noxcc.ah(this.map.node);

        if(this.autoRemove) {
            var cameraControl = this.map.getComponent(CameraControl);
            var cameraRect = cameraControl.getCameraRect();
            cameraRect.x -= 150;
            cameraRect.y -= 150;
            cameraRect.width += 300;
            cameraRect.height += 300;
            if (!cameraRect.contains(pos)) {
                this.node._destroyImmediate();
            }
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            var player = otherCollider.getComponent(Player);
            if (!GameConfig.invincibleMode && !player.invincible) {
                player.isDying = true;
            }
        }
    }
    
    setSpeed(speedX: number, speedY: number) {
        this.speedX = speedX;
        this.speedY = speedY;
    }
}
