import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledMap, Tween, Vec3, _decorator } from "cc";
import { cc_assert, cc_tween } from "../../../../framework/core/nox";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

type NodeRuntime = {
    node: Node,
    pos: Vec3,
    tween?: Tween<Node>
}

@ccclass
@disallowMultiple
export class LevelScript34 extends BaseObject {
    private params: { targetLayers: string };

    private tileMap: TiledMap;
    private allBlocks: NodeRuntime[] = [];

    start(): void {
        let blocksTable: NodeRuntime[][] = [];

        cc_assert((this.map.levelName == "level34"), "scripts are for this level only");
        this.tileMap = this.map.getTiledMap();
        for (let layerName of this.params.targetLayers.split("|")) {
            let layer = this.tileMap.getObjectGroup(layerName);
            let blocks: NodeRuntime[] = [];
            for (let object of layer.getObjects()) {
                let block = layer.node.getChildByName("img" + object.id);
                cc_assert(block);
                blocks.push({
                    node: block,
                    pos: block.position.clone()
                });
            }
            blocksTable.push(blocks);
        }
        for (let i = 0; i < blocksTable.length; ++i) {
            var blocks = blocksTable[i];
            if (i % 2 == 0) {
                blocks.sort((a: NodeRuntime, b: NodeRuntime) => {
                    return b.node.position.x - a.node.position.x;
                });
            }
            else {
                blocks.sort((a: NodeRuntime, b: NodeRuntime) => {
                    return a.node.position.x - b.node.position.x;
                });
            }
            for (let block of blocks) {
                this.allBlocks.push(block);
            }
        }

        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
        this.map.deferredActivateNode(this.node, false);
        this.nextState();
    }

    private nextState() {
        for (let i = 0; i < this.allBlocks.length; ++i) {
            let runtime = this.allBlocks[i];
            runtime.tween = cc_tween(runtime.node)
                .delay(i * 0.2).call(() => {
                    runtime.node.position = new Vec3(-10000, -10000, 0);
                    delete runtime.tween;
                }).start();
        }
    }
}
