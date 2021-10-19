import { _decorator, Component, Node, EventTouch, Camera, view, PhysicsSystem2D, Mask, TERRAIN_HEIGHT_BASE } from 'cc';
const { ccclass, property } = _decorator;
import { SceneManager } from "../../framework/base/SceneManager";
import { cc_assert, cc_find } from "../../framework/core/nox";
import { noxcc } from "../../framework/core/noxcc";

const VIBRATION_INTENSITY = 5;

@ccclass
export class CameraControl extends Component {
    protected gameOverNode: Node = null;
    protected mapNode: Node = null;
    protected viewNode: Node = null;
    private cameraForMovement: Camera = null;
    private vibrationRemainTime: number = 0;
    private vibrationOffsetX: number = 0;
    private vibrationOffsetY: number = 0;

    onLoad(): void {
        this.gameOverNode = cc_find("GAMEOVER", SceneManager.getRunningScene().node);
        this.mapNode = this.node;
        this.viewNode = this.mapNode.parent;
        this.viewNode.getComponent(Mask).enabled = false;
        this.cameraForMovement = this.node.parent.getChildByName("Camera").getComponent(Camera);
        cc_assert(this.cameraForMovement);
    }

    start(): void {
        var mapNode = this.mapNode;
        if (mapNode) {
            var targetCameraX = 0;
            var targetCameraY = 0;
            if (noxcc.w(mapNode) >= noxcc.w(this.viewNode)) {
                targetCameraX = 0;
            }
            else {
                targetCameraX = noxcc.cw(mapNode) - noxcc.cw(this.viewNode);
            }
            if (noxcc.h(mapNode) >= noxcc.h(this.viewNode)) {
                targetCameraY = 0;
            }
            else {
                targetCameraY = noxcc.ch(mapNode) - noxcc.ch(this.viewNode);
            }
        }
        this.setCameraPos(targetCameraX, targetCameraY, true);
    }

    update(dt: number): void {
        var [targetCameraX, targetCameraY] = this.getCameraPos();

        var needSetCameraPos = false;

        if (this.vibrationRemainTime > 0) {
            this.vibrationRemainTime = Math.max(0, this.vibrationRemainTime - dt);
            var [targetCameraX, targetCameraY] = this.getCameraPos();
            this.vibrationOffsetX = Math.floor(Math.random() * VIBRATION_INTENSITY - VIBRATION_INTENSITY * 2);
            this.vibrationOffsetY = Math.floor(Math.random() * VIBRATION_INTENSITY - VIBRATION_INTENSITY * 2);
            needSetCameraPos = true;
        }
        else if (this.vibrationOffsetX || this.vibrationOffsetY) {
            var [targetCameraX, targetCameraY] = this.getCameraPos();
            this.vibrationOffsetX = 0;
            this.vibrationOffsetY = 0;
            needSetCameraPos = true;
        }

        var playerNode = this.getPlayerNode();
        if (playerNode) {
            let mapNode = this.mapNode;
            let viewNode = this.viewNode;

            const cameraRightRatio = 0.7;
            const cameraLeftRatio = 1 - cameraRightRatio;
            const cameraUpRatio = 0.7;
            const cameraDownRatio = 1 - cameraUpRatio;

            if (noxcc.w(mapNode) > noxcc.w(viewNode)) {
                let playerXInMap = playerNode.position.x + noxcc.aw(mapNode);
                let cameraXMax = playerXInMap - Math.floor(noxcc.w(viewNode) * Math.min(cameraLeftRatio, cameraRightRatio));
                let cameraXMin = playerXInMap + Math.floor(noxcc.w(viewNode) * Math.min(cameraLeftRatio, cameraRightRatio)) - noxcc.w(viewNode);
                targetCameraX = Math.min(targetCameraX, cameraXMax);
                targetCameraX = Math.max(targetCameraX, cameraXMin);
                targetCameraX = Math.min(targetCameraX, noxcc.w(mapNode) - noxcc.w(viewNode));
                targetCameraX = Math.max(targetCameraX, 0);
            }

            if (noxcc.h(mapNode) > noxcc.h(viewNode)) {
                let playerYInMap = playerNode.position.y + noxcc.ah(mapNode);
                let cameraYMax = playerYInMap - Math.floor(noxcc.h(viewNode) * Math.min(cameraUpRatio, cameraDownRatio));
                let cameraYMin = playerYInMap + Math.floor(noxcc.h(viewNode) * Math.min(cameraUpRatio, cameraDownRatio)) - noxcc.h(viewNode);
                targetCameraY = Math.min(targetCameraY, cameraYMax);
                targetCameraY = Math.max(targetCameraY, cameraYMin);
                targetCameraY = Math.min(targetCameraY, noxcc.h(mapNode) - noxcc.h(viewNode));
                targetCameraY = Math.max(targetCameraY, 0);
            }
            this.setCameraPos(targetCameraX, targetCameraY);
        }
        else if (needSetCameraPos) {
            this.setCameraPos(targetCameraX, targetCameraY);
        }
    }

    private getPlayerNode(): Node {
        return cc_find("player", this.node);
    }

    private getCameraPos(): [number, number] {
        var mapNode = this.mapNode;
        var viewNode = this.viewNode;

        var x = this.cameraForMovement.node.position.x + noxcc.aw(mapNode) - noxcc.aw(viewNode);
        var y = this.cameraForMovement.node.position.y + noxcc.ah(mapNode) - noxcc.ah(viewNode);
        x -= this.vibrationOffsetX;
        y -= this.vibrationOffsetY;
        return [x, y];
    }

    private setCameraPos(x: number, y: number, forceSync?: boolean) {
        var mapNode = this.mapNode;
        var viewNode = this.viewNode;

        x = x + noxcc.aw(viewNode) - noxcc.aw(mapNode);
        y = y + noxcc.ah(viewNode) - noxcc.ah(mapNode);
        x += this.vibrationOffsetX;
        y += this.vibrationOffsetY;
        noxcc.setPosAR(this.cameraForMovement.node, x, y);
    }

    public startVibrate(duration: number) {
        this.vibrationRemainTime = duration;
    }
}
