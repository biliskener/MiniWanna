import { RigidBody2D, Vec2, _decorator } from "cc";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { BaseObject } from "../../../BaseObject";
import { BossShootable } from "./BossShootable";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
export class BossShoot6 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed: number, count: number };

    protected dr: number = 0;
    protected index: number = 0;

    start(): void {
        this.dr = 2 * Math.PI / this.params.count;
        this.index = 0;
    }

    // 开始发射
    public startShoot(): void {
        this.schedule(this.shoot, 0.05);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
    }

    // 发射
    public shoot(): void {
        let bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
        noxcc.setPosAR(bullet, 637, 264);
        noxcc.setParent(bullet, this.map.node);
        var speedX = this.params.speed * Math.cos(this.index * this.dr);
        var speedY = this.params.speed * Math.sin(this.index * this.dr);
        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
        this.index++;
        if (this.index >= this.params.count) {
            this.index = 0;
        }
    }
}
