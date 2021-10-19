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
import { Collision } from "../collision/Collision";
import { cc_assert, CC_EDITOR, cc_instantiate, cc_isValid, cc_macro, cc_misc, cc_systemEvent, cc_tween, nox } from "../../../framework/core/nox";
import { Animation, assert, AudioClip, BoxCollider2D, Collider2D, Contact2DType, EventKeyboard, Game, IPhysics2DContact, KeyCode, Prefab, Rect, RigidBody2D, SystemEvent, TiledTile, Vec2, Vec3, _decorator } from "cc";
import { noxSound } from "../../../framework/core/noxSound";
import { ObjectGroup } from "../../const/ObjectGroup";
import { noxcc } from "../../../framework/core/noxcc";
import { PhysicsEngineType, GameConfig } from "../../config/GameConfig";
import { MapUtil } from "../../../game/map/MapUtil";
import { ObjectTag } from "../../const/ObjectTag";
import { Gate } from "./escape/Gate";
import { Bullet } from "./iwbt/Bullet";
import { BaseObject } from "./BaseObject";
import { Platform } from "./escape/Platform";
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

cc_macro.ENABLE_TILEDMAP_CULLING = false;

@ccclass
@disallowMultiple
export class Player extends BaseObject {
    private static gCurrenton: Player = null;
    public static currenton(): Player {
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

    private invincible: boolean;    // 是否无敌模式

    private leftButton: number;     // 是否按下左键
    private rightButton: number;    // 是否按下右键
    private jumpButton: boolean;    // 是否按下跳跃键
    private flipButton: boolean;    // 是否按下改变键
    private canFlip: boolean;       // 是否可以翻转
    private canJump: boolean;       // 是否可以在下一帧处理跳跃
    private canJump2: boolean;      // 是否可以二段跳
    private shootButton: boolean;   // 是否按下射击键
    private canShoot: boolean;      // 是否可以在下一帧发射子弹
    private canEnterGate: boolean;  // 是否可以进入门

    public playerWhite: boolean = false;    // 玩家是否为白色状态
    public playerStatus: PlayerStatus;      // 玩家状态
    public isRotating: boolean;             // 玩家是否在跟随地图旋转

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
    public touchingGates: Gate[] = [];

    public touchedFootColliders: { [key: string]: [Collider2D, Vec3] } = {};
    public touchedHeadColliders: { [key: string]: [Collider2D, Vec3] } = {};

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
        this.canEnterGate = false;
        this.playerStatus = PlayerStatus.PLAYER_IDLE;

        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            this.body = this.getComponent(RigidBody2D);
            this.speed = this.body.linearVelocity;
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
            case KeyCode.KEY_L:
                if (!this.jumpButton) {
                    this.canJump = true;
                    this.jumpButton = true;
                }
                break;
            case KeyCode.KEY_Z:
            case KeyCode.KEY_K:
                if (!this.shootButton) {
                    this.canShoot = true;
                    this.shootButton = true;
                }
                break;
            case KeyCode.ARROW_DOWN:
            case KeyCode.KEY_D:
                if (!this.flipButton) {
                    this.canFlip = true;
                    this.flipButton = true;
                }
                break;
            case KeyCode.ENTER:
                if (!this.canEnterGate) {
                    this.canEnterGate = true;
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
            case KeyCode.KEY_L:
                this.playerStopJump();
                this.jumpButton = false;
                break;
            case KeyCode.KEY_Z:
            case KeyCode.KEY_K:
                this.shootButton = false;
                break;
            case KeyCode.ARROW_DOWN:
            case KeyCode.KEY_D:
                this.canFlip = false;
                this.flipButton = false;
                break;
            case KeyCode.ENTER:
                this.canEnterGate = false;
                break;
        }
    }

