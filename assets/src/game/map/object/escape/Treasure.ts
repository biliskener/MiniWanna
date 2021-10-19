import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledLayer, TiledMap, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { TreasurePromptForm } from "../../../ui/form/TreasurePromptForm";
import { LevelScene } from "../../../ui/scene/LevelScene";
import { BaseObject } from "../BaseObject";
import { LayerVisibility } from "../LayerVisibility";
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Treasure extends BaseObject {
    private params = {
        targetLevel: "level11",
        targetLayers: "Layer10"
    };

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.syncState();
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.map.levelName, this.node.name);
        if (!state) {
            noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");

            GameData.INSTANCE.currSavedData.setObjectState(this.map.levelName, this.node.name, 1)
            GameData.INSTANCE.currSavedData.addTreasureCount();
            this.syncState();
            if (GameData.INSTANCE.currSavedData.treasureCount == 1) {
                TreasurePromptForm.create().show();
            }
            else if (GameData.INSTANCE.currSavedData.treasureCount == 4) {
                // 获得所有宝物时，开启指定的门
                this.map.requestPause();
                var doTransition = (cross: boolean) => {
                    var targetMap = cross ? LevelScene.currenton().getCrossMap() : this.map;
                    // 开始平台动画效果
                    let layerNames = this.params.targetLayers.split("|");
                    let layers: TiledLayer[] = [];
                    for (let layerName of layerNames) {
                        let layer = targetMap.getTiledMap().getLayer(layerName)
                        cc_assert(layer, layerName);
                        layers.push(layer);
                    }

                    // 所有的平台动画效果完成后取消暂停，并且同步状态
                    let doneCount = 0;
                    for (let layer of layers) {
                        layer.getComponent(LayerVisibility).doTransition(() => {
                            if (++doneCount == layers.length) {
                                // 要先保存，因为节点已经被销毁了
                                GameData.INSTANCE.currSavedData.setObjectState(this.params.targetLevel || this.map.levelName, layer.name, 1);
                                if (cross) {
                                    noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
                                    LevelScene.currenton().unloadCrossLevel();
                                }
                                this.map.applyGravity();
                                this.map.cancelPause();
                            }
                        });
                    }
                };
                if (this.params.targetLevel) {
                    this.map.scheduleOnce(() => {
                        LevelScene.currenton().loadCrossLevel(this.params.targetLevel || this.map.levelName, () => {
                            doTransition(true);
                        });
                    }, 0.2)
                }
                else {
                    doTransition(false);
                }
            }
        }
    }

    private syncState(): void {
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.map.levelName, this.node.name);
        this.map.deferredActivateNode(this.node, !state);
    }
}
