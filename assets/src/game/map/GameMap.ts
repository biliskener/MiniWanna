import { GameData } from "../data/GameData";
import { SceneManager } from "../../framework/base/SceneManager";
import { SceneId } from "../const/SceneId";
import { PhysicsEngineType, GameConfig } from "../config/GameConfig";
import { CollisionSystem } from "./collision/CollisionSystem";
import { MapEdge } from "./object/MapEdge";
import { Player } from "./object/Player";
import { NoxComponent } from "../../framework/core/NoxComponent";
import { Animation, AudioClip, Node, PhysicsSystem2D, Prefab, Rect, TiledLayer, TiledMap, TiledObjectGroup, TiledTile, Vec2, _decorator } from "cc";
import { cc_assert, CC_DEV, cc_director, cc_find, cc_instantiate, cc_isValid } from "../../framework/core/nox";
import { noxSound } from "../../framework/core/noxSound";
import { MapUtil } from "../../game/map/MapUtil";
import { noxcc } from "../../framework/core/noxcc";
import { ObjectGroup } from "../const/ObjectGroup";
import { PlayerStatus } from "./object/PlayerStatus";
import { Spike } from "./object/Spike";
import { Save } from "./object/iwbt/Save";
import { Platform } from "./object/iwbt/Platform";
import { CameraControl } from "./CameraControl";
import { BossBullet } from "./object/iwbt/boss/BossBullet";
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class GameMap extends NoxComponent {
    // 背景音乐
    @property({ type: AudioClip })
    backgroundMusic: AudioClip = null;

    // 玩家
    @property({ type: Prefab })
    playerPrefab: Prefab = null;

    // 平台
    @property({ type: Prefab })
    platformPrefab: Prefab = null;

    // 樱桃
    @property({ type: Prefab })
    cherryPrefab: Prefab = null;

    tiledMap: TiledMap = null;
    playerNode: Node = null;
    allPlatforms: { [key: string]: Platform } = {};
    allMapEdges: { [key: string]: MapEdge } = {};

    public levelName: string = "";
    public rebornGateName: string = "";

    private pauseCount: number = 0;

    public collisionSystem: CollisionSystem;

    constructor() {
        super();
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
        }
        else {
            this.collisionSystem = new CollisionSystem(this);
        }
    }

    onLoad(): void {
        this.tiledMap = this.getComponent(TiledMap);
        this.playBGM();
    }

    onDestroy(): void {
        this.stopBGM();
    }

    start(): void {
        this.makeLayerComponents();
        this.makeRigidSquares();

        this.makeMapColliders();
        this.makeObjects("Object");
        this.makeObjects("Transfer");
        this.makeMapEdges();

        this.makeMapTriggers();

        this.applyGravity();

        if (this.playerNode == null && this.rebornGateName) {
            var objectGroup = this.tiledMap.getObjectGroup("Transfer");
            var gateNode = objectGroup.node.getChildByName(this.rebornGateName);
            this.rebornPlayer(gateNode);
        }
    }

    update(dt: number): void {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
        }
        else {
            this.collisionSystem.update(dt);
        }

        if (SceneManager.getRunningSceneId() != SceneId.select) {
            // 计算游戏时间 
            GameData.INSTANCE.currSavedData.addGameTime(dt);
        }
    }

    // 播放 BGM 
    private playBGM(): void {
        if (this.backgroundMusic) {
            noxSound.setMusicVolume(0.5);
            noxSound.playMusic(this.backgroundMusic, true);
        }
    }

    // 停止 BGM 
    private stopBGM(): void {
        noxSound.stopMusic();
    }

    private rebornPlayer(targetNode: Node): void {
        if (!this.playerNode) {

            this.playerNode = cc_instantiate(this.playerPrefab);

            // 再加碰撞组件
            const cornerWidth = GameConfig.roundedCornerWidth;
            const cornerHeight = GameConfig.roundedCornerHeight;
            var group = ObjectGroup.Player;
            var colliderRect = new Rect(9, 1, 16, 20);  // 3 + 2 * SHIFT_DELTA
            if (GameConfig.usePolygonColliderForPlayer) {
                var points: Vec2[] = [
                    new Vec2(colliderRect.xMin, colliderRect.yMin + cornerWidth),
                    new Vec2(colliderRect.xMin + cornerHeight, colliderRect.yMin),
                    new Vec2(colliderRect.xMax - cornerHeight, colliderRect.yMin),
                    new Vec2(colliderRect.xMax, colliderRect.yMin + cornerWidth),
                    new Vec2(colliderRect.xMax, colliderRect.yMax - cornerWidth),
                    new Vec2(colliderRect.xMax - cornerHeight, colliderRect.yMax),
                    new Vec2(colliderRect.xMin + cornerHeight, colliderRect.yMax),
                    new Vec2(colliderRect.xMin, colliderRect.yMax - cornerWidth),
                ];
                MapUtil.addPolygonCollider(this.playerNode, this, group, true, points);
            }
            else {
                MapUtil.addBoxCollider(this.playerNode, this, group, true, colliderRect, 0);
            }
            MapUtil.addFootBoxCollider(this.playerNode, group, colliderRect, cornerWidth, cornerHeight);
            MapUtil.addHeadBoxCollider(this.playerNode, group, colliderRect, cornerWidth, cornerHeight);

            MapUtil.setDynamicType(this.playerNode);

            // 最后加入到场景中
            noxcc.setParent(this.playerNode, this.node);
            noxcc.setZOrder(this.playerNode, 1);

            // 调整位置
            if (targetNode.getComponent(TiledTile)) {
                var pos = new Vec2(GameConfig.tileWidth / 2, 0);
                pos.x -= noxcc.aw(this.node);
                pos.y -= noxcc.ah(this.node);
                pos = noxcc.convertPosAR(pos, targetNode, this.playerNode.parent);
                pos.x += (noxcc.ax(this.playerNode) - 0.5) * noxcc.w(this.playerNode);
                pos.y += (noxcc.ay(this.playerNode)) * noxcc.h(this.playerNode);
                this.playerNode.setPosition(pos.x, pos.y);
            }
            else {
                cc_assert(false, "fatal error");
            }

            // 重置一下动画
            this.playerNode.getComponent(Player).setPlayerStatus(PlayerStatus.PLAYER_IDLE, true);
        }
    }

    // 制作该图层的碰撞组件（包括创建玩家、存档点和樱桃等）  
    private makeMapColliderBy(layerName: string): boolean {
        let layer = this.tiledMap.getLayer(layerName);
        if (layer) {
            let layerSize = layer.getLayerSize();
            for (let y = 0; y < layerSize.height; ++y) {
                for (let x = 0; x < layerSize.width; ++x) {
                    let tile: TiledTile = layer.getTiledTileAt(x, y, true);
                    if (tile.grid != 0) {
                        if (tile.grid == GameConfig.rebornTile) {
                            // 玩家起始位置 
                            if (!this.rebornGateName) {
                                this.rebornPlayer(tile.node);
                            }
                            tile.grid = GameConfig.backgroundTile;
                        }
                        this.onTileAdd(tile);
                    }
                }
            }
            return true;
        }

        let objectGroup = this.tiledMap.getObjectGroup(layerName);
        if (objectGroup) {
            let tileWidth = this.tiledMap.getTileSize().width;
            let tileHeight = this.tiledMap.getTileSize().height;
            let objects = objectGroup.getObjects();
            for (let object of objects) {
                if (object.gid && object.gid != 0) {
                    let node = objectGroup.node.getChildByName("img" + object.id);
                    cc_assert(node);
                    if (GameConfig.spikeIsRect && GameConfig.spikeGids.indexOf(object.gid) >= 0) {
                        MapUtil.addCircleCollider(node, this, ObjectGroup.Spike, true, new Rect(
                            GameConfig.spikeSpacing, GameConfig.spikeSpacing,
                            noxcc.w(node) - GameConfig.spikeSpacing * 2,
                            noxcc.h(node) - GameConfig.spikeSpacing * 2,
                        ), 0);
                        node.addComponent(Spike);
                    }
                    else if (object.gid == GameConfig.spikeDownTile) {
                        MapUtil.addPolygonCollider(node, this, ObjectGroup.Spike, true, [
                            new Vec2(GameConfig.spikeSpacing, noxcc.h(node) - GameConfig.spikeSpacing),
                            new Vec2(noxcc.w(node) / 2, GameConfig.spikeSpacing),
                            new Vec2(noxcc.w(node) - GameConfig.spikeSpacing, noxcc.h(node) - GameConfig.spikeSpacing)
                        ]);
                        node.addComponent(Spike);
                    }
                    else if (object.gid == GameConfig.spikeLeftTile) {
                        MapUtil.addPolygonCollider(node, this, ObjectGroup.Spike, true, [
                            new Vec2(GameConfig.spikeSpacing, noxcc.h(node) / 2),
                            new Vec2(noxcc.w(node) - GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                            new Vec2(noxcc.w(node) - GameConfig.spikeSpacing, noxcc.h(node) - GameConfig.spikeSpacing)
                        ]);
                        node.addComponent(Spike);
                    }
                    else if (object.gid == GameConfig.spikeRightTile) {
                        MapUtil.addPolygonCollider(node, this, ObjectGroup.Spike, true, [
                            new Vec2(GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                            new Vec2(noxcc.w(node) - GameConfig.spikeSpacing, noxcc.h(node) / 2),
                            new Vec2(GameConfig.spikeSpacing, noxcc.h(node) - GameConfig.spikeSpacing)
                        ]);
                        node.addComponent(Spike);
                    }
                    else if (object.gid == GameConfig.spikeUpTile) {
                        MapUtil.addPolygonCollider(node, this, ObjectGroup.Spike, true, [
                            new Vec2(GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                            new Vec2(noxcc.w(node) - GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                            new Vec2(noxcc.w(node) - GameConfig.spikeSpacing, noxcc.h(node) - GameConfig.spikeSpacing)
                        ]);
                        node.addComponent(Spike);
                    }
                    else if (object.gid == GameConfig.cherryTile) {
                        var cherry = cc_instantiate(this.cherryPrefab);
                        cherry.getComponent(Animation).enabled = true;
                        cherry.getComponent(BossBullet).enabled = false;
                        noxcc.setPosAR(cherry, node.position.x + tileWidth / 2, node.position.y + tileHeight / 2);
                        MapUtil.addCircleCollider(cherry, this, ObjectGroup.BossBullet1, true, new Rect(0, 0, noxcc.w(node), noxcc.h(node)), 0);
                        MapUtil.setDynamicType(cherry);
                        cherry.parent = node.parent;
                        node.destroy();
                        node = cherry;
                    }
                    else if (object.gid == GameConfig.blockTile) {
                        MapUtil.addBoxCollider(node, this, ObjectGroup.Block, true, null, 0);
                    }
                    else {
                        cc_assert(false);
                    }
                    if (object.name != "") {
                        cc_assert(node.parent.getChildByName(object.name) == null);
                        node.name = object.name;
                    }
                }
                else {
                    cc_assert(false);
                }
            }
            return true;
        }
        return false;
    }

    private onTileAction(tile: TiledTile, isAdd: boolean): void {
        var layer = tile.node.parent.getComponent(TiledLayer);

        var x = tile.x;
        var y = tile.y;
        var tileSize = layer.getMapTileSize();

        var collider = null;

        if (tile.grid == GameConfig.platformTile) {
            if (isAdd) {
                tile.grid = GameConfig.backgroundTile;
                layer.setTiledTileAt(x, y, null);
            }
            else {
                cc_assert(false, "fatal error");
            }
        }
        else if (tile.grid == GameConfig.backgroundTile) {
            // 背景，不处理。
        }
        else if (tile.grid == GameConfig.saveTile) {
            // 存档点
            if (isAdd) {
                var save = tile.node.addComponent(Save);
                save.setTile(tile);
                collider = MapUtil.addTiledBoxCollider(tile, this, ObjectGroup.Save, false, tileSize, tileSize.width, tileSize.height);
            }
            else {
                MapUtil.removeCollider(tile.node);
                tile.node.removeComponent(Save);
            }
        }
        else if (GameConfig.spikeIsRect && GameConfig.spikeGids.indexOf(tile.grid) >= 0) {
            if (isAdd) {
                collider = MapUtil.addTiledCircleCollider(
                    tile, this, ObjectGroup.Spike, false, tileSize,
                    tileSize.width - GameConfig.spikeSpacing * 2,
                    tileSize.height - GameConfig.spikeSpacing * 2);
                if (GameConfig.useSpikeTileAsObject) {
                    tile.addComponent(Spike);
                }
            }
            else {
                MapUtil.removeCollider(tile.node);
            }
        }
        else if (tile.grid == GameConfig.spikeDownTile) {
            if (isAdd) {
                collider = MapUtil.addTiledPolygonCollider(tile, this, ObjectGroup.Spike, false, [
                    new Vec2(GameConfig.spikeSpacing, tileSize.height - GameConfig.spikeSpacing),
                    new Vec2(tileSize.width / 2, GameConfig.spikeSpacing),
                    new Vec2(tileSize.width - GameConfig.spikeSpacing, tileSize.height - GameConfig.spikeSpacing)
                ]);
                if (GameConfig.useSpikeTileAsObject) {
                    tile.addComponent(Spike);
                }
            }
            else {
                MapUtil.removeCollider(tile.node);
            }
        }
        else if (tile.grid == GameConfig.spikeLeftTile) {
            if (isAdd) {
                collider = MapUtil.addTiledPolygonCollider(tile, this, ObjectGroup.Spike, false, [
                    new Vec2(GameConfig.spikeSpacing, tileSize.height / 2),
                    new Vec2(tileSize.width - GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                    new Vec2(tileSize.width - GameConfig.spikeSpacing, tileSize.height - GameConfig.spikeSpacing)
                ]);
                if (GameConfig.useSpikeTileAsObject) {
                    tile.addComponent(Spike);
                }
            }
            else {
                MapUtil.removeCollider(tile.node);
            }
        }
        else if (tile.grid == GameConfig.spikeRightTile) {
            if (isAdd) {
                collider = MapUtil.addTiledPolygonCollider(tile, this, ObjectGroup.Spike, false, [
                    new Vec2(GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                    new Vec2(tileSize.width - GameConfig.spikeSpacing, tileSize.height / 2),
                    new Vec2(GameConfig.spikeSpacing, tileSize.height - GameConfig.spikeSpacing)
                ]);
                if (GameConfig.useSpikeTileAsObject) {
                    tile.addComponent(Spike);
                }
            }
            else {
                MapUtil.removeCollider(tile.node);
            }
        }
        else if (tile.grid == GameConfig.spikeUpTile) {
            if (isAdd) {
                collider = MapUtil.addTiledPolygonCollider(tile, this, ObjectGroup.Spike, false, [
                    new Vec2(GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                    new Vec2(tileSize.width - GameConfig.spikeSpacing, GameConfig.spikeSpacing),
                    new Vec2(tileSize.width / 2, tileSize.height - GameConfig.spikeSpacing)
                ]);
                if (GameConfig.useSpikeTileAsObject) {
                    tile.addComponent(Spike);
                }
            }
            else {
                MapUtil.removeCollider(tile.node);
            }
        }
        else if (tile.grid == GameConfig.vineRightTile) {
            // 右蔓藤，没实现。
        }
        else if (tile.grid == GameConfig.vineLeftTile) {
            // 左蔓藤，没实现。
        }
        else if (tile.grid == GameConfig.transferTile) {
            // 传送门，由于没法区分多个门，所以在对象层里处理。
        }
        else if (tile.grid == GameConfig.cherryTile) {
            cc_assert(false, "未测试");
            // 樱桃，删除地图上的樱桃图块，创建新的樱桃对象。
            // PS：2.2.1 版本之前需要在 start 函数才可以。
            if (isAdd) {
                tile.grid = GameConfig.backgroundTile;
                layer.setTiledTileAt(x, y, null);
                var cherry = cc_instantiate(this.cherryPrefab);
                cherry.getComponent(Animation).enabled = true;
                cherry.getComponent(BossBullet).enabled = false;
                tile = cherry.addComponent(TiledTile);
                tile._x = x;
                tile._y = y;
                tile._layer = layer;
                tile.updateInfo();
                cherry.parent = layer.node;
                noxcc.addX(cherry, tileSize.width / 2 - noxcc.aw(tile.node.parent));
                noxcc.addY(cherry, tileSize.height / 2 - noxcc.ah(tile.node.parent));
            }
        }
        else {
            if (isAdd) {
                collider = MapUtil.addTiledBoxCollider(tile, this, ObjectGroup.Block, false, tileSize, tileSize.width, tileSize.height);
            }
            else {
                MapUtil.removeCollider(tile.node);
            }
        }
    }

    private onTileRemove(tile: TiledTile): void {
        this.onTileAction(tile, false);
    }

    private onTileAdd(tile: TiledTile): void {
        this.onTileAction(tile, true);
    }

    // 制作碰撞组件 
    private makeMapColliders(): void {
        for (let i = 1; i < 99; ++i) {
            this.makeMapColliderBy("Layer" + i)
        }

        if (SceneManager.getRunningSceneId() == SceneId.select) {
            return;
        }
        if (GameData.INSTANCE.currSavedData.mode == "Impossible") return;
        this.makeMapColliderBy("VeryHard");
        if (GameData.INSTANCE.currSavedData.mode == "VeryHard") return;
        this.makeMapColliderBy("Hard");
        if (GameData.INSTANCE.currSavedData.mode == "Hard") return;
        this.makeMapColliderBy("Medium");
    }

    // 制作触发器（触发区域的陷阱以及传送门）
    private makeMapTriggers(): void {
        var objectGroup = this.tiledMap.getObjectGroup("Trigger");
        if (objectGroup) {
            var objects = objectGroup.getObjects();
            for (var i in objects) {
                var object = objects[i];
                var node: Node = null;
                if (object.type == 0) {
                    node = noxcc.newNode(object.name != "" ? object.name : "object" + object.id);
                    noxcc.setSize(node, object.width, object.height);
                    noxcc.setAnchor(node, 0, 1);
                    noxcc.setPosAR(node, object.x - noxcc.aw(this.node), object.y - noxcc.ah(this.node));
                }
                else if (object.type == 4) {
                    node = objectGroup.node.getChildByName("img" + object.id);
                }
                else {
                    cc_assert(false, "not supported");
                }

                cc_assert(this.node.getChildByName(node.name) == null);
                node.parent = this.node;

                // 矩形区域
                if (object.type == 0) {
                    noxcc.setX(node, object.x - noxcc.aw(node.parent));
                    noxcc.setY(node, object.y - object.height - noxcc.ah(node.parent));
                    noxcc.addX(node, noxcc.aw(node));
                    noxcc.addY(node, noxcc.ah(node));
                }
                else if (object.type == 4) {
                }
                else {
                    cc_assert(false, "not supported");
                }

                // 添加触发区域对应的组件与参数，可多个。
                var j = 1;
                while (true) {
                    var id = (j == 1 ? "" : String(j));
                    if (object["script" + id]) {
                        var trigger = node.addComponent(object["script" + id]);
                        var params = object["params" + id];
                        if (params && params.match(/^[\[\{]/)) {
                            trigger["params"] = JSON.parse(params);
                        }
                        else {
                            trigger["params"] = params;
                        }
                    } else {
                        break;
                    }
                    j++;
                }

                if (object.type == 0) {
                    MapUtil.addBoxCollider(node, this, ObjectGroup.Trigger, true, null, 0);
                }
                else if (object.type == 4) {
                    var width = noxcc.w(node);
                    var height = noxcc.h(node);
                    MapUtil.addCircleCollider(node, this, ObjectGroup.Trigger, true, new Rect(
                        width * (1 - GameConfig.triggerCollisionSize) * 0.5,
                        height * (1 - GameConfig.triggerCollisionSize) * 0.5,
                        width * GameConfig.triggerCollisionSize,
                        height * GameConfig.triggerCollisionSize,
                    ), 0);
                }
                else {
                    cc_assert(false);
                }
            }
        }
    }

    // 制作对象（目前只有设置平台的参数） 
    private makeObjects(groupName: string): void {
        var objectGroup = this.tiledMap.getObjectGroup(groupName);
        if (objectGroup) {
            var objects = objectGroup.getObjects();
            for (var i = 0; i < objects.length; ++i) {
                var object = objects[i];
                if (object.name.match(/^(platform|rigid_square_)\d+$/i) && !(object as any).mainPlatform) { // 平台
                    var node = noxcc.newNode();
                    node.parent = objectGroup.node;
                    node.active = false;

                    var imgNode = cc_find("img" + object.id, objectGroup.node);
                    noxcc.setSize(node, noxcc.size(imgNode));
                    noxcc.setAnchor(node, noxcc.anchor(imgNode));
                    node.setPosition(imgNode.getPosition());
                    imgNode.parent = node;
                    cc_assert(object.name != "");
                    imgNode.name = object.name;
                    imgNode.setPosition(0, 0);

                    var minX = noxcc.aleft(node);
                    var minY = noxcc.abottom(node);
                    var maxX = noxcc.aright(node);
                    var maxY = noxcc.atop(node);

                    var targetNodes: Node[] = [];
                    for (var j = 0; j < objects.length; ++j) {
                        var otherObject = objects[j];
                        if (otherObject != object && (otherObject as any).mainPlatform == object.name) {
                            var imgNode = cc_find("img" + otherObject.id, objectGroup.node);
                            imgNode.parent = node;
                            imgNode.setPosition(imgNode.position.clone().subtract(node.position));
                            minX = Math.min(minX, noxcc.left(imgNode));
                            minY = Math.min(minY, noxcc.bottom(imgNode));
                            maxX = Math.max(maxX, noxcc.right(imgNode));
                            maxY = Math.max(maxY, noxcc.top(imgNode));
                            targetNodes.push(imgNode);
                        }
                    }

                    if (targetNodes.length) {
                        var newWidth = maxX - minX;
                        var newHeight = maxY - minY;
                        noxcc.setSize(node, newWidth, newHeight);
                        noxcc.setAnchor(node, -minX / newWidth, -minY / newHeight);
                    }

                    // 必须先设定参数，再设置parent
                    var platform = node.addComponent(Platform);
                    platform.initSpeed = new Vec2((object as any).speedX || 0, (object as any).speedY || 0);

                    node.active = true;

                    cc_assert(object.name != "");
                    node.name = object.name;

                    if (GameConfig.useIwbtLevels) {
                        var collider = MapUtil.addBoxCollider(node, this, ObjectGroup.Platform, true, new Rect(0, 0, noxcc.w(node), noxcc.h(node) / 2), 0);
                        collider.offset.y += noxcc.h(node) / 2;
                    }
                    else {
                        var collider = MapUtil.addBoxCollider(node, this, ObjectGroup.Platform, true, null, 0);
                    }
                }
            }
        }
    }

    private makeLayerComponents() {
        for (var layer of this.tiledMap.getLayers()) {
            let properties = layer.getProperties();
            if (properties.script && typeof (properties.script) == "string") {
                let params = properties.params as string;
                let component = layer.addComponent(properties.script);
                if (params && params.match(/^[\[\{]/)) {
                    component["params"] = JSON.parse(params);
                }
                else {
                    cc_assert(false);
                    component["params"] = params;
                }
            }
        }
    }

    private makeRigidSquares(): void {
        for (var i = 0; ; ++i) {
            var groupName = i == 0 ? "RigidSquare" : "RigidSquare" + i;
            var objectGroup = this.tiledMap.getObjectGroup(groupName);
            if (objectGroup) {
                this.makeRigidSquare(objectGroup);
            }
            else if (i) {
                break;
            }
        }
    }

    // 制作对象（目前只有设置平台的参数）
    private makeRigidSquare(objectGroup: TiledObjectGroup): void {
        let properties = objectGroup.getProperties();

        let node = noxcc.newNode();
        cc_assert(objectGroup.getGroupName() != "");
        node.name = objectGroup.getGroupName();
        node.parent = objectGroup.node;
        node.active = false;

        let minX = Number.POSITIVE_INFINITY;
        let maxX = Number.NEGATIVE_INFINITY;
        let minY = Number.POSITIVE_INFINITY;
        let maxY = Number.NEGATIVE_INFINITY;

        let imgNodes: Node[] = [];

        let objects = objectGroup.getObjects();
        for (let i = 0; i < objects.length; ++i) {
            let object = objects[i];
            if (object.name.match(/^rigid_square_\d*$/)) {
                let imgNode = cc_find("img" + object.id, objectGroup.node);
                minX = Math.min(minX, noxcc.left(imgNode));
                minY = Math.min(minY, noxcc.bottom(imgNode));
                maxX = Math.max(maxX, noxcc.right(imgNode));
                maxY = Math.max(maxY, noxcc.top(imgNode));
                imgNodes.push(imgNode);
            }
            else {
                cc_assert(false, "fatal error");
            }
        }

        if (imgNodes.length) {
            let newWidth = maxX - minX;
            let newHeight = maxY - minY;
            noxcc.setSize(node, newWidth, newHeight);
            CC_DEV && cc_assert(typeof (properties.anchorX) == "number", "need number");
            CC_DEV && cc_assert(typeof (properties.anchorY) == "number", "need number");
            noxcc.setAnchor(node, properties.anchorX as number, properties.anchorY as number);
            node.setPosition(minX + noxcc.aw(node), minY + noxcc.ah(node));
        }
        else {
            cc_assert(false, "fatal error");
        }

        for (let imgNode of imgNodes) {
            noxcc.setPosAR(imgNode, noxcc.convertPosAR(imgNode.position, imgNode.parent, node));
            imgNode.parent = node;
        }

        if (properties.script && typeof (properties.script) == "string") {
            let params = properties.params as string;
            let component = node.addComponent(properties.script);
            if (params && params.match(/^[\[\{]/)) {
                component["params"] = JSON.parse(params);
            }
            else {
                cc_assert(false);
                component["params"] = params;
            }
        }

        MapUtil.addBoxCollider(node, this, ObjectGroup.Platform, true, null, 0);

        node.active = true;
    }

    private makeMapEdges(): void {
        var tileSize = this.tiledMap.getTileSize();
        var bbox = noxcc.arect(this.node);
        var ext = 3;
        var edges: { [key: string]: Rect } = {
            left: new Rect(
                bbox.xMin - tileSize.width * 10,
                bbox.yMin - tileSize.height * ext,
                tileSize.width * 10,
                bbox.height + tileSize.height * ext * 2
            ),
            right: new Rect(
                bbox.xMax,
                bbox.yMin - tileSize.height * ext,
                tileSize.width * 10,
                bbox.height + tileSize.height * ext * 2
            ),
            bottom: new Rect(
                bbox.xMin - tileSize.width * ext,
                bbox.yMin - tileSize.height * 10,
                bbox.width + tileSize.width * ext * 2,
                tileSize.height * 10,
            ),
            top: new Rect(
                bbox.xMin - tileSize.width * ext,
                bbox.yMax,
                bbox.width + tileSize.width * ext * 2,
                tileSize.height * 10,
            ),
        };
        for (var dir in edges) {
            var edge = edges[dir];
            var node = noxcc.newNode();
            node.name = "edge_" + dir;
            node.parent = this.node;
            node.active = false;

            noxcc.setAnchor(node, 0, 0);
            node.setPosition(edge.x, edge.y);
            noxcc.setSize(node, edge.size);

            var mapEdge = node.addComponent(MapEdge);
            mapEdge.dirName = dir;

            node.active = true;

            var collider = MapUtil.addBoxCollider(node, this, ObjectGroup.Block, true, null, 0);

            this.allMapEdges[dir] = mapEdge;
        }
    }

    public requestPause(): void {
        if (this.pauseCount == 0) {
            PhysicsSystem2D.instance.enable = false;
        }
        this.pauseCount++;

        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
        }
        else {
            this.collisionSystem.pause();
        }

        if (this.playerNode) {
            this.playerNode.getComponent(Player).pause();
        }
    }

    public cancelPause(): void {
        this.pauseCount--;
        if (this.pauseCount == 0) {
            PhysicsSystem2D.instance.enable = true;
        }

        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
        }
        else {
            this.collisionSystem.resume();
        }

        if (this.playerNode) {
            this.playerNode.getComponent(Player).resume();
        }
    }

    public isPaused(): boolean {
        return this.pauseCount > 0;
    }

    public applyGravity() {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            PhysicsSystem2D.instance.gravity = new Vec2(0, GameConfig.gravity);
        }
        else {
            this.collisionSystem.setAngle(0);
        }
    }

    public addPlatform(platform: Platform): void {
        cc_assert(this.allPlatforms[platform.node.name] == null, "fatal error");
        this.allPlatforms[platform.node.name] = platform;
    }

    public getRectOfOverlappingTiles(layer: TiledLayer, bbox: Rect): Rect {
        var layerSize = layer.getLayerSize();
        var tileSize = layer.getMapTileSize();
        var pt1 = noxcc.convertPosAR(new Vec2(bbox.xMin, bbox.yMin), this.node, layer.node);
        var pt2 = noxcc.convertPosAR(new Vec2(bbox.xMax, bbox.yMax), this.node, layer.node);
        cc_assert(pt1.x < pt2.x && pt1.y < pt2.y, "fatal error");
        pt1.add2f(noxcc.aw(layer.node), noxcc.ah(layer.node));
        pt2.add2f(noxcc.aw(layer.node), noxcc.ah(layer.node));
        var xMin = Math.floor(pt1.x / tileSize.width);
        var xMax = Math.floor(pt2.x / tileSize.width);
        var yMin = Math.floor(pt1.y / tileSize.height);
        var yMax = Math.floor(pt2.y / tileSize.height);
        xMin = Math.max(xMin, 0);
        xMax = Math.min(xMax, layerSize.width - 1);
        yMin = Math.max(yMin, 0);
        yMax = Math.min(yMax, layerSize.height - 1);
        return new Rect(xMin, yMin, xMax - xMin, yMax - yMin);
    }

    public getTileAt(layer: TiledLayer, x: number, y: number): TiledTile {
        y = layer.getLayerSize().height - y - 1;
        if (x < 0 || y < 0 || x >= layer.getLayerSize().width || y >= layer.getLayerSize().height) {
            cc_assert(false);
        }
        return layer.getTiledTileAt(x, y, false);
    }

    public getTiledMap() {
        return this.tiledMap;
    }

    public deferredActivateNode(node: Node, active: boolean) {
        if (GameConfig.physicsEngineType == PhysicsEngineType.BOX2D) {
            if (PhysicsSystem2D.instance.stepping) {
                this.scheduleOnce(() => {
                    if (cc_isValid(node)) {
                        node.active = active;
                    }
                });
            }
            else {
                node.active = active;
            }
        }
        else {
            node.active = active;
        }
    }

    public startVibrate(duration: number) {
        this.getComponent(CameraControl).startVibrate(duration);
    }
}
