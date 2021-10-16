import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate, cc_macro, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot5 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    // 子弹飞进来的速度
    @property({})
    speed1: number = 150;

    // 子弹飞出去的速度
    @property({})
    speed2: number = 300;

    // 子弹一圈的个数
    @property({})
    num: number = 12;

    protected map: Node = null;
    protected bullets: Node[] = [];
    protected time1: number = 0;
    protected time2: number = 0;
    protected da: number = 0;
    protected radius: number = 0;
    protected count: number = 0;

    start(): void {
        this.map = cc_find("Canvas/map");
        this.bullets = [];
        this.time1 = (cc_view.getVisibleSize().width - 32) / this.speed1;
        this.time2 = (cc_view.getVisibleSize().height - 32) / this.speed2;
        this.da = 360 / this.num;
        this.radius = 19;
        this.count = 0;
    }

    // 开始发射
    public startShoot(): void {
        this.schedule(this.shoot, 8, cc_macro.REPEAT_FOREVER, 0.01);
    }

    // 停止发射
    public stopShoot(): void {
        this.unschedule(this.shoot);
    }

    // 发射
    public shoot(): void {
        this.count++;
        for (let i = 0; i < 3; i++) {
            let bullets: Node[] = [];
            bullets.push(cc_instantiate(this.bullet));
            noxcc.setX(bullets[0], -noxcc.w(bullets[0]));
            noxcc.setY(bullets[0], cc_view.getVisibleSize().height * (i + 1) / 4);
            bullets[0].parent = this.map;
            let speedX = this.speed1;
            let speedY = 0;
            (bullets[0] as any).speedX = this.speed2;
            (bullets[0] as any).speedY = 0;
            if (i % 2 == this.count % 2) {
                speedX = -speedX;
                (bullets[0] as any).speedX = -(bullets[0] as any).speedX;
                bullets[0].angle = 180;
                noxcc.setX(bullets[0], cc_view.getVisibleSize().width + noxcc.w(bullets[0]));
            }
            bullets[0].getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
            this.bullets.push(bullets[0]);
            this.scheduleOnce(() => {
                bullets[0].getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
                let angle = bullets[0].angle;
                let centreX = bullets[0].position.x - (((i + this.count) % 2) * 2 - 1) * this.radius;
                let centreY = bullets[0].position.y;
                let delay = 0;
                for (let i = 0; i < this.num - 1; i++) {
                    angle += this.da;
                    delay += 0.1;
                    let bullet = cc_instantiate(this.bullet);
                    let cos = Math.cos(angle * Math.PI / 180);
                    let sin = Math.sin(angle * Math.PI / 180);
                    noxcc.setX(bullet, centreX + this.radius * cos);
                    noxcc.setY(bullet, centreY + this.radius * sin);
                    (bullet as any).speedX = this.speed2 * cos;
                    (bullet as any).speedY = this.speed2 * sin;
                    bullet.angle = angle;
                    bullets.push(bullet);
                    this.scheduleOnce(() => {
                        bullet.parent = this.map;
                    }, delay);
                }
                this.scheduleOnce(() => {
                    for (let i = 0; i < this.num; i++) {
                        let bullet = bullets[i];
                        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2((bullet as any).speedX, (bullet as any).speedY);
                    }
                }, delay);
            }, this.time1);
        }
    }
}