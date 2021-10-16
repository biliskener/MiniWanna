import { Collider2D, Contact2DType, IPhysics2DContact, Node, TiledLayer, TiledMap, _decorator } from "cc";
import { noxSound } from "../../../../framework/core/noxSound";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class ClearTile extends BaseObject {
    private params: { layer: string };

    private tiledMap: TiledMap;
    private targetLayer: TiledLayer;

    start(): void {
        this.tiledMap = this.map.getTiledMap();
        this.targetLayer = this.tiledMap.getLayer(this.params.layer);
        this.syncState();
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        noxSound.playEffect("sound/escape/BgsSwitchEat.mp3");
        GameData.INSTANCE.savedData.setObjectState(this.map.levelName, this.node.name, 1);
        this.syncState();
    }

    private syncState(): void {
        var state = GameData.INSTANCE.savedData.getObjectState(this.tiledMap.tmxAsset.name, this.node.name);
        if (state) {
            this.map.deferredActivateNode(this.targetLayer.node, false);
            this.map.deferredActivateNode(this.node, false);
        }
        else {
            this.map.deferredActivateNode(this.targetLayer.node, true);
            this.map.deferredActivateNode(this.node, true);
        }
    }
}
