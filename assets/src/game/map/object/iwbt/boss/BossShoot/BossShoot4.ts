import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot4 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    @property({})
    speed: number = 300;

    // 子弹一排的个数
    @property({})
    num: number = 10;

    protected map: Node = null;
    protected space: number = 0;
    protected index: number = 0;
    protected count: number = 0;

    start(): void {
        this.map = cc_find("Canvas/map");
        this.space = (cc_view.getVisibleSize().width - 64 - this.num * this.bullet.data.width) / (this.num - 1);
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
        var bullet = cc_instantiate(this.bullet);
        noxcc.setX(bullet, 32 + (noxcc.w(bullet) + this.space) / 2 * (this.count % 2) + noxcc.w(bullet) / 2 + this.index * (this.space + noxcc.w(bullet)));
        noxcc.setY(bullet, cc_view.getVisibleSize().height + noxcc.h(bullet) / 2);
        bullet.parent = this.map;
        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(0, -this.speed);
        this.index++;
        if (this.index + this.count % 2 >= this.num) {
            this.index = 0;
            this.count++;
        }
    }
}