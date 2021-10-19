import { GameData } from "../../data/GameData";
import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledMap, TiledMapAsset, _decorator } from "cc";
import { cc_assert } from "../../../framework/core/nox";
import { BaseObject } from "./BaseObject";
import { ObjectTag } from "../../const/ObjectTag";
import { noxSound } from "../../../framework/core/noxSound";
import { LevelScene } from "../../ui/scene/LevelScene";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

type PlatformTriggerParams = {
    targetLevel?: string,           // 目标关卡
    targetPlatforms: string,        // 目标平台
    visibleWhenActivated?: boolean, // 激活时是否仍然可见
}

@ccclass
@disallowMultiple
export class PlatformTrigger extends BaseObject {
    private params: PlatformTriggerParams;

    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        this.syncState();
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        /*
        noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
        this.map.deferredActivateNode(this.node, !!this.params.visibleWhenActivated);
        this.map.requestPause();
        var doTransition = (cross: boolean) => {
            var targetMap = cross ? LevelScene.currenton().getCrossMap() : this.map;
            // 开始平台动画效果
            let platformNames = this.params.targetPlatforms.split("|");
            let platforms: Platform[] = [];
            for (let platformName of platformNames) {
                let platform = targetMap.allPlatforms[platformName];
                cc_assert(platform, platformName);
                platforms.push(platform);
            }

            // 所有的平台动画效果完成后取消暂停，并且同步状态
            let doneCount = 0;
            let first = true;
            for (let platform of platforms) {
                platform.doTransition(() => {
                    if (++doneCount == platforms.length) {
                        // 要分情况处理
                        if (cross) {
                            LevelScene.currenton().unloadCrossLevel();
                            this.map.applyGravity();
                            this.map.cancelPause();
                            this.syncState();
                        }
                        else {
                            this.map.cancelPause();
                            this.syncState();
                        }
                    }
                }, first);
                first = false;
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
        */
    }

    private syncState(): void {
        cc_assert(this.params.targetPlatforms && this.params.targetPlatforms != "");
        var platformNames = this.params.targetPlatforms.split("|");
        var state = GameData.INSTANCE.currSavedData.getObjectState(this.params.targetLevel || this.map.levelName, platformNames[0]);
        if (state) {
            this.map.deferredActivateNode(this.node, !!this.params.visibleWhenActivated);
        }
        else {
            this.map.deferredActivateNode(this.node, true);
        }
    }
}
