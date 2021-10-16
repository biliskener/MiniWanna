import { Collider2D, Component, Node, PolygonCollider2D, Prefab, RigidBody2D, Vec2, Vec3, _decorator } from "cc";
import { cc_find, cc_instantiate, cc_tween } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { ObjectGroup } from "../../../../../const/ObjectGroup";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot2 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    @property({})
    speed: number = 100;

    protected map: Node = null;
    protected bullets: Node[] = [];

    start(): void {
        this.map = cc_find("Canvas/map");
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
        var bullet = cc_instantiate(this.bullet);
        // 修改 sensor 属性需要在设置 parent 之前才有效
        bullet.getComponent(Collider2D).sensor = false;
        bullet.getComponent(Collider2D).group = ObjectGroup.BossBullet2;
        noxcc.setPosAR(bullet, 755, 250);
        bullet.parent = this.map;
        var angle = Math.floor(Math.random() * 180) + 90;
        var radian = angle * Math.PI / 180;
        var speedX = this.speed * Math.cos(radian);
        var speedY = this.speed * Math.sin(radian);
        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
        this.bullets.push(bullet);
    }

    // 删除所有子弹
    public removeBullets(): void {
        for (var i = 0; i < this.bullets.length; i++) {
            let bullet = this.bullets[i];
            bullet.getComponent(Collider2D).enabled = false;
            cc_tween(bullet)
                .to(0.5, { scale: new Vec3(0.5, 0.5, 1) })
                .removeSelf()
                .start();
        }
        this.bullets = [];
    }
}