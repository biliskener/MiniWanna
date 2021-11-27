import { GameData } from "../../data/GameData";
import { SceneManager } from "../../../framework/base/SceneManager";
import { LevelScene } from "../../ui/scene/LevelScene";
import { SceneId } from "../../const/SceneId";
import { SelectScene } from "../../ui/scene/SelectScene";
import { CollisionObject } from "../collision/CollisionObject";
import { CollisionHit } from "../collision/CollisionHit";
import { HitResponse } from "../collision/HitResponse";
import { TileAttribute } from "../collision/TileAttribute";
import { PlayerStatus } from "./PlayerStatus";
import { cc_assert, CC_EDITOR, cc_instantiate, cc_macro, cc_systemEvent, nox } from "../../../framework/core/nox";
import { Animation, assert, AudioClip, Collider2D, Contact2DType, EventKeyboard, IPhysics2DContact, KeyCode, Prefab, RigidBody2D, SystemEvent, SystemEventType, Vec2, Vec3, _decorator } from "cc";
import { noxSound } from "../../../framework/core/noxSound";
import { ObjectGroup } from "../../const/ObjectGroup";
import { noxcc } from "../../../framework/core/noxcc";
import { PhysicsEngineType, GameConfig } from "../../config/GameConfig";
import { MapUtil } from "../../../game/map/MapUtil";
import { ObjectTag } from "../../const/ObjectTag";
import { Bullet } from "./iwbt/Bullet";
import { BaseObject } from "./BaseObject";
import { Platform } from "./iwbt/Platform";
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Player extends BaseObject {
    private static gCurrenton: Player = null;
    public static get CURRENTON(): Player {
        return Player.gCurrenton;
    }

    @property({})
    jump: number = 7;     // 跳跃的高度

    @property({})
    jump2: number = 7;      // 二段跳的高度

    @property({})
    maxSpeed: number = 4.5;   // 最大水平速度

    //@property({})
    gravity: Vec2 = new Vec2(0, 0);  // 重力

    @property({})
    maxVspeed: number = 7.5;  // 最大垂直速度

    // 血
    @property({ type: Prefab })
    blood: Prefab = null;

    // 子弹
    @property({ type: Prefab })
    bullet: Prefab = null;

    // 跳跃音效
    @property({ type: AudioClip })
    jumpSound: AudioClip = null;

    // 二段跳音效
    @property({ type: AudioClip })
    dJumpSound: AudioClip = null;

    // 死亡音效
    @property({ type: AudioClip })
    deathSound: AudioClip = null;

    // 射击音效
    @property({ type: AudioClip })
    shootSound: AudioClip = null;

    public invincible: boolean;     // 是否无敌模式

    private leftButton: number;     // 是否按下左键
    private rightButton: number;    // 是否按下右键
    private jumpButton: boolean;    // 是否按下跳跃键
    private canJump: boolean;       // 是否可以在下一帧处理跳跃
    private canJump2: boolean;      // 是否可以二段跳
    private shootButton: boolean;   // 是否按下射击键
    private canShoot: boolean;      // 是否可以在下一帧发射子弹

    public playerStatus: PlayerStatus;      // 玩家状态

    private body: RigidBody2D;              // 获取刚体组件
    private speed: Vec2;                    // 获取刚体速度
    private playerDeathPos: Vec3;           // 死亡位置

    private isHitBottom: boolean = false;
    private isHitTop: boolean = false;
    private isHitLeft: boolean = false;
    private isHitRight: boolean = false;
    private isCrush: boolean = false;
    private crushFrameCount: number = 0;

    public isDying: boolean = false;

    public touchedFootColliders: Collider2D[] = [];
    public touchedFootPositions: Vec3[] = [];
    public touchedHeadColliders: Collider2D[] = [];
    public touchedHeadPositions: Vec3[] = [];

    private _animation: Animation;

    // use this for initialization
    onLoad(): void {
        assert(Player.gCurrenton == null)
        Player.gCurrenton = this;

        this._animation = this.node.getChildByName("sprite").getComponent(Animation);
        cc_assert(this._animation);

        this.invincible = false;

        // 转换单位 
        this.jump *= GameConfig.speedFactor;
        this.jump2 *= GameConfig.speedFactor;
        this.maxSpeed *= GameConfig.speedFactor;
        this.maxVspeed *= GameConfig.speedFactor;

        // 监听键盘按下和释放事件 

        cc_systemEvent.on(SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc_systemEvent.on(SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.leftButton = 0;
        this.rightButton = 0;
        this.canJump2 = false;
        this.jumpButton = false;
        this.shootButton = false;
        this.playerStatus = PlayerStatus.PLAYER_IDLE;

        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            this.body = this.getComponent(RigidBody2D);
            this.speed = this.body.linearVelocity.clone();
            this.gravity = new Vec2(0, GameConfig.gravity * this.body.gravityScale);
        }
        else {
            this.body = this.getComponent(RigidBody2D);
            this.speed = new Vec2(0, 0);
            this.gravity = new Vec2(0, GameConfig.gravity);
        }
    }

    onCleanup(): void {
        if (CC_EDITOR) return;
        if (Player.gCurrenton == this) {
            Player.gCurrenton = null;
        }
        else {
            cc_assert(false, "impossible");
        }
    }

    // 键盘按下 
    private onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_S:
                this.leftButton = 1;
                this.rightButton = 0;
                break;
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_F:
                this.rightButton = 1;
                this.leftButton = 0;
                break;
            case KeyCode.ARROW_UP:
            case KeyCode.SHIFT_LEFT:
            case KeyCode.KEY_K:
                if (!this.jumpButton) {
                    this.canJump = true;
                    this.jumpButton = true;
                }
                break;
            case KeyCode.KEY_Z:
            case KeyCode.KEY_J:
                if (!this.shootButton) {
                    this.canShoot = true;
                    this.shootButton = true;
                }
                break;
            case KeyCode.KEY_R:
                this.restartScene();
                break;
            case KeyCode.KEY_Q:
                this.killPlayer(true);
                break;
        }
    }

    // 键盘释放
    private onKeyUp(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.ARROW_LEFT:
            case KeyCode.KEY_S:
                this.leftButton = 0;
                break;
            case KeyCode.ARROW_RIGHT:
            case KeyCode.KEY_F:
                this.rightButton = 0;
                break;
            case KeyCode.ARROW_UP:
            case KeyCode.SHIFT_LEFT:
            case KeyCode.KEY_K:
                this.playerStopJump();
                this.jumpButton = false;
                break;
            case KeyCode.KEY_Z:
            case KeyCode.KEY_J:
                this.shootButton = false;
                break;
        }
    }

    start() {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            for (let collider of this.getComponents(Collider2D)) {
                collider.apply();
                collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
                collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
            }
        }
    }

    update(dt: number): void {
        if (this.map.isPaused()) {
            return;
        }

        dt = Math.min(dt, 1.0 / 50);

        if (this.isCrush || this.isDying) {
            this.killPlayer();
        }
        else if (this.touchedHeadColliders.length > 0 && this.touchedFootColliders.length > 0) {
            ++this.crushFrameCount;
            if (this.crushFrameCount >= 2) {
                this.killPlayer();
            }
        }
        else {
            this.crushFrameCount = 0;
        }

        if (this.playerStatus != PlayerStatus.PLAYER_DEATH &&
            this.playerStatus != PlayerStatus.PLAYER_ENTERGATE
        ) {
            //1. 调整下落速度
            var firstFloor = this.getFirstFloor();
            if (this.touchedFootColliders.length > 0) {
                firstFloor = this.touchedFootColliders[0].getComponent(RigidBody2D);
            }
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                if (firstFloor) {
                    this.speed = new Vec2(firstFloor.linearVelocity.x, this.body.linearVelocity.y);
                }
                else {
                    this.speed = this.body.linearVelocity.clone();
                }
            }
            else {
                this.speed.x += this.gravity.x * dt;
                this.speed.y += this.gravity.y * dt;
            }

            //2. 限制下落速度
            this.speed.y = Math.max(this.speed.y, -this.maxVspeed);
            if (this.isHitTop) {
                this.speed.y = Math.min(this.speed.y, 0);
            }

            //3. 调整角色方向
            if (this.leftButton) {
                noxcc.setScaleX(this._animation.node, -Math.abs(this.node.scale.x));
            }
            else if (this.rightButton) {
                noxcc.setScaleX(this._animation.node, Math.abs(this.node.scale.x));
            }

            //4. 调整水平速度
            var platformSpeedX = firstFloor ? firstFloor.linearVelocity.x : 0;
            if (this.leftButton) {
                if (GameConfig.useSpeedUp) {
                    this.speed.x = Math.max(platformSpeedX - this.maxSpeed, this.speed.x - this.maxSpeed / GameConfig.speedUpDuration * dt);
                }
                else {
                    this.speed.x = platformSpeedX - this.maxSpeed;
                }
            }
            else if (this.rightButton) {
                if (GameConfig.useSpeedUp) {
                    this.speed.x = Math.min(platformSpeedX + this.maxSpeed, this.speed.x + this.maxSpeed / GameConfig.speedUpDuration * dt);
                }
                else {
                    this.speed.x = platformSpeedX + this.maxSpeed;
                }
            }
            else {
                if (GameConfig.useSlowDown) {
                    if (this.speed.x > platformSpeedX) {
                        this.speed.x = Math.max(platformSpeedX, this.speed.x - this.maxSpeed / GameConfig.slowDownDuration * dt);
                    }
                    else if (this.speed.x < platformSpeedX) {
                        this.speed.x = Math.min(platformSpeedX, this.speed.x + this.maxSpeed / GameConfig.slowDownDuration * dt);
                    }
                }
                else {
                    this.speed.x = platformSpeedX + 0;
                }
            }

            //6. 处理跳跃
            this.playerJump();

            //7. 处理角色动画
            if (this.touchedFootColliders.length > 0 || this.isHitBottom) {
                if (this.leftButton || this.rightButton) {
                    this.setPlayerStatus(PlayerStatus.PLAYER_RUNNING);
                }
                else {
                    this.setPlayerStatus(PlayerStatus.PLAYER_IDLE);
                }
            }
            else {
                if (this.speed.y < 0) {
                    this.setPlayerStatus(PlayerStatus.PLAYER_FALL);
                }
                else if (this.speed.y > 0) {
                    this.setPlayerStatus(PlayerStatus.PLAYER_JUMP);
                }
            }

            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                if (this.speed.y < 0) {
                    this.body.gravityScale = GameConfig.fallGravityScale;
                }
                else if (this.jumpButton) {
                    this.body.gravityScale = GameConfig.jumpGravityScale;
                }
                else {
                    this.body.gravityScale = GameConfig.riseGravityScale;
                }
                //8.1 若不应用水平速度则直接修改位移
                if (!GameConfig.applyHorizontalSpeed && !GameConfig.applyHorizontalImpulse) {
                    noxcc.addX(this.node, this.speed.x * dt);
                    this.speed.x = 0;
                }
                //8.2 速度应用到物理引擎
                if (GameConfig.applyHorizontalImpulse) {
                    if (this.body.linearVelocity.x != this.speed.x) {
                        var horzImpulse = (this.speed.x - this.body.linearVelocity.x) * this.body.getMass();
                        this.body.applyLinearImpulseToCenter(new Vec2(horzImpulse, 0), true);
                    }
                }
                else {
                    this.body.linearVelocity = this.speed;
                }
            }
            else {
                //9. 调整位移
                var collisionObject = this.getComponent(CollisionObject);
                var speed = this.speed.clone();
                var speedX = speed.x;
                var speedY = speed.y;
                var mov = new Vec2(speedX * dt, speedY * dt);
                collisionObject.set_movement(mov);
            }
        }
        else {
        }

        if (this.canShoot) {
            this.canShoot = false;
            if (this.playerStatus != PlayerStatus.PLAYER_DEATH && this.playerStatus != PlayerStatus.PLAYER_ENTERGATE) {
                this.playerShoot();
            }
        }

        // 清空碰撞块
        this.isHitLeft = false;
        this.isHitRight = false;
        this.isHitTop = false;
        this.isHitBottom = false;
        this.isCrush = false;
    }

    private getGroundObjectGroups() {
        return [ObjectGroup.Platform, ObjectGroup.Block];
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (selfCollider.tag == ObjectTag.Foot) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                this.touchedFootColliders.push(otherCollider);
                this.touchedFootPositions.push(otherCollider.node.position.clone());
            }
        }
        else if (selfCollider.tag == ObjectTag.Head) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                this.touchedHeadColliders.push(otherCollider);
                this.touchedHeadPositions.push(otherCollider.node.position.clone());
            }
        }
        else {
            if (otherCollider.group == ObjectGroup.Spike || otherCollider.group == ObjectGroup.BossBullet1 || otherCollider.group == ObjectGroup.BossBullet2) {
                if (!GameConfig.invincibleMode && !this.invincible) {
                    this.isDying = true;
                }
            }
        }
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (selfCollider.tag == ObjectTag.Foot) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                var index = this.touchedFootColliders.indexOf(otherCollider);
                if (index >= 0) {
                    this.touchedFootColliders.splice(index, 1);
                    this.touchedFootPositions.splice(index, 1);
                }
            }
        }
        else if (selfCollider.tag == ObjectTag.Head) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                var index = this.touchedHeadColliders.indexOf(otherCollider);
                if (index >= 0) {
                    this.touchedHeadColliders.splice(index, 1);
                    this.touchedHeadPositions.splice(index, 1);
                }
            }
        }
    }

    // 设置玩家状态
    public setPlayerStatus(status: PlayerStatus, force?: boolean): void {
        if (force || this.playerStatus != status) {
            this.playerStatus = status;
            var anim = this._animation;
            switch (status) {
                case PlayerStatus.PLAYER_IDLE:
                    anim.play('playerIdle');
                    break;
                case PlayerStatus.PLAYER_RUNNING:
                    anim.play('playerRunning');
                    break;
                case PlayerStatus.PLAYER_JUMP:
                    anim.play('playerJump');
                    break;
                case PlayerStatus.PLAYER_FALL:
                    anim.play('playerFall');
                    break;
            }
        }
    }

    // 玩家发射 
    private playerShoot(): void {
        // 最多同时存在 4 颗子弹 
        if (Bullet.count < 4) {
            var bullet = cc_instantiate(this.bullet);
            bullet.parent = this.map.node;
            bullet.setPosition(this.node.position.x, this.node.position.y + noxcc.h(this.node) / 3);
            var body = bullet.getComponent(RigidBody2D);
            body.linearVelocity = new Vec2(body.linearVelocity.x *= this.node.scale.x, 0);
            noxSound.playEffect("sound/iwbt/shoot.wav");
        }
    }

    // 玩家跳跃 
    private playerJump(): void {
        if (this.canJump) {
            if (this.touchedFootColliders.length > 0 || this.isHitBottom) {
                if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D && GameConfig.applyVerticalForce) {
                    var targetSpeedY = GameConfig.betterJump2Speed ? this.jump + Math.max(0, -this.body.linearVelocity.y) : this.jump;
                    this.getComponent(RigidBody2D).applyForceToCenter(new Vec2(0, targetSpeedY * GameConfig.jumpForceFactor), true);
                }
                else {
                    this.speed.y = this.jump;
                }
                if (GameConfig.enableUseJump2) {
                    this.canJump2 = true;
                }
                noxSound.playEffect("sound/iwbt/jump.wav");
            }
            else if (this.canJump2) {
                this.canJump2 = false;
                // 下降阶段才能二段跳
                if (this.playerStatus == PlayerStatus.PLAYER_FALL) {
                    if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D && GameConfig.applyVerticalForce) {
                        var targetSpeedY = GameConfig.betterJump2Speed ? this.jump2 + Math.max(0, -this.body.linearVelocity.y) : this.jump2;
                        this.getComponent(RigidBody2D).applyForceToCenter(new Vec2(0, targetSpeedY * GameConfig.jumpForceFactor), true);
                    }
                    else {
                        this.speed.y = this.jump2;
                    }
                    noxSound.playEffect("sound/iwbt/dJump.wav");
                }
            }
            this.canJump = false;
        }
        else if (this.isHitTop) {
            // 顶部有接触时禁止二阶段跳
            this.canJump2 = false;
        }
    }

    // 玩家结束跳跃
    private playerStopJump(): void {
        if (this.speed.y > 0) {
            // 纵向速度变成 0.45 倍，所以提早松开跳跃键就会导致跳跃高度比较低。
            this.speed.y *= 0.45;
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                this.body.linearVelocity = this.speed;
            }
        }
    }

    // 杀死玩家
    private killPlayer(force?: boolean): void {
        var sceneId = SceneManager.getRunningSceneId();
        if (sceneId == SceneId.select) {
            this.schedule(() => {
                this.restartScene();
            });
        }
        else {
            if (this.playerStatus != PlayerStatus.PLAYER_DEATH) {
                this.setPlayerStatus(PlayerStatus.PLAYER_DEATH);
                GameData.INSTANCE.currSavedData.addDeathCount();

                // 玩家重力和速度都为0，并且隐藏。
                // PS：因为是血是在该脚本创建，所以不能将 active 设为 false。
                this.speed = new Vec2(0, 0);
                if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                    this.body.linearVelocity = this.speed;
                    this.body.gravityScale = 0;
                }
                else {
                    MapUtil.removeCollider(this.node);
                }

                this.playerDeathPos = this.node.getPosition();
                noxSound.playEffect("sound/iwbt/break.wav");
                this.node.setScale(0, 0);
                this.schedule(this.bloodEmitter, 0.01, 32, 0.01);
                this.schedule(() => {
                    LevelScene.CURRENTON.reloadLevel();
                }, 1, 0, 1.5);
            }
        }
    }

    // 重启场景
    private restartScene(): void {
        switch (SceneManager.getRunningSceneId()) {
            case SceneId.level:
                SceneManager.replaceScene(LevelScene.create());
                break;
            case SceneId.select:
                SceneManager.replaceScene(SelectScene.create());
                break;
            default:
                cc_assert(false, "not supported");
                break;
        }
    }

    // 血喷射 
    private bloodEmitter(): void {
        for (var i = 0; i < 25; i++) {
            var blood = cc_instantiate(this.blood);
            blood.parent = this.map.node;
            blood.setPosition(this.playerDeathPos.x, this.playerDeathPos.y + noxcc.h(this.node) / 2);
        }
    }

    // 是否死亡 
    public isDead(): boolean {
        return this.playerStatus == PlayerStatus.PLAYER_DEATH;
    }

    public collision_solid(hit: CollisionHit): void {
        this.isHitLeft = this.isHitLeft || hit.left;
        this.isHitRight = this.isHitRight || hit.right;
        this.isHitBottom = this.isHitBottom || hit.bottom;
        this.isHitTop = this.isHitTop || hit.top;
        this.isCrush = this.isCrush || hit.crush;
    }

    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        return true;
    }

    public collision(other: CollisionObject, hit: CollisionHit): HitResponse {
        var platform = other.getComponent(Platform);
        if (platform) {
            this.isHitLeft = this.isHitLeft || hit.left;
            this.isHitRight = this.isHitRight || hit.right;
            this.isHitBottom = this.isHitBottom || hit.bottom;
            this.isHitTop = this.isHitTop || hit.top;
            this.isCrush = this.isCrush || hit.crush;
        }
        return HitResponse.CONTINUE;
    }

    public collision_tile(tile_attributes: number): void {
        if (tile_attributes & TileAttribute.HURTS) {
            this.isDying = true;
        }
    }

    public getFirstFloor(): RigidBody2D {
        var firstFloor: RigidBody2D = null;
        if (this.touchedFootColliders.length > 0) {
            firstFloor = this.touchedFootColliders[0].getComponent(RigidBody2D);
        }
        return firstFloor;
    }

    public pause() {
        this._animation.pause();
    }

    public resume() {
        this._animation.resume();
    }
}
