import { Node, _decorator } from "cc";
import { cc_find } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { BaseObject } from "../../../BaseObject";
import { Player } from "../../../Player";
import { BossBullet } from "../BossBullet";
import { BossShootable } from "./BossShootable";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
export class BossShoot1 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed: number };

    protected player: Node = null;

    start(): void {
    }

    // 开始发射
    public startShoot(): void {
        this.player = cc_find("player", this.map.node);
        this.schedule(this.shoot, 0.2);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
    }

    // 发射
    public shoot(): void {
        let bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
        noxcc.setPosAR(bullet, 637 - noxcc.aw(this.map.node), 264 - noxcc.aw(this.map.node));
        noxcc.setParent(bullet, this.map.node);
        let playerPos = this.player.getPosition();
        if (this.player.getComponent(Player).isDead()) {
            playerPos.x = 0;
            playerPos.y = 608;
        }
        let dx = playerPos.x - bullet.position.x;
        let dy = playerPos.y - bullet.position.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        let speedX = dx / dist * this.params.speed;
        let speedY = dy / dist * this.params.speed;
        bullet.getComponent(BossBullet).setSpeed(speedX, speedY);
    }
}
