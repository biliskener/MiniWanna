import { Collider2D, Component, IPhysics2DContact, RigidBody2D, Sprite, SpriteFrame, Vec2, _decorator } from "cc";
import { GameConfig } from "../../../config/GameConfig";
import { ObjectTag } from "../../../const/ObjectTag";

const { ccclass, property } = _decorator;

@ccclass
export class Blood extends Component {

    @property({ type: SpriteFrame })
    frames: SpriteFrame[] = [];

    public speedX: number = 0;
    protected body: RigidBody2D = null;

    start(): void {
        // 根据 GM8 上 I wanna 引擎逻辑，血图片为 3 张之一，重力为 0.1~0.3 像素/帧^2，方向为 0~350 度（间隔10度），初始速度为 0~6 像素/帧
        this.body = this.getComponent(RigidBody2D);
        var index = Math.floor(Math.random() * 3);
        this.getComponent(Sprite).spriteFrame = this.frames[index];
        var speed = Math.random() * 6 * GameConfig.speedFactor;
        var direction = Math.floor(Math.random() * 36) * 10;
        var gravity = 0.1 + Math.random() * 0.2;
        this.body.gravityScale = gravity / 0.4;
        var speedX = speed * Math.cos(direction * Math.PI / 180);
        var speedY = speed * Math.sin(direction * Math.PI / 180);
        this.body.linearVelocity = new Vec2(speedX, speedY);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        // 血与方块碰撞后，速度和重力都为 0，停留在方块上
        this.body = this.getComponent(RigidBody2D);
        this.body.linearVelocity = new Vec2(0, 0);
        this.body.gravityScale = 0;
    }
}
