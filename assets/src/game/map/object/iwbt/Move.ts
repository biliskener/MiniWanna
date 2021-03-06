import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledObjectGroup, Vec3, _decorator } from "cc";
import { cc_assert, cc_isValid, cc_tween, cc_view } from "../../../../framework/core/nox";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { CollisionObject } from "../../collision/CollisionObject";
import { MapUtil } from "../../MapUtil";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Move extends BaseObject {
    private params: {
        objects: string[];              // 移动的图块名称，是个数组
        direction: string;              // 方向
        distance: number;               // 距离（0 为飞出屏幕外）
        speed: number;                  // 速度
        remove: boolean;                // 移动完删除（不能删除，所以比例设为 0），防止隐藏在方块底下的尖刺依旧和玩家发生碰撞
        layer: string,                  // 移动的图块对象所在的图层
        sound: string                   // 触发时的声音
    };

    private layer: TiledObjectGroup;
    private hasTriggered: boolean;      // 是否已经触发

    private movingObjects: { targetNode: Node, isMoving: boolean, startPosition: Vec3, stopPosition: Vec3 }[] = [];

    start(): void {
        let tiledMap = this.map.getTiledMap();
        this.layer = tiledMap.getObjectGroup(this.params.layer);
        cc_assert(this.layer);

        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        if (!this.hasTriggered) {
            this.hasTriggered = true;
            this.movingObjects = [];
            if (this.params.sound) {
                noxSound.playEffect(`sound/iwbt/${this.params.sound}.wav`);
            }
            for (let i in this.params.objects) {
                let name = this.params.objects[i];
                let targetNode = this.layer.node.getChildByName(name);
                let distance = this.params.distance;
                if (distance <= 0) {
                    distance = cc_view.getVisibleSize().width;
                }
                let position: Vec3;
                if (this.params.direction == "up") {
                    position = new Vec3(0, distance);
                }
                else if (this.params.direction == "down") {
                    position = new Vec3(0, -distance);
                }
                else if (this.params.direction == "left") {
                    position = new Vec3(-distance, 0);
                }
                else if (this.params.direction == "right") {
                    position = new Vec3(distance, 0);
                }
                if (targetNode.getComponent(CollisionObject)) { // 非触发器类，如移动的砖块
                    this.movingObjects.push({
                        targetNode: targetNode,
                        isMoving: false,
                        startPosition: targetNode.position.clone(),
                        stopPosition: targetNode.position.clone().add(position)
                    });
                }
                else {
                    let duration = distance / this.params.speed;    // 触发器类，如尖刺
                    cc_tween(targetNode)
                        .by(duration, { position: position })
                        .call(() => {
                            if (this.params.remove || this.params.distance <= 0) {
                                targetNode._destroyImmediate();
                            }
                        })
                        .start();
                }
            }
        }
    }

    update(dt: number) {
        let speedValue = this.params.speed;
        for (let movingObject of this.movingObjects) {
            let targetNode = movingObject.targetNode;
            let startPosition = movingObject.startPosition;
            let stopPosition = movingObject.stopPosition;
            if (cc_isValid(targetNode)) {
                let curPosition = targetNode.position.clone();
                let distance = stopPosition.clone().subtract(curPosition).length();
                let speedVector = stopPosition.clone().subtract(startPosition).normalize().multiplyScalar(speedValue);
                if (dt * speedValue > distance) {
                    MapUtil.addMovement(targetNode, stopPosition.x - curPosition.x, stopPosition.y - curPosition.y);
                    if (this.params.remove || this.params.distance <= 0) {
                        movingObject.isMoving = false;
                        targetNode._destroyImmediate();
                    }
                }
                else {
                    MapUtil.addMovement(targetNode, speedVector.x * dt, speedVector.y * dt);
                }
            }
        }
    }
}
