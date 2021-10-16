import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot6 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    @property({})
    speed: number = 350;

    @property({})
    num: number = 350;

    protected map: Node = null;
    protected dr: number = 0;
    protected index: number = 0;

    start(): void {
        this.map = cc_find("Canvas/map");
        this.dr = 2 * Math.PI / this.num;
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
        var bullet = cc_instantiate(this.bullet);
        noxcc.setPosAR(bullet, 637, 264);
        bullet.parent = this.map;
        var speedX = this.speed * Math.cos(this.index * this.dr);
        var speedY = this.speed * Math.sin(this.index * this.dr);
        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
        this.index++;
        if (this.index >= this.num) {
            this.index = 0;
        }
    }
}
