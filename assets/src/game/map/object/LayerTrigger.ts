import { GameData } from "../../data/GameData";
import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledLayer, TiledMap, _decorator } from "cc";
import { cc_assert } from "../../../framework/core/nox";
import { BaseObject } from "./BaseObject";
import { LayerVisibility } from "../object/LayerVisibility";
import { ObjectTag } from "../../const/ObjectTag";
import { noxSound } from "../../../framework/core/noxSound";
import { LevelScene } from "../../ui/scene/LevelScene";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

type LayerTriggerParams = {
    targetLevel?: string,           // 目标关卡
    targetLayers: string;           // 目标Layer名称
    visibleWhenActivated?: boolean, // 激活时是否仍然可见
}

@ccclass
@disallowMultiple
export class LayerTrigger extends BaseObject {
    private params: LayerTriggerParams;

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.syncState();
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
        this.map.deferredActivateNode(this.node, !!this.params.visibleWhenActivated);
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
                        if (cross) {
                            noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
                            LevelScene.currenton().unloadCrossLevel();
                        }
                        this.map.applyGravity();
                        this.map.cancelPause();
                        this.syncState();
                    }
                });
            }
        };
        if (this.params.targetLevel) {
            this.map.scheduleOnce(() => {
                LevelScene.currenton().loadCrossLevel(this.params.targetLevel || this.map.levelName, () => {
                    doTransition(true);
                });
            }, 0.2);
        }
        else {
            doTransition(false);
        }
    }

    private syncState(): void {
        cc_assert(this.params.targetLayers && this.params.targetLayers != "");
        var layerNames = this.params.targetLayers.split("|");
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.params.targetLevel || this.map.levelName, layerNames[0]);
        if (state) {
            this.map.deferredActivateNode(this.node, !!this.params.visibleWhenActivated);
        }
        else {
            this.map.deferredActivateNode(this.node, true);
        }
    }
}
