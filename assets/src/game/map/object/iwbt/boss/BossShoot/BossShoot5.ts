import { bits, Node, Rect, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_isValid, cc_macro, cc_view } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { noxSound } from "../../../../../../framework/core/noxSound";
import { BulletPrefabMgr } from "../../../../../BulletPrefabMgr";
import { ObjectGroup } from "../../../../../const/ObjectGroup";
import { MapUtil } from "../../../../MapUtil";
import { BaseObject } from "../../../BaseObject";
import { BossBullet } from "../BossBullet";
import { BossShootable } from "./BossShootable";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
export class BossShoot5 extends BaseObject implements BossShootable {
    private params: { bullet: string, speed1: number, speed2: number, count: number };

    protected bullets: Node[] = [];
    protected time1: number = 0;
    protected time2: number = 0;
    protected da: number = 0;
    protected radius: number = 0;
    protected count: number = 0;

    start(): void {
        this.bullets = [];
        this.time1 = (noxcc.w(this.map.node) - 32) / this.params.speed1;
        this.time2 = (noxcc.h(this.map.node) - 32) / this.params.speed2;
        this.da = 360 / this.params.count;
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
        //noxSound.playEffect("sound/iwbt/bossHit.mp3");
        this.count++;
        for (let i = 0; i < 3; i++) {
            let bullets: Node[] = [];
            let bullet = BulletPrefabMgr.currenton().createBullet(this.map, this.params.bullet, ObjectGroup.BossBullet1);
            bullets.push(bullet);
            noxcc.setX(bullet, -noxcc.w(bullet) - noxcc.aw(this.map.node));
            noxcc.setY(bullet, noxcc.h(this.map.node) * (i + 1) / 4 - noxcc.ah(this.map.node));
            noxcc.setParent(bullet, this.map.node);
            let speedX = this.params.speed1;
            let speedY = 0;
            bullet["__speedX"] = this.params.speed2;
            bullet["__speedY"] = 0;
            if (i % 2 == this.count % 2) {
                speedX = -speedX;
                bullet["__speedX"] = -this.params.speed2;
                bullet["__speedY"] = 0;
                bullet.angle = 180;
                noxcc.setX(bullet, noxcc.w(this.map.node) + noxcc.w(bullet) - noxcc.aw(this.map.node));
            }
            bullet.getComponent(BossBullet).setSpeed(speedX, speedY);
            this.bullets.push(bullet);
            this.scheduleOnce(() => {
                bullets[0].getComponent(BossBullet).setSpeed(0, 0);
                let angle = bullets[0].angle;
                let centreX = bullets[0].position.x - (((i + this.count) % 2) * 2 - 1) * this.radius;
                let centreY = bullets[0].position.y;
                let delay = 0;
                for (let i = 0; i < this.params.count - 1; i++) {
                    angle += this.da;
                    delay += 0.1;
                    let bullet = BulletPrefabMgr.currenton().createRawBullet(this.params.bullet);
                    let cos = Math.cos(angle * Math.PI / 180);
                    let sin = Math.sin(angle * Math.PI / 180);
                    noxcc.setX(bullet, centreX + this.radius * cos);
                    noxcc.setY(bullet, centreY + this.radius * sin);
                    bullet["__speedX"] = this.params.speed2 * cos;
                    bullet["__speedY"] = this.params.speed2 * sin;
                    bullet.angle = angle % 360;
                    bullets.push(bullet);
                    this.scheduleOnce(() => {
                        if (cc_isValid(bullet)) {
                            //noxSound.playEffect("sound/iwbt/bossHit.mp3");
                            MapUtil.addCircleCollider(bullet, this.map, ObjectGroup.BossBullet1, true, new Rect(0, 0, noxcc.w(bullet), noxcc.h(bullet)), 0);
                            MapUtil.setDynamicType(bullet);
                            noxcc.setParent(bullet, this.map.node);
                        }
                    }, delay);
                }
                this.scheduleOnce(() => {
                    for (let i = 0; i < this.params.count; i++) {
                        let bullet = bullets[i];
                        if (cc_isValid(bullet)) {
                            bullet.getComponent(BossBullet).setSpeed(bullet["__speedX"], bullet["__speedY"]);
                        }
                    }
                }, delay);
            }, this.time1);
        }
    }
}
