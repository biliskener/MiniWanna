import { BoxCollider2D, CircleCollider2D, Collider2D, EPhysics2DDrawFlags, ERigidBody2DType, Layers, Node, PhysicsSystem2D, PolygonCollider2D, Rect, RigidBody2D, Size, TiledTile, Vec2 } from "cc";
import { PhysicsEngineType, GameConfig } from "../../game/config/GameConfig";
import { GameObject } from "../../game/map/collision/GameObject";
import { CollisionObject } from "../../game/map/collision/CollisionObject";
import { ObjectGroup } from "../../game/const/ObjectGroup";
import { TileObject } from "../../game/map/object/TileObject";
import { GameMap } from "../../game/map/GameMap";
import { ObjectTag } from "../../game/const/ObjectTag";
import { noxScheduler } from "../../framework/core/noxScheduler";
import { cc_assert, cc_find } from "../../framework/core/nox";
import { noxcc } from "../../framework/core/noxcc";

export module MapUtil {
    export function initColliderEngine(): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            // 开启物理引擎
            let manager = PhysicsSystem2D.instance;
            manager.enable = true;
            if (GameConfig.usePhysicsDraw) {
                manager.debugDrawFlags = /*EPhysics2DDrawFlags.Aabb |
                    EPhysics2DDrawFlags.Pair |
                    EPhysics2DDrawFlags.CenterOfMass |
                    EPhysics2DDrawFlags.Joint |*/
                    EPhysics2DDrawFlags.Shape;
            }

