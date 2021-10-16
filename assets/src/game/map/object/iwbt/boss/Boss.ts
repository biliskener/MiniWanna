import { Component, Node, Vec3, _decorator } from "cc";
import { cc_find, cc_tween } from "../../../../../framework/core/nox";
import { noxcc } from "../../../../../framework/core/noxcc";
import { Player } from "../../Player";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
@disallowMultiple
export class Boss extends Component {
    // BOSS
    @property({ type: Node })
    boss: Node = null;

    protected shoots: { [key: string]: number }[] = [];
    protected successTime: number = 0;
    protected time: number = 0;
    protected success: boolean = false;
    protected player: Node = null;

    start(): void {
        // 子弹发射的类型和时间
        this.shoots = [
            { type: 1, start: 5, end: 25 },
            { type: 2, start: 15, end: 35 },
            { type: 3, start: 25, end: 45 },
            { type: 4, start: 35, end: 55 },
            { type: 5, start: 45, end: 65 },
            { type: 6, start: 55, end: 75 },
            { type: 7, start: 70, end: 90 },
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
                        noxcc.setZOrder(this.boss, 1);
                        cc_tween(this.boss)
                            .to(0.5, { scale: new Vec3(0.07, 0.07, 1) })
                            .to(0.5, { position: new Vec3(320, -272) })
                            .call(() => {
                                this.boss.active = false;
                            })
                            .start();
                    }
                }
                else {
                    this.time += dt;
                }
            }
        }
        else {
            // 因为在地图 start 里创建玩家，在该组件 start 之后。
            this.player = cc_find("Canvas/map/player");
        }
    }

    // 初始化子弹
    protected initBullet(): void {
        let self = this;
        for (var i = 0; i < this.shoots.length; i++) {
            var shoot = this.shoots[i];
            let component = this.getComponent("BossShoot" + shoot.type);
            // 子弹开始发射
            this.scheduleOnce(function () {
                if (!self.player.getComponent(Player).isDead()) {
                    (component as any).startShoot();
                }
            }, shoot.start);
            // 子弹停止发射
            this.scheduleOnce(function () {
                if (!self.player.getComponent(Player).isDead()) {
                    (component as any).stopShoot();
                }
            }, shoot.end);
        }
    }
}