    start() {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            for (let collider of this.getComponents(Collider2D)) {
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
        else if (nox.tableSize(this.touchedHeadColliders) > 0 && nox.tableSize(this.touchedFootColliders) > 0) {
            ++this.crushFrameCount;
            if (this.crushFrameCount >= 2) {
                this.killPlayer();
            }
        }
        else {
            this.crushFrameCount = 0;
        }

        if (this.playerStatus != PlayerStatus.PLAYER_DEATH &&
            this.playerStatus != PlayerStatus.PLAYER_ENTERGATE &&
            this.playerStatus != PlayerStatus.PLAYER_FLIPPING
        ) {
            var angle = this.getAngle();

            //1. 调整下落速度
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                this.speed = this.body.linearVelocity;
                switch (angle) {
                    case 0:
                        break;
                    case 90:
                        [this.speed.x, this.speed.y] = [this.speed.y, -this.speed.x];
                        break;
                    case 180:
                        this.speed.x = -this.speed.x;
                        this.speed.y = -this.speed.y;
                        break;
                    case 270:
                        [this.speed.x, this.speed.y] = [-this.speed.y, this.speed.x];
                        break;
                    default:
                        cc_assert(false);
                        break;
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
            if (this.leftButton) {
                if (GameConfig.useSpeedUp) {
                    this.speed.x = Math.max(-this.maxSpeed, this.speed.x - GameConfig.speedUpDistance * dt);
                }
                else {
                    this.speed.x = -this.maxSpeed;
                }
            }
            else if (this.rightButton) {
                if (GameConfig.useSpeedUp) {
                    this.speed.x = Math.min(this.maxSpeed, this.speed.x + GameConfig.speedUpDistance * dt);
                }
                else {
                    this.speed.x = this.maxSpeed;
                }
            }
            else {
                if (GameConfig.useSlowDown) {
                    if (this.speed.x > 0) {
                        this.speed.x = Math.max(0, this.speed.x - GameConfig.slowDownDistance * dt);
                    }
                    else if (this.speed.x < 0) {
                        this.speed.x = Math.min(0, this.speed.x + GameConfig.slowDownDistance * dt);
                    }
                }
                else {
                    this.speed.x = 0;
                }
            }

            //6. 处理跳跃
            this.playerJump();

            //7. 处理角色动画
            if (nox.tableSize(this.touchedFootColliders) || this.isHitBottom) {
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
                if (!GameConfig.applyHorizontalSpeed) {
                    noxcc.addX(this.node, this.speed.x * dt);
                    this.speed.x = 0;
                }
                //8.2 速度应用到物理引擎
                switch (angle) {
                    case 0:
                        break;
                    case 90:
                        [this.speed.x, this.speed.y] = [-this.speed.y, this.speed.x];
                        break;
                    case 180:
                        this.speed.x = -this.speed.x;
                        this.speed.y = -this.speed.y;
                        break;
                    case 270:
                        [this.speed.x, this.speed.y] = [this.speed.y, -this.speed.x];
                        break;
                    default:
                        cc_assert(false);
                        break;
                }
                this.body.linearVelocity = this.speed;
            }
            else {
                //9. 调整位移
                var collisionObject = this.getComponent(CollisionObject);
                var speed = this.speed.clone().rotate(cc_misc.degreesToRadians(angle));
                var speedX = speed.x;
                var speedY = speed.y;
                var mov = new Vec2(speedX * dt, speedY * dt);
                collisionObject.set_movement(mov);
            }
        }
        else {
        }

        if (this.canFlip) {
            this.canFlip = false;
            if (this.playerStatus != PlayerStatus.PLAYER_DEATH &&
                this.playerStatus != PlayerStatus.PLAYER_ENTERGATE
            ) {
                if (this.checkCanFlip()) {
                    this.startFlip();
                }
            }
        }
        else if (this.canEnterGate) {
            this.canEnterGate = false;
            if (this.playerStatus == PlayerStatus.PLAYER_IDLE) {
                for (var gate of this.touchingGates) {
                    let isSameAngle = this.checkGateAndMapSameAngle(gate);
                    if (isSameAngle) {
                        this.setPlayerStatus(PlayerStatus.PLAYER_ENTERGATE);
                        gate.enterGate();
                        break;
                    }
                }
            }
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
        if (this.playerWhite) {
            return [ObjectGroup.Platform, ObjectGroup.Block, ObjectGroup.BlockWhite];
        }
        else {
            return [ObjectGroup.Platform, ObjectGroup.Block, ObjectGroup.BlockBlack];
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (selfCollider.tag == ObjectTag.Foot) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                this.touchedFootColliders[otherCollider.uuid] = [otherCollider, otherCollider.node.position.clone()];
            }
        }
        else if (selfCollider.tag == ObjectTag.Head) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                this.touchedHeadColliders[otherCollider.uuid] = [otherCollider, otherCollider.node.position.clone()];
            }
        }
        else {
            if (otherCollider.group == ObjectGroup.Spike) {
                this.killPlayer();
            }
        }
    }

