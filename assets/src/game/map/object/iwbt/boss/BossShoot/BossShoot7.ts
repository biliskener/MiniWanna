import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot7 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    // 子弹飞进来的速度
    @property({})
    speed1: number = 200;

    // 子弹飞出去的速度
    @property({})
    speed2: number = 350;

    // 子弹一圈的个数
    @property({})
    num: number = 12;

    protected map: Node = null;
    protected dr: number = 0;
    protected count: number = 0;
    protected value: number = 0;
    protected bullet1: Node = null;

    start(): void {
        this.map = cc_find("Canvas/map");
        this.dr = 2 * Math.PI / this.num;
        this.count = 0;
        this.value = 1;
    }

    // 开始发射
    public startShoot(): void {
        this.bullet1 = cc_instantiate(this.bullet);
        noxcc.setX(this.bullet1, cc_view.getVisibleSize().width / 2);
        noxcc.setY(this.bullet1, cc_view.getVisibleSize().height + noxcc.h(this.bullet1) / 2);
        this.bullet1.parent = this.map;
        this.bullet1.getComponent(RigidBody2D).linearVelocity = new Vec2(0, -this.speed1);
        var dist = (cc_view.getVisibleSize().height + this.bullet.data.height) / 2;
        var time = dist / this.speed1;
        var self = this;
        this.scheduleOnce(function () {
            self.bullet1.getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
            self.schedule(self.shoot, 0.1);
        }, time);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
        this.bullet1.getComponent(RigidBody2D).linearVelocity = new Vec2(0, this.speed1);

    }

    // 发射
    public shoot(): void {
        for (var i = 0; i < this.num; i++) {
            var bullet = cc_instantiate(this.bullet);
            noxcc.setPosAR(bullet, this.bullet1.position.x, this.bullet1.position.y);
            bullet.parent = this.map;
            var radian = i * this.dr - 0.04 * this.count;
            var speedX = this.speed2 * Math.cos(radian);
            var speedY = this.speed2 * Math.sin(radian);
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