import { _decorator } from "cc";
import { noxcc } from "../../../../../framework/core/noxcc";
import { CameraControl } from "../../../CameraControl";
import { MapUtil } from "../../../MapUtil";
import { BaseObject } from "../../BaseObject";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
@disallowMultiple
export class BossBullet extends BaseObject {
    public speedX: number = 0;
    public speedY: number = 0;

    update(dt: number): void {
        if (this.speedX || this.speedY) {
            noxcc.addXY(this.node, this.speedX * dt, this.speedY * dt);
        }

        var pos = noxcc.convertPosAR(noxcc.pos(this.node), this.node.parent, this.map.node);
        pos.x += noxcc.aw(this.map.node);
        pos.y += noxcc.ah(this.map.node);
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

    setSpeed(speedX: number, speedY: number) {
        this.speedX = speedX;
        this.speedY = speedY;
    }
}
