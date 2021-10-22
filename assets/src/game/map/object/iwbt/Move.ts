import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledObjectGroup, Vec3, _decorator } from "cc";
import { cc_assert, cc_tween, cc_view } from "../../../../framework/core/nox";
import { ObjectTag } from "../../../const/ObjectTag";
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
        layer: string,                  // 移动的图块对象所在的图层（默认 Layer2）
    };

    private layer: TiledObjectGroup;
    private triggered: boolean;         // 是否已经触发

    start(): void {
        var tiledMap = this.map.getTiledMap();
        this.layer = tiledMap.getObjectGroup(this.params.layer);
        cc_assert(this.layer);

        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        if (!this.triggered) {
            this.triggered = true;
            for (var i in this.params.objects) {
                var name = this.params.objects[i];
                let node = this.layer.node.getChildByName(name);
                var distance = this.params.distance;
                if (distance <= 0) {
                    distance = cc_view.getVisibleSize().width;
                }
                var position: Vec3;
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
                var duration = distance / this.params.speed;
                cc_tween(node)
                    .by(duration, { position: position })
                    .call(() => {
                        if (this.params.remove || this.params.distance <= 0) {
                            MapUtil.removeCollider(node);
                            node._destroyImmediate();
                        }
                    })
                    .start();
            }
        }
    }
}
