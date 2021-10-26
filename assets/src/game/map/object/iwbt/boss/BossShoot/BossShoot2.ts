import { Node, Vec3, _decorator } from "cc";
import { cc_isValid, cc_tween } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { noxSound } from "../../../../../../framework/core/noxSound";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { MapUtil } from "../../../../MapUtil";
import { BaseObject } from "../../../BaseObject";
import { BossBullet } from "../BossBullet";
import { BossShootable } from "./BossShootable";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
export class BossShoot2 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed: number };

    protected bullets: Node[] = [];

    start(): void {
        this.bullets = [];
    }

    // 开始发射
    public startShoot(): void {
        this.schedule(this.shoot, 1);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
        this.removeBullets();
    }

    // 发射
    public shoot(): void {
        //noxSound.playEffect("sound/iwbt/bossHit.mp3");
        let bullet = BulletPrefabMgr.CURRENTON.createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet2);
        noxcc.setPosAR(bullet, 755 - noxcc.aw(this.map.node), 250 - noxcc.ah(this.map.node));
        noxcc.setParent(bullet, this.map.node);
        let angle = Math.floor(Math.random() * 180) + 90;
        let radian = angle * Math.PI / 180;
        let speedX = this.params.speed * Math.cos(radian);
        let speedY = this.params.speed * Math.sin(radian);
        bullet.getComponent(BossBullet).setSpeed(speedX, speedY);
        this.bullets.push(bullet);
    }

    // 删除所有子弹
    public removeBullets(): void {
        for (let i = 0; i < this.bullets.length; i++) {
            let bullet = this.bullets[i];
            if (cc_isValid(bullet)) {
                MapUtil.removeCollider(bullet);
                cc_tween(bullet)
                    .to(0.5, { scale: new Vec3(0.5, 0.5, 1) })
                    .removeSelf()
                    .start();
            }
        }
        this.bullets = [];
    }
}
