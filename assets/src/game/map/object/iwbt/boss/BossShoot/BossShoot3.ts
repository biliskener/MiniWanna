import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot3 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    @property({})
    speed: number = 150;

    protected map: Node = null;

    start(): void {
        this.map = cc_find("Canvas/map");
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
        for (var i = 0; i < 2; i++) {
            var bullet = cc_instantiate(this.bullet);
            if (i % 2 == 0) {
                noxcc.setX(bullet, -noxcc.w(bullet));
                bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(this.speed, 0);
            }
            else {
                cc_view.getVisibleOrigin
                noxcc.setX(bullet, cc_view.getVisibleSize().width + noxcc.w(bullet));
                bullet.angle = 180;
                bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(-this.speed, 0);
            }
            noxcc.setY(bullet, Math.floor(Math.random() * (cc_view.getVisibleSize().height - 64)) + 32);
            bullet.parent = this.map;
        }
    }
}
