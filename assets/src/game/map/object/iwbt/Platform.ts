import { Collider2D, Contact2DType, IPhysics2DContact, Node, PhysicsSystem2D, RigidBody, RigidBody2D, sp, TiledMap, Vec2, Vec3, _decorator } from "cc";
import { cc_assert, cc_director } from "../../../../framework/core/nox";
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
    public initSpeed: Vec2;         // 初始速度
    public currSpeedX: number = 0;
    public currSpeedY: number = 0;

    protected touchingPlayer: Collider2D = null;
    protected touchingPosition: Vec3 = null;
    protected isLeftHit: boolean = false;
    protected isRightHit: boolean = false;
    protected isTopHit: boolean = false;
    protected isBottomHit: boolean = false;

    protected contactList: IPhysics2DContact[] = [];

    setSpeed(speedX: number, speedY: number) {
        this.currSpeedX = speedX;
        this.currSpeedY = speedY;
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            this.getComponent(RigidBody2D).linearVelocity = new Vec2(this.currSpeedX / 40, this.currSpeedY / 40);
        }
    }

    onLoad(): void {
        this.initSpeed = this.initSpeed || new Vec2(0, 0);
        this.currSpeedX = this.initSpeed.x;
        this.currSpeedY = this.initSpeed.y;
    }

    start(): void {
        for (let collider of this.getComponents(Collider2D)) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
        this.setSpeed(this.currSpeedX, this.currSpeedY);
    }

    update(dt: number): void {
        dt = Math.min(dt, 1.0 / 50);

        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            for (var contact of this.contactList) {
                var points = contact.getWorldManifold().points;
                var point = points[0];
                point = noxcc.worldToLocal(this.node.parent, point);
                if (this.node.position.x < point.x) {
                    this.isRightHit = true;
                }
                else if (this.node.position.x > point.x) {
                    this.isLeftHit = true;
                }
                if (this.node.position.y + 8 < point.y) {
                    this.isTopHit = true;
                }
                else if (this.node.position.y + 8 < point.y) {
                    this.isBottomHit = true;
                }
            }

            var movementX = 0;
            var movementY = 0;
            var newSpeedX = this.currSpeedX;
            var newSpeedY = this.currSpeedY;
            if (this.isLeftHit && this.isRightHit) {
            }
            else if (!this.isLeftHit && !this.isRightHit) {
                movementX = this.currSpeedX * dt;
            }
            else if (this.isLeftHit && this.currSpeedX < 0) {
                newSpeedX *= -1;
            }
            else if (this.isRightHit && this.currSpeedX > 0) {
                newSpeedX *= -1;
            }
            else {
                movementX = this.currSpeedX * dt;
            }
            if (this.isBottomHit && this.isTopHit) {
            }
            else if (!this.isBottomHit && !this.isTopHit) {
                movementY = this.currSpeedY * dt;
            }
            else if (this.isBottomHit && this.currSpeedY < 0) {
                newSpeedY *= -1;
            }
            else if (this.isTopHit && this.currSpeedY > 0) {
                newSpeedY *= -1;
            }
            else {
                movementX = this.currSpeedX * dt;
            }
            if (true || newSpeedX != this.currSpeedX || newSpeedY != this.currSpeedY) {
                this.setSpeed(newSpeedX, newSpeedY);
            }
        }
        else {
            MapUtil.addMovement(this.node, this.currSpeedX * dt, this.currSpeedY * dt);
        }

        this.isLeftHit = false;
        this.isRightHit = false;
        this.isTopHit = false;
        this.isBottomHit = false;
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
        else if (otherCollider.group == ObjectGroup.Block || otherCollider.group == ObjectGroup.Platform) {
            if (contact) {
                this.contactList.push(contact);
            }
        }
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag == ObjectTag.Foot) {
            this.touchingPlayer = null;
            this.touchingPosition = null;
        }
        else if (otherCollider.group == ObjectGroup.Block || otherCollider.group == ObjectGroup.Platform) {
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                cc_assert(contact);
                var index = this.contactList.indexOf(contact);
                if (index >= 0) {
                    this.contactList.splice(index, 1);
                }
                else {
                    cc_assert(false);
                }
            }
        }
    }

    public collision_solid(hit: CollisionHit): void {
        if (hit.bottom) {
            if (this.currSpeedY < 0) {
                this.currSpeedY = -this.currSpeedY;
            }
        }
        if (hit.top) {
            if (this.currSpeedY > 0) {
                this.currSpeedY = -this.currSpeedY;
            }
        }
        if (hit.left) {
            if (this.currSpeedX < 0) {
                this.currSpeedX = -this.currSpeedX;
            }
        }
        if (hit.right) {
            if (this.currSpeedX > 0) {
                this.currSpeedX = -this.currSpeedX;
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
                if (this.currSpeedY < 0) {
                    this.currSpeedY = -this.currSpeedY;
                }
            }
            if (hit.top) {
                if (this.currSpeedY > 0) {
                    this.currSpeedY = -this.currSpeedY;
                }
            }
            if (hit.left) {
                if (this.currSpeedX < 0) {
                    this.currSpeedX = -this.currSpeedX;
                }
            }
            if (hit.right) {
                if (this.currSpeedX > 0) {
                    this.currSpeedX = -this.currSpeedX;
                }
            }
            return HitResponse.CONTINUE;
        }
        return HitResponse.ABORT_MOVE;
    }

    public collision_tile(tile_attributes: number): void {
    }
}
