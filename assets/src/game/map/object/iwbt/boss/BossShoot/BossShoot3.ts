import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { BaseObject } from "../../../BaseObject";
import { BossShootable } from "./BossShootable";

const { ccclass, property } = _decorator;

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
        for (let i = 0; i < 2; i++) {
            let bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
            if (i % 2 == 0) {
                noxcc.setX(bullet, -noxcc.w(bullet));
                bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(this.params.speed, 0);
            }
            else {
                noxcc.setX(bullet, cc_view.getVisibleSize().width + noxcc.w(bullet));
                bullet.angle = 180;
                bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(-this.params.speed, 0);
            }
            noxcc.setY(bullet, Math.floor(Math.random() * (cc_view.getVisibleSize().height - 64)) + 32);
            noxcc.setParent(bullet, this.map.node);
        }
    }
}
