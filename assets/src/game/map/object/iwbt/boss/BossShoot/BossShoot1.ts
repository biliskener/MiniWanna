import { Component, Node, Prefab, RigidBody2D, Vec2, _decorator } from "cc";
import { cc_find, cc_instantiate } from "../../../../../../framework/core/nox";
import { noxcc } from "../../../../../../framework/core/noxcc";
import { Player } from "../../../Player";

const { ccclass, property } = _decorator;

@ccclass
export class BossShoot1 extends Component {
    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    @property({})
    speed: number = 350;

    protected map: Node = null;
    protected player: Node = null;

    start(): void {
        this.map = cc_find("Canvas/map");
    }

    // 开始发射
    public startShoot(): void {
        this.player = cc_find("Canvas/map/player");
        this.schedule(this.shoot, 0.2);
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
        var playerPos = this.player.getPosition();
        if (this.player.getComponent(Player).isDead()) {
            playerPos.x = 0;
            playerPos.y = 608;
        }
        var dx = playerPos.x - bullet.position.x;
        var dy = playerPos.y - bullet.position.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var speedX = dx / dist * this.speed;
        var speedY = dy / dist * this.speed;
        bullet.getComponent(RigidBody2D).linearVelocity = new Vec2(speedX, speedY);
    }
}