import { Collider2D, Contact2DType, IPhysics2DContact, Node, PhysicsSystem2D, RigidBody, RigidBody2D, TiledMap, Vec2, Vec3, _decorator } from "cc";
import { cc_assert, cc_tween } from "../../../../framework/core/nox";
import { noxcc } from "../../../../framework/core/noxcc";
import { noxSound } from "../../../../framework/core/noxSound";
import { MapUtil } from "../../../../game/map/MapUtil";
import { GameConfig, PhysicsEngineType } from "../../../config/GameConfig";
import { ObjectGroup } from "../../../const/ObjectGroup";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { CollisionHit } from "../../collision/CollisionHit";
import { CollisionObject } from "../../collision/CollisionObject";
import { HitResponse } from "../../collision/HitResponse";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

type PlatformParams = {
    actionType?: string,        // 动作类型
    duration?: number,          // 动作时长
    startDelay?: number,        // 转场开始的停顿时间
    stopDelay: number,          // 转场结束的停顿时间
    rotateAngle?: number,       // 旋转角度
    moveX?: number,             // X移动距离
    moveY?: number,             // Y移动距离
    isLoop?: boolean,           // 是否循环
    initMoving?: boolean,       // 起始时是否移动
}

@ccclass
@disallowMultiple
export class Platform extends BaseObject {
    public currentSpeed: Vec2;

    protected params: PlatformParams;
    protected startPostion: Vec3;
    protected stopPostion: Vec3;
    protected startAngle: number;
    protected stopAngle: number;
    protected duration: number;
    protected isMoving: boolean = false;        // 是否正在移动
    protected isBackToBegin: boolean = false;   // 是否返回起点

    protected touchingPlayer: Collider2D = null;
    protected touchingPosition: Vec3 = null;

    private setSpeed(x: number, y: number) {
        this.currentSpeed = new Vec2(x, y);
    }

    onLoad(): void {
        this.currentSpeed = new Vec2(0, 0);
    }

    start(): void {
        if (this.params.actionType == "move") {
            var tiledMap = this.map.getTiledMap();
            cc_assert(tiledMap);
            var layer = tiledMap.getLayer("Layer2");
            var tileSize = layer.getMapTileSize();
            this.startPostion = this.node.position.clone();
            this.stopPostion = this.startPostion.clone().add3f((this.params.moveX || 0) * tileSize.width, (-this.params.moveY || 0) * tileSize.height, 0);
            this.duration = this.params.duration || 0;
            this.isMoving = false;
            this.isBackToBegin = false;
        }
        else if (this.params.actionType == "rotate") {
            this.startAngle = this.node.angle;
            this.stopAngle = this.startAngle + (this.params.rotateAngle || 0);
            this.duration = this.params.duration || 0;
            this.isMoving = false;
            this.isBackToBegin = false;
        }
        else if (this.params.actionType == "loop_move") {
            var tiledMap = this.map.getTiledMap();
            cc_assert(tiledMap);
            var layer = tiledMap.getLayer("Layer2");
            var tileSize = layer.getMapTileSize();
            this.startPostion = this.node.position.clone();
            this.stopPostion = this.startPostion.clone().add3f((this.params.moveX || 0) * tileSize.width, (-this.params.moveY || 0) * tileSize.height, 0);
            this.duration = this.params.duration || 0;
            this.isMoving = false;
            this.isBackToBegin = false;
        }
        else {
            cc_assert(false, this.params.actionType);
        }

        for (let collider of this.getComponents(Collider2D)) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
        }

        this.map.addPlatform(this);

        this.syncState();
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

