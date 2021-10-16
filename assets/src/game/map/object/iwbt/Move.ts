import { Collider2D, IPhysics2DContact, Node, TiledLayer, TiledMap, Vec3, _decorator } from "cc";
import { cc_assert, cc_tween } from "../../../../framework/core/nox";
import { noxcc } from "../../../../framework/core/noxcc";
import { ObjectTag } from "../../../const/ObjectTag";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Move extends BaseObject {
    private params: {
        objects: [number, number][];    // 移动的图块对象，是个数组
        direction: string;              // 方向
        distance: number;               // 距离（0 为飞出屏幕外）
        speed: number;                  // 速度
        remove: boolean;                // 移动完删除（不能删除，所以比例设为 0），防止隐藏在方块底下的尖刺依旧和玩家发生碰撞
        layer: string,                  // 移动的图块对象所在的图层（默认 Layer2）
    };

    private layer: TiledLayer;

    start(): void {
        // 获取 Tiled 编辑器里设置的 params 参数 
        var layerName = this.params.layer ? this.params.layer : "Layer2";
        var tiledMap = this.map.getTiledMap();
        this.layer = tiledMap.getLayer(layerName);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        contact.disabled = true;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        // 一个触发区域可能有多种不同陷阱，当计数 0 的时候才表明全部触发了
        return;
        if (selfNode.triggerNum > 0) {
            selfNode.triggerNum--;
            for (var i in this.params.objects) {
                var pos = this.params.objects[i];
                var x = pos[0];
                var y = pos[1];
                let tile = this.layer.getTiledTileAt(x, y, true);
                var distance = this.params.distance;
                if (distance <= 0) {
                    cc_assert(this.layer.node.parent.name == "map", "impossible");
                    distance = noxcc.w(this.layer.node.parent.parent);
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
                cc_tween(tile.node)
                    .by(duration, { position: position })
                    .call(() => {
                        if (this.params.remove || this.params.distance <= 0) {
                            tile.node.scale = new Vec3(0, 0, 0);
                        }
                    })
                    .start();
            }
        }
    }
}
