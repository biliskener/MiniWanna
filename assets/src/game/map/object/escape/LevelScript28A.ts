import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledMap, Tween, Vec3, _decorator } from "cc";
import { cc_assert, cc_tween } from "../../../../framework/core/nox";
import { noxcc } from "../../../../framework/core/noxcc";
import { noxSound } from "../../../../framework/core/noxSound";
import { GameConfig } from "../../../config/GameConfig";
import { ObjectTag } from "../../../const/ObjectTag";
import { BaseObject } from "../BaseObject";
import { Player } from "../Player";
import { Spike } from "../Spike";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

type NodeRuntime = {
    node: Node,
    pos: Vec3,
    tween?: Tween<Node>
}

@ccclass
@disallowMultiple
export class LevelScript28A extends BaseObject {
    public static CURRENTON: LevelScript28A = null;

    private tileMap: TiledMap;
    private blocksTable: NodeRuntime[][] = [];      // 从右到左排列
    private spikesTable: NodeRuntime[][] = [];      // 从上到下排列，从左到右排列
    private currentState: number = 0;               // 状态值
    public touchingFinalPlatform: boolean = false;  // 是否接触到最终平台

    onLoad() {
        cc_assert(LevelScript28A.CURRENTON == null);
        LevelScript28A.CURRENTON = this;
    }

    onDestroy() {
        cc_assert(LevelScript28A.CURRENTON == this);
        LevelScript28A.CURRENTON = null;
    }

    start(): void {
        cc_assert((this.map.levelName == "level28"), "scripts are for this level only");
        this.tileMap = this.map.getTiledMap();
        for (let i = 3; i <= 4; ++i) {
            let blocks: NodeRuntime[] = [];
            let layer = this.tileMap.getObjectGroup("Layer" + i);
            for (let object of layer.getObjects()) {
                if (object.gid && object.gid == GameConfig.blackWhiteTile) {
                    let block = layer.node.getChildByName("img" + object.id);
                    cc_assert(block);
                    blocks.push({
                        node: block,
                        pos: block.position.clone()
                    });
                }
            }
            blocks.sort((a: NodeRuntime, b: NodeRuntime) => {
                return b.node.position.x - a.node.position.x;
            });
            this.blocksTable.push(blocks);
        }
        for (let i = 5; i <= 7; ++i) {
            let spikes: NodeRuntime[] = [];
            let layer = this.tileMap.getObjectGroup("Layer" + i);
            for (let child of layer.node.children) {
                let spike = child.getComponent(Spike);
                if (spike) {
                    spikes.push({
                        node: spike.node,
                        pos: spike.node.position.clone()
                    });
                }
            }
            spikes.sort((a: NodeRuntime, b: NodeRuntime) => {
                return b.node.position.y - a.node.position.y || a.node.position.x - b.node.position.x;
            });
            this.spikesTable.push(spikes);
        }

        for (let blocks of this.blocksTable) {
            for (let block of blocks) {
                block.node.position = new Vec3(-10000, -10000);
            }
        }

        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        if (this.currentState == 0) {
            this.nextState();
        }
    }

    private nextState() {
        ++this.currentState;
        if (this.currentState == 1) {
            // 向右发射针刺
            let spikes = this.spikesTable[0];
            for (let i = 0; i < spikes.length; ++i) {
                let spikeRuntime = spikes[i];
                spikeRuntime.tween = cc_tween(spikeRuntime.node).call(() => {
                    spikeRuntime.node.position = spikeRuntime.pos;
                }).delay(i * 0.4).by(2, {
                    position: new Vec3(noxcc.w(this.map.node) + noxcc.w(spikeRuntime.node), 0)
                }).call(() => {
                    delete spikeRuntime.tween;
                    if (i == spikes.length - 1) {
                        this.nextState();
                    }
                }).start();
            }
        }
        else if (this.currentState == 2) {
            // 向左发射针刺
            let spikes = this.spikesTable[1];
            for (let i = 0; i < spikes.length; ++i) {
                let spikeRuntime = spikes[i];
                spikeRuntime.tween = cc_tween(spikeRuntime.node).call(() => {
                    spikeRuntime.node.position = spikeRuntime.pos;
                }).delay(i * 0.4).by(2, {
                    position: new Vec3(-noxcc.w(this.map.node) - noxcc.w(spikeRuntime.node), 0)
                }).call(() => {
                    delete spikeRuntime.tween;
                    if (i == spikes.length - 1) {
                        this.nextState();
                    }
                }).start();
            }
        }
        else if (this.currentState == 3) {
            // 向下发射针刺
            let spikes = this.spikesTable[2];
            for (let i = 0; i < spikes.length; ++i) {
                let spikeRuntime = spikes[i];
                spikeRuntime.tween = cc_tween(spikeRuntime.node).call(() => {
                    spikeRuntime.node.position = spikeRuntime.pos;
                }).delay(i * 0.1).by(1, {
                    position: new Vec3(0, -noxcc.h(this.map.node) - noxcc.w(spikeRuntime.node))
                }).call(() => {
                    delete spikeRuntime.tween;
                    if (i == spikes.length - 1) {
                        this.nextState();
                    }
                }).start();
            }
        }
        else if (this.currentState == 4) {
            noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
            // 平台显示
            for (let platformRuntime of this.blocksTable[0]) {
                platformRuntime.node.position = platformRuntime.pos;
            }
            // 阶梯显示
            for (let ladderRuntime of this.blocksTable[1]) {
                ladderRuntime.node.position = ladderRuntime.pos;
            }
            // 阶梯逐步消失
            let ladders = this.blocksTable[1];
            for (let i = 0; i < ladders.length; ++i) {
                let runtime = ladders[i];
                runtime.tween = cc_tween(runtime.node)
                    .delay(3 + i * 0.5).call(() => {
                        runtime.node.position = new Vec3(-10000, -10000, 0);
                    }).call(() => {
                        delete runtime.tween;
                        if (i == ladders.length - 1) {
                            this.nextState();
                        }
                    }).start();
            }
        }
        else if (this.currentState == 5) {
            cc_tween(this.node).delay(1).call(() => {
                if (this.touchingFinalPlatform) {
                    // 阶梯隐藏
                    let platforms = this.blocksTable[0];
                    for (let i = 0; i < platforms.length; ++i) {
                        let runtime = platforms[i];
                        runtime.node.position = new Vec3(-10000, -10000, 0);
                    }
                    // 旋转地图以及修改状态
                    cc_tween(this.node).delay(0.5).call(() => {
                        Player.currenton().startRotateMap((this.map.getAngle() + 180) % 360);
                    }).start();
                }
                else {
                    // 开始发射针刺
                    this.currentState = 0;
                    this.nextState();
                }
            }).start();
        }
    }
}
