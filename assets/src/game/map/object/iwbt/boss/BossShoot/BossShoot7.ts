import { Node, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { BaseObject } from "../../../BaseObject";
import { BossShootable } from "./BossShootable";

const { ccclass, property } = _decorator;

export class BossShoot7 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed1: number, speed2: number, count: number };

    protected dr: number = 0;
    protected count: number = 0;
    protected value: number = 0;
    protected bullet1: Node = null;

    start(): void {
        this.dr = 2 * Math.PI / this.params.count;
        this.count = 0;
        this.value = 1;
    }

    // 开始发射
    public startShoot(): void {
        this.bullet1 = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
        noxcc.setX(this.bullet1, cc_view.getVisibleSize().width / 2);
        noxcc.setY(this.bullet1, cc_view.getVisibleSize().height + noxcc.h(this.bullet1) / 2);
        noxcc.setParent(this.bullet1, this.map.node);
        this.bullet1.getComponent(RigidBody2D).linearVelocity = new Vec2(0, -this.params.speed1);
        var dist = (cc_view.getVisibleSize().height + noxcc.h(this.bullet1)) / 2;
        var time = dist / this.params.speed1;
        var self = this;
        this.scheduleOnce(function () {
            self.bullet1.getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
            self.schedule(self.shoot, 0.1);
        }, time);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
        this.bullet1.getComponent(RigidBody2D).linearVelocity = new Vec2(0, this.params.speed1);

    }

    // 发射
    public shoot(): void {
        for (var i = 0; i < this.params.count; i++) {
            var bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
            noxcc.setPosAR(bullet, this.bullet1.position.x, this.bullet1.position.y);
            noxcc.setParent(bullet, this.map.node);
            var radian = i * this.dr - 0.04 * this.count;
            var speedX = this.params.speed2 * Math.cos(radian);
            var speedY = this.params.speed2 * Math.sin(radian);
            bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
        }
        this.count += this.value;
        if (this.count == 40) {
            this.value = -1;
        }
        else if (this.count == 0) {
            this.value = 1;
        }
    }
}
