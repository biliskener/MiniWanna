import { Collider2D, Component, IPhysics2DContact, Node, TiledTile, _decorator } from "cc";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { GameMap } from "../../GameMap";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Save extends BaseObject {
    private tile: TiledTile;

    // 设置图块（为了改变图块）
    public setTile(tile): void {
        this.tile = tile;
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        this.save();
    }

    // 保存 
    save() {
        // 改成变存档点图块，从红色存档点变绿色存档点，维持 1.6 秒
        if (this.tile.grid == 15) {
            this.tile.grid = 16;
            this.scheduleOnce(function () {
                this.tile.gid = 15;
            }, 1.6);
            // 保存游戏数据
            var mapNode = this.node.parent.parent;
            var map = this.map;
            var player = mapNode.getChildByName("player");
            GameData.INSTANCE.savedData.playerX = player.position.x;
            GameData.INSTANCE.savedData.playerY = player.position.y;
            GameData.INSTANCE.savedData.setLevelAndGate(map.levelName, "");
            GameData.INSTANCE.saveGame();
        }
    }
}
