import { Collider2D, Contact2DType, IPhysics2DContact, Node, PhysicsSystem2D, RigidBody, RigidBody2D, TiledMap, Vec2, Vec3, _decorator } from "cc";
import { noxcc } from "../../../../framework/core/noxcc";
import { MapUtil } from "../../../../game/map/MapUtil";
import { GameConfig, PhysicsEngineType } from "../../../config/GameConfig";
import { ObjectGroup } from "../../../const/ObjectGroup";
import { ObjectTag } from "../../../const/ObjectTag";
import { CollisionHit } from "../../collision/CollisionHit";
import { CollisionObject } from "../../collision/CollisionObject";
import { HitResponse } from "../../collision/HitResponse";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Platform extends BaseObject {
    public initSpeed: Vec2;    // 初始速度
    public currentSpeed: Vec2;

    protected touchingPlayer: Collider2D = null;
    protected touchingPosition: Vec3 = null;

    onLoad(): void {
        this.initSpeed = this.initSpeed || new Vec2(0, 0);
        this.currentSpeed = this.initSpeed.clone();
    }

    start(): void {
        for (let collider of this.getComponents(Collider2D)) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
    }

    update(dt: number): void {
        dt = Math.min(dt, 1.0 / 50);
        MapUtil.addMovement(this.node, this.currentSpeed.x * dt, this.currentSpeed.y * dt);
    }

    onEnable() {
        this.node.on('transform-changed', this._onNodeTransformChanged, this);
    }

    onDisable() {
        this.node.off('transform-changed', this._onNodeTransformChanged, this);
    }

    _onNodeTransformChanged(type) {
        if (PhysicsSystem2D.instance.stepping) {
            return;
        }

        if (type & Node.TransformBit.POSITION) {
            if (this.touchingPlayer) {
                noxcc.addXY(this.touchingPlayer.node, this.node.position.x - this.touchingPosition.x, this.node.position.y - this.touchingPosition.y);
                this.touchingPosition = this.node.position.clone();
            }
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag == ObjectTag.Foot) {
            this.touchingPlayer = otherCollider;
            this.touchingPosition = this.node.position.clone();
        }
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag == ObjectTag.Foot) {
            this.touchingPlayer = null;
            this.touchingPosition = null;
        }
    }

    public collision_solid(hit: CollisionHit): void {
        if (hit.bottom) {
            if (this.currentSpeed.y < 0) {
                this.currentSpeed.y = -this.currentSpeed.y;
            }
        }
        if (hit.top) {
            if (this.currentSpeed.y > 0) {
                this.currentSpeed.y = -this.currentSpeed.y;
            }
        }
        if (hit.left) {
            if (this.currentSpeed.x < 0) {
                this.currentSpeed.x = -this.currentSpeed.x;
            }
        }
        if (hit.right) {
            if (this.currentSpeed.x > 0) {
                this.currentSpeed.x = -this.currentSpeed.x;
            }
        }
    }

    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        return true;
    }

    public collision(other: CollisionObject, hit: CollisionHit): HitResponse {
        var otherCollider = other.node.getComponent(Collider2D);
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            return HitResponse.FORCE_MOVE;
        }
        else if (otherCollider.group == ObjectGroup.Block || otherCollider.group == ObjectGroup.Platform) {
            if (hit.bottom) {
                if (this.currentSpeed.y < 0) {
                    this.currentSpeed.y = -this.currentSpeed.y;
                }
            }
            if (hit.top) {
                if (this.currentSpeed.y > 0) {
                    this.currentSpeed.y = -this.currentSpeed.y;
                }
            }
            if (hit.left) {
                if (this.currentSpeed.x < 0) {
                    this.currentSpeed.x = -this.currentSpeed.x;
                }
            }
            if (hit.right) {
                if (this.currentSpeed.x > 0) {
                    this.currentSpeed.x = -this.currentSpeed.x;
                }
            }
            return HitResponse.CONTINUE;
        }
        return HitResponse.ABORT_MOVE;
    }

    public collision_tile(tile_attributes: number): void {
    }
}
