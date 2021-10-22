import { Collider2D, Node, RigidBody2D, Vec2, Vec3, _decorator } from "cc";
import { cc_tween } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { MapUtil } from "../../../../MapUtil";
import { BaseObject } from "../../../BaseObject";
import { BossShootable } from "./BossShootable";

const { ccclass, property } = _decorator;

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
        var bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet2);
        // 修改 sensor 属性需要在设置 parent 之前才有效
        bullet.getComponent(Collider2D).sensor = false;
        noxcc.setPosAR(bullet, 755, 250);
        noxcc.setParent(bullet, this.map.node);
        var angle = Math.floor(Math.random() * 180) + 90;
        var radian = angle * Math.PI / 180;
        var speedX = this.params.speed * Math.cos(radian);
        var speedY = this.params.speed * Math.sin(radian);
        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
        this.bullets.push(bullet);
    }

    // 删除所有子弹
    public removeBullets(): void {
        for (var i = 0; i < this.bullets.length; i++) {
            let bullet = this.bullets[i];
            MapUtil.removeCollider(bullet);
            cc_tween(bullet)
                .to(0.5, { scale: new Vec3(0.5, 0.5, 1) })
                .removeSelf()
                .start();
        }
        this.bullets = [];
    }
}
