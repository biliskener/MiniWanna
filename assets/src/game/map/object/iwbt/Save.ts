import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, TiledTile, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { GameConfig } from "../../../config/GameConfig";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Save extends BaseObject {
    private tiledTile: TiledTile;

    start() {
        this.tiledTile = this.getComponent(TiledTile);
        cc_assert(this.tiledTile);
        this.deactivate();
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        if (contact) contact.disabledOnce = true;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        this.save();
    }

    // 保存 
    save() {
        if (this.tiledTile.grid == GameConfig.saveTile) {
            this.deactivate();
            GameData.INSTANCE.currSavedData.setLevelAndTile(this.map.levelName, [this.tiledTile.x, this.tiledTile.y]);
            GameData.INSTANCE.saveGame();
        }
    }

    deactivate() {
        this.tiledTile.grid = GameConfig.saveDoneTile;
        this.tiledTile._layer.markForUpdateRenderData(); // updateInfo没有效
        this.scheduleOnce(() => {
            this.tiledTile.grid = GameConfig.saveTile;
            this.tiledTile._layer.markForUpdateRenderData();
        }, 3);
    }
}
