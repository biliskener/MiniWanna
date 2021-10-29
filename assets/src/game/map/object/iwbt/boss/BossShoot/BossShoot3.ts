import { _decorator } from "cc";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { noxSound } from "../../../../../../framework/core/noxSound";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { BaseObject } from "../../../BaseObject";
import { BossBullet } from "../BossBullet";
import { BossShootable } from "./BossShootable";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
export class BossShoot3 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed: number };

    start(): void {
    }

    // 开始发射
    public startShoot(): void {
        this.schedule(this.shoot, 1);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
    }

    // 发射
    public shoot(): void {
        //noxSound.playEffect("sound/iwbt/bossHit.mp3");
        for (let i = 0; i < 2; i++) {
            let bullet = this.map.createBullet(this.params.bullet, ObjectGroup.BossBullet1);
            if (i % 2 == 0) {
                noxcc.setX(bullet, -noxcc.w(bullet) - noxcc.aw(this.map.node));
                bullet.angle = 0;
                bullet.getComponent(BossBullet).setSpeed(this.params.speed, 0);
            }
            else {
                noxcc.setX(bullet, noxcc.w(this.map.node) + noxcc.w(bullet) - noxcc.aw(this.map.node));
                bullet.angle = 180;
                bullet.getComponent(BossBullet).setSpeed(-this.params.speed, 0);
            }
            noxcc.setY(bullet, Math.floor(Math.random() * (noxcc.h(this.map.node) - 64)) + 32 - noxcc.ah(this.map.node));
            noxcc.setParent(bullet, this.map.node);
        }
    }
}
