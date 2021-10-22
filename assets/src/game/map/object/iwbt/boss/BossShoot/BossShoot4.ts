import { RigidBody2D, Vec2, _decorator } from "cc";
import { cc_instantiate, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { BaseObject } from "../../../BaseObject";
import { BossBullet } from "../BossBullet";
import { BossShootable } from "./BossShootable";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
export class BossShoot4 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed: number, count: number };

    protected space: number = 0;
    protected index: number = 0;
    protected count: number = 0;

    start(): void {
        var prefab = BulletPrefabMgr.currenton().getPrefab(this.params.bullet);
        var bullet = cc_instantiate(prefab);
        var bulletWidth = noxcc.w(bullet);
        bullet.destroy();

        this.space = (noxcc.w(this.map.node) - 64 - this.params.count * bulletWidth) / (this.params.count - 1);
        this.index = 0;
        this.count = 0;
    }

    // 开始发射
    public startShoot(): void {
        this.schedule(this.shoot, 0.2);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
    }

    // 发射
    public shoot(): void {
        let bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
        noxcc.setX(bullet, 32 + (noxcc.w(bullet) + this.space) / 2 * (this.count % 2) + noxcc.w(bullet) / 2 + this.index * (this.space + noxcc.w(bullet)) - noxcc.aw(this.map.node));
        noxcc.setY(bullet, noxcc.h(this.map.node) + noxcc.h(bullet) / 2 - noxcc.aw(this.map.node));
        noxcc.setParent(bullet, this.map.node);
        bullet.getComponent(BossBullet).setSpeed(0, -this.params.speed);
        this.index++;
        if (this.index + this.count % 2 >= this.params.count) {
            this.index = 0;
            this.count++;
        }
    }
}
