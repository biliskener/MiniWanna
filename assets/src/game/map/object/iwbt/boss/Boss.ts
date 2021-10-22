import { Node, Vec3, _decorator } from "cc";
import { cc_find, cc_tween } from "../../../../../framework/core/nox";
import { noxcc } from "../../../../../framework/core/noxcc";
import { ObjectGroup } from "../../../../const/ObjectGroup";
import { MapUtil } from "../../../MapUtil";
import { BaseObject } from "../../BaseObject";
import { Player } from "../../Player";
import { BossShootable } from "./BossShoot/BossShootable";
import { BossShoot1 } from "./BossShoot/BossShoot1";
import { BossShoot2 } from "./BossShoot/BossShoot2";
import { BossShoot3 } from "./BossShoot/BossShoot3";
import { BossShoot4 } from "./BossShoot/BossShoot4";
import { BossShoot5 } from "./BossShoot/BossShoot5";
import { BossShoot6 } from "./BossShoot/BossShoot6";
import { BossShoot7 } from "./BossShoot/BossShoot7";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
@disallowMultiple
export class Boss extends BaseObject {
    protected shoots: { type: { new(): BaseObject & BossShootable }, start: number, end: number }[] = [];
    protected successTime: number = 0;
    protected time: number = 0;
    protected success: boolean = false;
    protected player: Node = null;

    onLoad() {
        MapUtil.addBoxCollider(this.node, this.map, ObjectGroup.Block, true, null, 0);
    }

    start(): void {
        // 子弹发射的类型和时间
        this.shoots = [
            { type: BossShoot1, start: 5, end: 25 },
            { type: BossShoot2, start: 15, end: 35 },
            { type: BossShoot3, start: 25, end: 45 },
            { type: BossShoot4, start: 35, end: 55 },
            { type: BossShoot5, start: 45, end: 65 },
            //{ type: BossShoot6, start: 55, end: 75 },
            //{ type: BossShoot7, start: 70, end: 90 },
        ];

        // 通关的时间
        this.successTime = 92;
        // 时间
        this.time = 0;
        // 是否通关
        this.success = false;
        this.initBullet();
    }

    update(dt: number): void {
        if (this.player) {
            if (!this.player.getComponent(Player).isDead()) {
                if (this.time > this.successTime) {
                    // 通关，BOSS 缩小逃进传送门
                    if (!this.success) {
                        this.success = true;
                        noxcc.setZOrder(this.node, 1);
                        cc_tween(this.node)
                            .to(0.5, { scale: new Vec3(0.07, 0.07, 1) })
                            .to(0.5, { position: new Vec3(320, -272) })
                            .call(() => {
                                MapUtil.removeCollider(this.node);
                            })
                            .removeSelf()
                            .start();
                    }
                }
                else {
                    this.time += dt;
                }
            }
        }
        else {
            this.player = cc_find("player", this.map.node);
        }
    }

    // 初始化子弹
    protected initBullet(): void {
        for (var i = 0; i < this.shoots.length; i++) {
            var shootClass = this.shoots[i];
            let shoot = this.getComponent(shootClass.type);
            // 子弹开始发射
            this.scheduleOnce(() => {
                if (!this.player.getComponent(Player).isDead()) {
                    shoot.startShoot();
                }
            }, shootClass.start);
            // 子弹停止发射
            this.scheduleOnce(() => {
                if (!this.player.getComponent(Player).isDead()) {
                    shoot.stopShoot();
                }
            }, shootClass.end);
        }
    }
}