    private syncState() {
        if (!this.params) {
            return;
        }
        var state = GameData.INSTANCE.savedData.getObjectState(this.map.levelName, this.node.name);
        if (state) {
            if (this.params.actionType == "move") {
                this.node.setPosition(this.stopPostion);
            }
            else if (this.params.actionType == "rotate") {
                this.node.angle = this.stopAngle;
            }
            else if (this.params.actionType == "loop_move") {
                this.isMoving = !this.params.initMoving;
                this.isBackToBegin = true;
            }
            else {
                cc_assert(false, this.params.actionType);
            }
        }
        else {
            if (this.params.actionType == "move") {
            }
            else if (this.params.actionType == "rotate") {
            }
            else if (this.params.actionType == "loop_move") {
                this.isMoving = !!this.params.initMoving;
                this.isBackToBegin = true;
            }
            else {
                cc_assert(false, this.params.actionType);
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

    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        var otherCollider = other.node.getComponent(Collider2D);
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            return true;
        }
        else {
            return false;
        }
    }

    public collision(other: CollisionObject, hit: CollisionHit): HitResponse {
        var otherCollider = other.node.getComponent(Collider2D);
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            return HitResponse.FORCE_MOVE;
        }
        else {
            return HitResponse.ABORT_MOVE;
        }
    }

    public collision_solid(hit: CollisionHit): void {
    }

    public collision_tile(tile_attributes: number): void {
    }

    update(dt: number): void {
        dt = Math.min(dt, 1.0 / 50);

        if (this.params.actionType == "move") {
        }
        else if (this.params.actionType == "rotate") {
        }
        else if (this.params.actionType == "loop_move") {
            while (this.isMoving && dt > 0) {
                var srcPosition = this.isBackToBegin ? this.stopPostion : this.startPostion;
                var dstPosition = this.isBackToBegin ? this.startPostion : this.stopPostion;
                var totalDistance = dstPosition.clone().subtract(srcPosition).length();
                var curPosition = new Vec3(this.node.position.x, this.node.position.y);
                var distance = dstPosition.clone().subtract(curPosition).length();
                var speedValue = totalDistance / this.duration;
                var speedVector = dstPosition.clone().subtract(srcPosition).normalize().multiplyScalar(speedValue);
                if (dt * speedValue >= distance) {
                    this.isBackToBegin = !this.isBackToBegin;
                    this.setSpeed(-speedVector.x, -speedVector.y);
                    MapUtil.addMovement(this.node, dstPosition.x - curPosition.x, dstPosition.y - curPosition.y);
                    dt -= distance / speedValue;
                }
                else {
                    this.setSpeed(speedVector.x, speedVector.y);
                    MapUtil.addMovement(this.node, speedVector.x * dt, speedVector.y * dt);
                    dt = 0;
                }
            }
        }
        else {
            cc_assert(false, this.params.actionType);
        }
    }

    doTransition(callback: () => any, first: boolean) {
        var beginCallback = () => {
            if (first) {
                noxSound.playEffect("sound/escape/BgsSwitchActive.mp3");
                this.map.startVibrate(this.params.duration || 0.5);
            }
        };
        var doneCallback = () => {
            GameData.INSTANCE.savedData.setObjectState(this.map.levelName, this.node.name, 1);
            this.syncState();
            callback && callback();
        };
        if (this.params.actionType == "move") {
            var startDelay = this.params.startDelay || 0.5;
            var stopDelay = this.params.stopDelay || 1;
            cc_tween(this.node)
                .delay(startDelay).call(beginCallback)
                .by(this.params.duration, {
                    position: new Vec3(
                        (this.params.moveX || 0) * GameConfig.tileWidth,
                        (this.params.moveY || 0) * GameConfig.tileHeight
                    )
                })
                .delay(stopDelay).call(doneCallback)
                .start();
        }
        else if (this.params.actionType == "rotate") {
            var startDelay = this.params.startDelay || 0.5;
            var stopDelay = this.params.stopDelay || 1;
            cc_tween(this.node)
                .delay(startDelay).call(beginCallback)
                .by(this.params.duration, { angle: this.params.rotateAngle })
                .delay(stopDelay).call(doneCallback)
                .start();
        }
        else if (this.params.actionType == "loop_move") {
            var startDelay = this.params.startDelay || 0;
            var stopDelay = this.params.stopDelay || 0;
            if (startDelay || stopDelay) {
                cc_tween(this.node)
                    .delay(startDelay).call(beginCallback)
                    .repeat(5, cc_tween(this.node).hide().delay(2.0 / 10).show().delay(2.0 / 10))
                    .delay(stopDelay).call(doneCallback)
                    .start();
            }
            else {
                doneCallback();
            }
        }
        else {
            cc_assert(false, this.params.actionType);
        }
    }
}