            // 2.2.1 版本之前不能在 start 里开启物理引擎。
            // 设置重力
            // GM8 的 I wanna 引擎的重力为 0.4 像素/帧^2，换算下就是 1000 像素/秒^2
            manager.gravity = new Vec2(0, GameConfig.gravity);
        }
        else {
            let manager = PhysicsSystem2D.instance;
            manager.enable = true;
            if (GameConfig.usePhysicsDraw) {
                manager.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
                    EPhysics2DDrawFlags.Pair |
                    EPhysics2DDrawFlags.CenterOfMass |
                    EPhysics2DDrawFlags.Joint |
                    EPhysics2DDrawFlags.Shape;
                noxScheduler.scheduleOnce(() => {
                    let draw: Node = cc_find("Canvas/PHYSICS_2D_DEBUG_DRAW");
                    draw.layer = Layers.Enum.UI_2D;
                }, 0);
            }
        }
    }

    export function initPhysicsLayer(physics: Node): void {
        var colliders = physics.getComponents(BoxCollider2D);
        for (let i = 0; i < colliders.length; ++i) {
            var collider = colliders[i];
            collider.offset.x -= 800 / 2;
            collider.offset.y -= 608 / 2;
            collider.apply();
        }
    }

    function addRigidBody(node: Node, group: number, enabledContactListener: boolean): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            var body = node.addComponent(RigidBody2D);
            body.group = group;
            body.fixedRotation = true;
            body.gravityScale = 0;
            body.type = ERigidBody2DType.Static;
            if (enabledContactListener) {
                body.enabledContactListener = true;
            }
        }
        else if (GameConfig.physicsEngineType == PhysicsEngineType.TUX) {
        }
    }

    function removeRigidBody(node: Node): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            node.removeComponent(RigidBody2D);
        }
        else if (GameConfig.physicsEngineType == PhysicsEngineType.TUX) {
        }
    }

    export function addCollisionObject(node: Node, map: GameMap): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.TUX) {
            var collider = node.getComponent(Collider2D);
            var tiledTile = node.getComponent(TiledTile);
            if (ObjectGroup.BlockAll.indexOf(collider.group) >= 0 && tiledTile && GameConfig.useBlockTileAsObject) {
                node.addComponent(TileObject);
                node.addComponent(CollisionObject).setMap(map);
                node.addComponent(GameObject);
            }
            else if (collider.group == ObjectGroup.Spike && tiledTile && GameConfig.useSpikeTileAsObject) {
                //由cocos碰撞管理器处理
                //node.addComponent(TileObject);
                //node.addComponent(CollisionObject);
                //node.addComponent(GameObject);
            }
            else if (!tiledTile) {
                if ([ObjectGroup.Platform].concat(ObjectGroup.BlockAll).concat(ObjectGroup.PlayerAll).indexOf(collider.group) >= 0) {
                    node.addComponent(CollisionObject).setMap(map);
                    node.addComponent(GameObject);
                }
            }
        }
    }

    export function removeCollisionObject(node: Node): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.TUX) {
            node.removeComponent(GameObject);
            node.removeComponent(TileObject);
            node.removeComponent(CollisionObject);
        }
    }

    export function addBoxCollider(node: Node, map: GameMap, group: number, enabledContactListener: boolean, rc: Rect, angle: number): BoxCollider2D {
        addRigidBody(node, group, enabledContactListener);

        angle = angle || 0;
        var width: number;
        var height: number;
        var offsetX: number;
        var offsetY: number;
        if (!rc) {
            width = noxcc.w(node);
            height = noxcc.h(node);
            offsetX = noxcc.cx(node);
            offsetY = noxcc.cy(node);
        }
        else if (angle == 0) {
            width = rc.width;
            height = rc.height;
            offsetX = rc.center.x - noxcc.aw(node);
            offsetY = rc.center.y - noxcc.ah(node);
        }
        else if (angle == 90) {
            width = rc.height;
            height = rc.width;
            offsetX = rc.center.y - noxcc.aw(node);
            offsetY = rc.center.x - noxcc.aw(node);
        }
        else if (angle == 180) {
            width = rc.width;
            height = rc.height;
            offsetX = noxcc.aright(node) - rc.center.x;
            offsetY = noxcc.atop(node) - rc.center.y;
        }
        else if (angle == 270) {
            width = rc.height;
            height = rc.width;
            offsetX = noxcc.aright(node) - rc.center.y;
            offsetY = noxcc.atop(node) - rc.center.x;
        }
        else {
            cc_assert(false);
        }

        let collider = node.addComponent(BoxCollider2D);
        collider.group = group;
        collider.offset = new Vec2(offsetX, offsetY);
        collider.size = new Size(width, height);
        collider.sensor = group == ObjectGroup.Trigger || group == ObjectGroup.Spike || group == ObjectGroup.BossBullet1 || group == ObjectGroup.BossBullet2;
        collider.tag = ObjectTag.Default;
        MapUtil.applyCollider(collider);
        addCollisionObject(node, map);
        return collider;
    }

    export function addFootBoxCollider(node: Node, group: number, rc: Rect, cornerWidth: number, cornerHeight: number) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            if (rc) {
                rc = new Rect(rc.x + cornerWidth, rc.y - GameConfig.platformMovementFix, rc.width - cornerWidth * 2, cornerHeight);
            }
            else {
                rc = new Rect(cornerWidth, 0, noxcc.w(node) - cornerWidth * 2, cornerHeight);
            }

            var width = rc.width;
            var height = rc.height;
            var offsetX = rc.center.x - noxcc.aw(node);
            var offsetY = rc.center.y - noxcc.ah(node);

            let collider = node.addComponent(BoxCollider2D);
            collider.group = group;
            collider.offset = new Vec2(offsetX, offsetY);
            collider.size = new Size(width, height);
            collider.sensor = true;
            collider.tag = ObjectTag.Foot;
            MapUtil.applyCollider(collider);
        }
    }

    export function addHeadBoxCollider(node: Node, group: number, rc: Rect, cornerWidth: number, cornerHeight: number) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            if (rc) {
                rc = new Rect(rc.x + cornerWidth, rc.y + rc.height - cornerHeight, rc.width - cornerWidth * 2, cornerHeight);
            }
            else {
                rc = new Rect(cornerWidth, noxcc.h(node) - cornerHeight, noxcc.w(node) - cornerWidth * 2, cornerHeight);
            }

            var width = rc.width;
            var height = rc.height;
            var offsetX = rc.center.x - noxcc.aw(node);
            var offsetY = rc.center.y - noxcc.ah(node);

            let collider = node.addComponent(BoxCollider2D);
            collider.group = group;
            collider.offset = new Vec2(offsetX, offsetY);
            collider.size = new Size(width, height);
            collider.sensor = true;
            collider.tag = ObjectTag.Head;
            MapUtil.applyCollider(collider);
        }
    }

    export function addCircleCollider(node: Node, map: GameMap, group: number, enabledContactListener: boolean, rc: Rect, angle: number): CircleCollider2D {
        addRigidBody(node, group, enabledContactListener);

        angle = angle || 0;
        var width: number;
        var height: number;
        var offsetX: number;
        var offsetY: number;
        if (!rc) {
            width = noxcc.w(node);
            height = noxcc.h(node);
            offsetX = noxcc.cx(node);
            offsetY = noxcc.cy(node);
        }
        else if (angle == 0) {
            width = rc.width;
            height = rc.height;
            offsetX = rc.center.x - noxcc.aw(node);
            offsetY = rc.center.y - noxcc.ah(node);
        }
        else if (angle == 90) {
            width = rc.height;
            height = rc.width;
            offsetX = rc.center.y - noxcc.aw(node);
            offsetY = rc.center.x - noxcc.aw(node);
        }
        else if (angle == 180) {
            width = rc.width;
            height = rc.height;
            offsetX = noxcc.aright(node) - rc.center.x;
            offsetY = noxcc.atop(node) - rc.center.y;
        }
        else if (angle == 270) {
            width = rc.height;
            height = rc.width;
            offsetX = noxcc.aright(node) - rc.center.y;
            offsetY = noxcc.atop(node) - rc.center.x;
        }
        else {
            cc_assert(false);
        }

        let collider = node.addComponent(CircleCollider2D);
        collider.group = group;
        collider.offset = new Vec2(offsetX, offsetY);
        collider.radius = width / 2;
        collider.sensor = group == ObjectGroup.Trigger || group == ObjectGroup.Spike || group == ObjectGroup.BossBullet1 || group == ObjectGroup.BossBullet2;
        collider.tag = ObjectTag.Default;
        MapUtil.applyCollider(collider);
        addCollisionObject(node, map);
        return collider;
    }

    export function addPolygonCollider(node: Node, map: GameMap, group: number, enabledContactListener: boolean, points: Vec2[]): PolygonCollider2D {
        addRigidBody(node, group, enabledContactListener);

        var offsetX: number;
        var offsetY: number;
        offsetX = noxcc.cw(node) - noxcc.aw(node);
        offsetY = noxcc.ch(node) - noxcc.ah(node);

        var newPoints: Vec2[] = [];
        for (var point of points) {
            newPoints.push(new Vec2(point.x - noxcc.cw(node), point.y - noxcc.ch(node)));
        }

        let collider = node.addComponent(PolygonCollider2D);
        collider.group = group;
        collider.offset = new Vec2(offsetX, offsetY);
        collider.points = newPoints;
        collider.sensor = group == ObjectGroup.Trigger || group == ObjectGroup.Spike || group == ObjectGroup.BossBullet1 || group == ObjectGroup.BossBullet2;
        collider.tag = ObjectTag.Default;
        MapUtil.applyCollider(collider);
        addCollisionObject(node, map);
        return collider;
    }

    export function addTiledBoxCollider(tile: TiledTile, map: GameMap, group: number, enabledContactListener: boolean, tileSize: Size, width: number, height: number): BoxCollider2D {
        addRigidBody(tile.node, group, enabledContactListener);

        let collider = tile.node.addComponent(BoxCollider2D);
        collider.group = group;
        collider.offset = new Vec2(
            tileSize.width / 2 - noxcc.aw(tile.node.parent),
            tileSize.height / 2 - noxcc.ah(tile.node.parent)
        );
        collider.size = new Size(width, height);
        collider.sensor = group == ObjectGroup.Trigger;
        collider.tag = ObjectTag.Default;
        MapUtil.applyCollider(collider);
        addCollisionObject(tile.node, map);
        return collider;
    }

    export function addTiledCircleCollider(tile: TiledTile, map: GameMap, group: number, enabledContactListener: boolean, tileSize: Size, width: number, height: number): CircleCollider2D {
        cc_assert(width == height);

        addRigidBody(tile.node, group, enabledContactListener);

        let collider = tile.node.addComponent(CircleCollider2D);
        collider.group = group;
        collider.offset = new Vec2(
            tileSize.width / 2 - noxcc.aw(tile.node.parent),
            tileSize.height / 2 - noxcc.ah(tile.node.parent)
        );
        collider.radius = width / 2;
        collider.sensor = group == ObjectGroup.Trigger || group == ObjectGroup.Spike || group == ObjectGroup.BossBullet1 || group == ObjectGroup.BossBullet2;
        collider.tag = ObjectTag.Default;
        MapUtil.applyCollider(collider);
        addCollisionObject(tile.node, map);
        return collider;
    }

    export function addTiledPolygonCollider(tile: TiledTile, map: GameMap, group: number, enabledContactListener: boolean, points: Vec2[]): PolygonCollider2D {
        addRigidBody(tile.node, group, enabledContactListener);

        let collider = tile.node.addComponent(PolygonCollider2D);
        collider.group = group;
        collider.points = points;
        collider.offset = new Vec2(-noxcc.aw(tile.node.parent), -noxcc.ah(tile.node.parent));
        collider.sensor = group == ObjectGroup.Trigger || group == ObjectGroup.Spike || group == ObjectGroup.BossBullet1 || group == ObjectGroup.BossBullet2;
        collider.tag = ObjectTag.Default;
        MapUtil.applyCollider(collider);
        addCollisionObject(tile.node, map);
        return collider;
    }

    export function setDynamicType(node: Node) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            var rigidBody2D = node.getComponent(RigidBody2D);
            rigidBody2D.type = ERigidBody2DType.Dynamic;
            rigidBody2D.allowSleep = false;
        }
        else {
        }
    }

    export function setKinematicType(node: Node) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            node.getComponent(RigidBody2D).type = ERigidBody2DType.Kinematic;
        }
        else {
        }
    }

    export function removeCollider(node: Node): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            node.removeComponent(Collider2D);
        }
        else {
            node.removeComponent(Collider2D);
            removeCollisionObject(node);
        }
        removeRigidBody(node);
    }

    export function applyCollider(collider: Collider2D): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            collider.friction = 0.0;
            collider.restitution = 0;
            collider.apply();
        }
        else {
        }
    }

    export function addMovement(node: Node, offsetX: number, offsetY: number) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            noxcc.addXY(node, offsetX, offsetY);
        }
        else {
            node.getComponent(CollisionObject).set_movement(new Vec2(offsetX, offsetY));
        }
    }
}
