import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, TiledTile, _decorator } from "cc";
import { GameConfig } from "../../../config/GameConfig";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Save extends BaseObject {
    private tile: TiledTile;

    start() {
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

    // 设置图块（为了改变图块）
    public setTile(tile): void {
        this.tile = tile;
    }

    // 保存 
    save() {
        if (this.tile.grid == GameConfig.saveTile) {
            this.deactivate();
            GameData.INSTANCE.currSavedData.setLevelAndTile(this.map.levelName, [this.tile.x, this.tile.y]);
            GameData.INSTANCE.saveGame();
        }
    }

    deactivate() {
        this.tile.grid = GameConfig.saveDoneTile;
        this.tile.updateInfo();
        this.scheduleOnce(() => {
            this.tile.grid = GameConfig.saveTile;
            this.tile.updateInfo();
        }, 3);
    }
}
