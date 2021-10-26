import { Collider2D, Contact2DType, IPhysics2DContact, Node, PhysicsSystem2D, RigidBody, RigidBody2D, sp, TiledMap, Vec2, Vec3, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { noxcc } from "../../../../framework/core/noxcc";
import { noxSound } from "../../../../framework/core/noxSound";
import { MapUtil } from "../../../../game/map/MapUtil";
import { GameConfig, PhysicsEngineType } from "../../../config/GameConfig";
import { ObjectGroup } from "../../../const/ObjectGroup";
import { ObjectTag } from "../../../const/ObjectTag";
import { CollisionHit } from "../../collision/CollisionHit";
import { CollisionObject } from "../../collision/CollisionObject";
import { HitResponse } from "../../collision/HitResponse";
import { BaseObject } from "../BaseObject";
import { Player } from "../Player";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Platform extends BaseObject {
    public initSpeed: Vec2;         // 初始速度
    public currSpeedX: number = 0;
    public currSpeedY: number = 0;

    protected touchingPlayer: Collider2D = null;
    protected touchingPosition: Vec3 = null;

    protected contactList: IPhysics2DContact[] = [];

    setSpeed(x: number, y: number, force?: boolean) {
        if (force || this.currSpeedX != x || this.currSpeedY != y) {
            this.currSpeedX = x;
            this.currSpeedY = y;
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                var rigidBody = this.getComponent(RigidBody2D);
                var oldSpeedX = rigidBody.linearVelocity.x;
                var oldSpeedY = rigidBody.linearVelocity.y;
                var newSpeedX = this.currSpeedX / 40;
                var newSpeedY = this.currSpeedY / 40;
                rigidBody.linearVelocity = new Vec2(newSpeedX, newSpeedY);
                if (false && this.touchingPlayer) { // 下面的代码关掉，人物可能在平台上漂移，其实也对
                    var player = this.touchingPlayer.getComponent(Player);
                    if (player.getFirstFloor() == rigidBody) {  // 有此判断时，若两个对冲平台冲击时，人物会有漂移，是因为另一个平台碰到了角色的脚底。
                        var playerRigiBdody = this.touchingPlayer.getComponent(RigidBody2D);
                        playerRigiBdody.linearVelocity = playerRigiBdody.linearVelocity.clone().add2f(newSpeedX - oldSpeedX, newSpeedY - oldSpeedY);
                    }
                }
            }
        }
    }

    onLoad(): void {
        this.initSpeed = this.initSpeed || new Vec2(0, 0);
    }

    onEnable() {
        this.node.on('transform-changed', this._onNodeTransformChanged, this);
    }

    onDisable() {
        this.node.off('transform-changed', this._onNodeTransformChanged, this);
    }

    _onNodeTransformChanged(type) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.TUX) {
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
    }

    start(): void {
        for (let collider of this.getComponents(Collider2D)) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }
        this.setSpeed(this.initSpeed.x, this.initSpeed.y);
    }

    update(dt: number): void {
        dt = Math.min(dt, 1.0 / 50);

        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            let isLeftHit = false;
            let isRightHit = false;
            let isTopHit = false;
            let isBottomHit = false;
            for (var contact of this.contactList) {
                var selfIsA = contact.colliderA.node == this.node;
                var normal = contact.getManifold().localNormal;
                if (normal.x < -0.3) {
                    if (selfIsA) {
                        isLeftHit = true;
                    }
                    else {
                        isRightHit = true;
                    }
                }
                else if (normal.x > 0.3) {
                    if (selfIsA) {
                        isRightHit = true;
                    }
                    else {
                        isLeftHit = true;
                    }
                }
                if (normal.y < -0.3) {
                    if (selfIsA) {
                        isBottomHit = true;
                    }
                    else {
                        isTopHit = true;
                    }
                }
                else if (normal.y > 0.3) {
                    if (selfIsA) {
                        isTopHit = true;
                    }
                    else {
                        isBottomHit = true;
                    }
                }
            }

            var movementX = 0;
            var movementY = 0;
            var newSpeedX = this.currSpeedX;
            var newSpeedY = this.currSpeedY;
            if (isLeftHit && isRightHit) {
            }
            else if (!isLeftHit && !isRightHit) {
                movementX = this.currSpeedX * dt;
            }
            else if (isLeftHit && this.currSpeedX < 0) {
                newSpeedX *= -1;
            }
            else if (isRightHit && this.currSpeedX > 0) {
                newSpeedX *= -1;
            }
            else {
                movementX = this.currSpeedX * dt;
            }
            if (isBottomHit && isTopHit) {
            }
            else if (!isBottomHit && !isTopHit) {
                movementY = this.currSpeedY * dt;
            }
            else if (isBottomHit && this.currSpeedY < 0) {
                newSpeedY *= -1;
            }
            else if (isTopHit && this.currSpeedY > 0) {
                newSpeedY *= -1;
            }
            else {
                movementX = this.currSpeedX * dt;
            }
            this.setSpeed(newSpeedX, newSpeedY);
        }
        else {
            MapUtil.addMovement(this.node, this.currSpeedX * dt, this.currSpeedY * dt);
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag == ObjectTag.Foot) {
            this.touchingPlayer = otherCollider;
            this.touchingPosition = this.node.position.clone();
            this.touchingPlayer.getComponent(RigidBody2D).linearVelocity = this.getComponent(RigidBody2D).linearVelocity;
            noxSound.playEffect("sound/iwbt/wallum.wav");
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