    private onEndContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (selfCollider.tag == ObjectTag.Foot) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                delete this.touchedFootColliders[otherCollider.uuid];
            }
        }
        else if (selfCollider.tag == ObjectTag.Head) {
            var groudObjectGroups = this.getGroundObjectGroups();
            if (groudObjectGroups.indexOf(otherCollider.group) >= 0) {
                delete this.touchedHeadColliders[otherCollider.uuid];
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
                    if (GameConfig.useIwbtLevels) {
                        anim.play('playerIdle');
                    }
                    else if (this.playerWhite) {
                        anim.play('idle_02');
                    }
                    else {
                        anim.play('idle_01');
                    }
                    break;
                case PlayerStatus.PLAYER_RUNNING:
                    if (GameConfig.useIwbtLevels) {
                        anim.play('playerRunning');
                    }
                    else if (this.playerWhite) {
                        anim.play('running_02');
                    }
                    else {
                        anim.play('running_01');
                    }
                    break;
                case PlayerStatus.PLAYER_JUMP:
                    if (GameConfig.useIwbtLevels) {
                        anim.play('playerJump');
                    }
                    else if (this.playerWhite) {
                        anim.play('jump_02');
                    }
                    else {
                        anim.play('jump_01');
                    }
                    break;
                case PlayerStatus.PLAYER_FALL:
                    if (GameConfig.useIwbtLevels) {
                        anim.play('playerFall');
                    }
                    else if (this.playerWhite) {
                        anim.play('fall_02');
                    }
                    else {
                        anim.play('fall_01');
                    }
                    break;
                case PlayerStatus.PLAYER_FLIPPING:
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
            noxSound.play(this.shootSound);
        }
    }

    // 玩家跳跃 
    private playerJump(): void {
        if (this.canJump) {
            if (nox.tableSize(this.touchedFootColliders) > 0 || this.isHitBottom) {
                if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D && GameConfig.applyVerticalForce) {
                    var forceX = 0;
                    var forceY = 0;
                    switch (this.getAngle()) {
                        case 0:
                            forceY = this.jump * GameConfig.jumpForceFactor;
                            break;
                        case 90:
                            forceX = -this.jump * GameConfig.jumpForceFactor;
                            break;
                        case 180:
                            forceY = -this.jump * GameConfig.jumpForceFactor;
                            break;
                        case 270:
                            forceX = this.jump * GameConfig.jumpForceFactor;
                            break;
                        default:
                            cc_assert(false);
                            break;
                    }
                    this.getComponent(RigidBody2D).applyForceToCenter(new Vec2(forceX, forceY), true);
                }
                else {
                    this.speed.y = this.jump;
                }
                if (GameConfig.enableUseJump2) {
                    this.canJump2 = true;
                }
                noxSound.play(this.jumpSound);
            }
            else if (this.canJump2) {
                this.canJump2 = false;
                // 下降阶段才能二段跳
                if (this.playerStatus == PlayerStatus.PLAYER_FALL) {
                    this.speed.y = this.jump2;
                    noxSound.play(this.dJumpSound);
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
        if (!force && this.invincible) return;

        var sceneId = SceneManager.getRunningSceneId();
        if (sceneId == SceneId.select) {
            this.restartScene();
        }
        else if (sceneId == SceneId.end) {
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
                // GM8 的 I wanna 引擎是 20 帧，每帧 40 个血，会比较卡，改成 32 帧，每帧 25 个血。  
                if (GameConfig.useIwbtLevels) {
                    noxSound.playEffect("sound/escape/onDeath.mp3");
                    this.node.setScale(0, 0);
                    this.schedule(this.bloodEmitter, 0.01, 32, 0.01);
                    this.schedule(() => {
                        LevelScene.currenton().reloadLevel();
                    }, 1, 0, 1.5);
                }
                else {
                    noxSound.playEffect("sound/escape/BgsRoleDie.mp3");
                    noxcc.setNodeOpacity(this.node, 0);
                    var animation = this.getDeadAnim();
                    noxcc.setZOrder(animation.node, 1);
                    animation.node.active = true;
                    animation.play("dead");
                    this.schedule(() => {
                        animation.node.active = false;
                        LevelScene.currenton().reloadLevel();
                    }, 1, 0, animation.defaultClip.duration + 0.5);
                }
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

    public checkCanRotateMap(targetAngle: number): boolean {
        return this.playerStatus != PlayerStatus.PLAYER_DEATH
            && this.playerStatus != PlayerStatus.PLAYER_ENTERGATE
            && this.playerStatus != PlayerStatus.PLAYER_FLIPPING
            && !this.isRotating
            && this.map.canRotateMap(targetAngle);
    }

    public startRotateMap(targetAngle: number): void {
        if (GameConfig.useIwbtLevels) {
        }
        else {
            this.map.requestPause();

            var mapNode = this.map.node;

            this.isRotating = true;
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                this.getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
            }
            else {
                this.speed.set(0, 0);
            }
            var newAnchor = new Vec2(0.5, 0.5);
            var oldAnchor = noxcc.anchor(this.node);    // 保存旧的锚点, 应该为脚下
            var cposInSelf = noxcc.cpos(this.node);     // 节点中心点的位置(相对于自己的锚点)
            var cposInParent = noxcc.convertPosAR(cposInSelf, this.node, mapNode); // 节点中心点的位置(相对于父的锚点)
            noxcc.setAnchor(this.node, newAnchor);      // 修改自己的锚点到中心
            noxcc.setPosAR(this.node, cposInParent);    // 中心位置对齐
            this.map.startRotate(targetAngle, () => {
                this.setAngle((360 - targetAngle) % 360);// 节点绕中心旋转
                this.isRotating = false;
                this.map.cancelPause();
                var anchorPosInSelf = oldAnchor.clone().subtract(newAnchor).multiply2f(noxcc.w(this.node), noxcc.h(this.node)); // 旧的锚点的坐标(相对于自己的锚点)
                var anchorPosInParent = noxcc.convertPosAR(anchorPosInSelf, this.node, mapNode);                                // 旧的锚点的坐标(相对于父的锚点)
                noxcc.setAnchor(this.node, oldAnchor);          // 设置为旧的锚点
                noxcc.setPosAR(this.node, anchorPosInParent);   // 锚点位置对齐
            });
        }
    }

    private checkCanFlip(): boolean {
        var angle = this.getAngle();
        if (!this.isHitBottom && nox.tableSize(this.touchedFootColliders) == 0) return false;

        var bbox: Rect = null;
        if (true) {
            var collider = this.getComponent(BoxCollider2D);
            bbox = new Rect(
                collider.offset.x - collider.size.width / 2,
                collider.offset.y - collider.size.height / 2,
                collider.size.width,
                collider.size.height
            );

            // 碰撞区域转换到相对于地图的矩形区域
            bbox = noxcc.convertRectAR(bbox, this.node, this.map.node);

            // 翻转后的碰撞区域
            var tw = GameConfig.tileWidth;
            var th = GameConfig.tileHeight;
            if (angle == 0) {
                var height = bbox.height;
                var bottom = Math.round(bbox.yMin / th) * th;
                bbox.y = bottom - Collision.DELTA - height;
            }
            else if (angle == 90) {
                var width = bbox.width;
                var right = Math.round(bbox.xMax / tw) * tw;
                bbox.x = right + Collision.DELTA;
            }
            else if (angle == 180) {
                var height = bbox.height;
                var top = Math.round(bbox.yMax / th) * th;
                bbox.y = top + Collision.DELTA;
            }
            else if (angle == 270) {
                var width = bbox.width;
                var left = Math.round(bbox.xMin / tw) * tw;
                bbox.x = left - Collision.DELTA - width;
            }
            else {
                cc_assert(false, "fatal error");
            }
        }

        var tile: TiledTile = null;
        var tiledMap = this.map.getTiledMap();
        var layers = tiledMap.getLayers();
        for (var layer of layers) {
            var rect = this.map.getRectOfOverlappingTiles(layer, bbox);
            for (var x = rect.xMin; x <= rect.xMax; ++x) {
                for (var y = rect.yMin; y <= rect.yMax; ++y) {
                    var tile2 = this.map.getTileAt(layer, x, y);
                    if (tile2 && tile2.grid != 0 &&
                        tile2.grid != GameConfig.gravityLeftTile &&
                        tile2.grid != GameConfig.gravityRightTile &&
                        tile2.grid != GameConfig.gravityDownTile &&
                        tile2.grid != GameConfig.gravityUpTile) {
                        if (tile && tile.grid != tile2.grid) {
                            return false;
                        }
                        else {
                            tile = tile2;
                        }
                    }
                }
            }
        }

        if (tile) {
            var allPlatforms = this.map.allPlatforms;
            for (var key in allPlatforms) {
                var platform = allPlatforms[key];
                var collider2 = platform.getComponent(BoxCollider2D);
                var bbox2 = new Rect(
                    collider2.offset.x - collider2.size.width / 2,
                    collider2.offset.y - collider2.size.height / 2,
                    collider2.size.width,
                    collider2.size.height
                );
                bbox2 = noxcc.convertRectAR(bbox2, platform.node, this.map.node);
                if (bbox.intersects(bbox2)) {
                    tile = null;
                    break;
                }
            }
        }

        if (tile) {
            if (tile.grid == GameConfig.blackTile && !this.playerWhite) {
                return true;
            }
            else if (tile.grid == GameConfig.whiteTile && this.playerWhite) {
                return true;
            }
        }

        return false;
    }

    public startFlip(): void {
        if (GameConfig.useIwbtLevels) {
        }
        else {
            this.map.requestPause();

            this.setPlayerStatus(PlayerStatus.PLAYER_FLIPPING);
            if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
                this.getComponent(RigidBody2D).linearVelocity = new Vec2(0, 0);
            }
            else {
                this.speed.set(0, 0);
            }
            cc_tween(this._animation.node)
                .to(0.3, { scale: new Vec3(this._animation.node.scale.x, 0, this._animation.node.scale.z) })
                .call(() => {
                    this.setWhite(!this.playerWhite);
                    this.setAngle((this.getAngle() + 180) % 360);
                    this.setPlayerStatus(PlayerStatus.PLAYER_IDLE, true);
                })
                .to(0.3, { scale: new Vec3(this._animation.node.scale.x, 1, this._animation.node.scale.z) })
                .call(() => {
                    this.map.startFlip(() => {
                        this.setPlayerStatus(PlayerStatus.PLAYER_IDLE, true);
                        this.map.cancelPause();
                        if (GameData.INSTANCE.flipedRotateAngle) {
                            if (this.checkCanRotateMap(GameData.INSTANCE.flipedRotateAngle)) {
                                this.startRotateMap(GameData.INSTANCE.flipedRotateAngle);
                            }
                            GameData.INSTANCE.flipedRotateAngle = 0;
                        }
                    });
                })
                .start();
        }
    }

    public collision_solid(hit: CollisionHit): void {
        hit = hit.convert_by_angle(this.getAngle());
        this.isHitLeft = this.isHitLeft || hit.left;
        this.isHitRight = this.isHitRight || hit.right;
        this.isHitBottom = this.isHitBottom || hit.bottom;
        this.isHitTop = this.isHitTop || hit.top;
        this.isCrush = this.isCrush || hit.crush;
    }

    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        hit = hit.convert_by_angle(this.getAngle());
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
            hit = hit.convert_by_angle(this.getAngle());
            if (hit.bottom) {
            }
        }
        return HitResponse.CONTINUE;
    }

    public collision_tile(tile_attributes: number): void {
        if (tile_attributes & TileAttribute.HURTS) {
            this.isDying = true;
        }
    }

    public checkGateAndMapSameAngle(gate: Gate): boolean {
        var map = this.map;
        var objectGroup = map.tiledMap.getObjectGroup("Transfer");
        var gateName = gate.gateName;
        var gateObject = objectGroup.getObject(gateName);

        if (gateObject.gid == GameConfig.teleportTile) {
            return true;
        }

        var gateAngle = map.getGateAngleAndColor(gateObject.gid)[0];
        var mapAngle = (map.getAngle() + 360) % 360;
        if (gateAngle == mapAngle) {
            return true;
        }
        return false;
    }

    public getDeadAnim() {
        var animation = noxcc.findAnimation("dead", this.map.node.parent.parent);
        cc_assert(animation);
        return animation;
    }

    public getAngle() {
        return this.node.angle;
    }

    public setAngle(angle: number) {
        this.node.angle = angle;
    }

    public setWhite(isWhite: boolean, force?: boolean) {
        if (this.playerWhite != isWhite || force) {
            this.playerWhite = isWhite;
            for (var key of nox.keys(this.touchedFootColliders)) {
                var [collider] = this.touchedFootColliders[key];
                if (this.getGroundObjectGroups().indexOf(collider.group) < 0) {
                    delete this.touchedFootColliders[key];
                }
            }
            for (var key of nox.keys(this.touchedHeadColliders)) {
                var [collider] = this.touchedHeadColliders[key];
                if (this.getGroundObjectGroups().indexOf(collider.group) < 0) {
                    delete this.touchedHeadColliders[key];
                }
            }
            for (let collider of this.getComponents(Collider2D)) {
                collider.group = isWhite ? ObjectGroup.PlayerWhite : ObjectGroup.PlayerBlack;
            }
        }
    }

    public pause() {
        this._animation.pause();
    }

    public resume() {
        this._animation.resume();
    }
}
