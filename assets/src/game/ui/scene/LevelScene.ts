import { assert, Label, Node, Prefab, TiledMap, TiledMapAsset } from "cc";
import { BaseScene } from "../../../framework/base/BaseScene";
import { cc_assert, cc_isValid } from "../../../framework/core/nox";
import { noxcc } from "../../../framework/core/noxcc";
import { noxSound } from "../../../framework/core/noxSound";
import { GameConfig } from "../../config/GameConfig";
import { SceneId } from "../../const/SceneId";
import { GameData } from "../../data/GameData";
import { CameraControl } from "../../map/CameraControl";
import { GameMap } from "../../map/GameMap";
import { AllViewTypes } from "../AllViewTypes";

enum MAP_IDX {
    MAIN = 0,
    CROSS = 1,
}

export class LevelScene extends BaseScene {
    private static gCurrenton: LevelScene = null;
    public static currenton(): LevelScene {
        return LevelScene.gCurrenton;
    }

    private levelLabel: Label = null;
    private timeLabel: Label = null;
    private lifeLabel: Label = null;
    private propLabel: Label = null;
    private treasureLabel: Label = null;

    private maps: GameMap[] = [];

    protected constructor() {
        super(SceneId.level, AllViewTypes.LevelScene);
    }

    //界面对象初始化，添加打开关闭的事件监听
    public init(): void {
    }

    //界面对象销毁，移除打开关闭的事件监听
    public onRelease(): void {
    }

    // 加载界面时的调用
    public onInitWidget(): void {
        LevelScene.gCurrenton = this;
        super.onInitWidget();

        this.levelLabel = noxcc.findLabel("top_panel/level/value", this.node);
        this.timeLabel = noxcc.findLabel("bottom_panel/time/value", this.node);
        this.lifeLabel = noxcc.findLabel("bottom_panel/life/value", this.node);
        this.propLabel = noxcc.findLabel("bottom_panel/prop/value", this.node);
        this.treasureLabel = noxcc.findLabel("bottom_panel/treasure/value", this.node);

        this.reloadLevel();
    }

    //销毁界面时的调用
    public onReleaseWidget(): void {
        super.onReleaseWidget();
        LevelScene.gCurrenton = null;
    }

    //界面打开时的调用
    public onEnter(): void {
        super.onEnter();

        GameData.INSTANCE.currSavedData.dataChangedEvent.addListener(this, this.updateInfoPanel);

        noxSound.playBgWithSoundNames(["sound/iwbt/track01.mp3"]);
        this.updateInfoPanel();
    }

    //界面关闭时的调用
    public onExit(): void {
        GameData.INSTANCE.currSavedData.dataChangedEvent.removeListener(this, this.updateInfoPanel);

        noxSound.stopBackgroundSound();

        super.onExit();
    }

    private loadLevelEx(mapIdx: number, levelName: string, targetTile: [number, number], needSave?: boolean, levelLoadedCallback?: () => any): void {
        this.unloadLevelEx(mapIdx);

        let mapPrefabName = GameConfig.useIwbtLevels ? "prefab/iwbt/map" : "prefab/escape/map";
        noxcc.loadPrefab(mapPrefabName, (err: Error, mapPrefab: Prefab) => {
            if (!cc_isValid(this)) return;

            if (GameConfig.useRawTileMapAssets) {
                let tiledMapName = (GameConfig.useIwbtLevels ? "tiled/iwbt/" : "tiled/escape/") + levelName;
                noxcc.loadTmxAsset(tiledMapName, (err: Error, tmxAsset: TiledMapAsset) => {
                    if (!cc_isValid(this)) return;

                    var mapParentNode = noxcc.instantiate(mapPrefab);
                    mapParentNode.name = "map";

                    var map = mapParentNode.getChildByName("map").getComponent(GameMap);
                    assert(map);
                    noxcc.addTiledMap(map.node, tmxAsset);

                    loadedCallback(map, mapParentNode);
                });
            }
            else {
                let levelPrefabName = (GameConfig.useIwbtLevels ? "level/iwbt/" : "level/escape/") + levelName;
                noxcc.loadPrefab(levelPrefabName, (err: Error, prefab: Prefab) => {
                    if (!cc_isValid(this)) return;

                    var mapParentNode = noxcc.instantiate(mapPrefab);
                    mapParentNode.name = "map";
                    var oldMap = mapParentNode.getChildByName("map").getComponent(GameMap);
                    oldMap.node.parent = null;
                    oldMap.node.destroy();

                    var node = noxcc.instantiate(prefab);
                    node.name = "map";
                    noxcc.setParent(node, mapParentNode);

                    var map = noxcc.getOrAddComponent(node, GameMap);
                    map.backgroundMusic ??= oldMap.backgroundMusic;
                    map.playerPrefab ??= oldMap.playerPrefab;
                    map.platformPrefab ??= oldMap.platformPrefab;
                    map.cherryPrefab ??= oldMap.cherryPrefab;
                    cc_assert(map.node.getComponent(TiledMap));

                    loadedCallback(map, mapParentNode);
                });
            }

            var loadedCallback = (map: GameMap, mapParentNode: Node) => {
                this.maps[mapIdx] = map;

                noxcc.setParent(mapParentNode, this.node);

                map.node.addComponent(CameraControl);
                map.levelName = levelName;
                map.rebornTile = targetTile;

                if (needSave) {
                    GameData.INSTANCE.currSavedData.setLevelAndTile(levelName, targetTile);
                    GameData.INSTANCE.saveGame();
                }

                this.updateInfoPanel();
                if (levelLoadedCallback) {
                    this.scheduleOnce(levelLoadedCallback);
                }
            };
        });
    }

    private unloadLevelEx(mapIdx: number) {
        var map = this.maps[mapIdx];
        if (map) {
            var mapParentNode = map.node.parent;
            mapParentNode.parent = null;
            mapParentNode.destroy();
            this.maps[mapIdx] = null;
        }
    }

    public loadLevel(levelName: string, targetTile: [number, number], needSave?: boolean): void {
        this.loadLevelEx(MAP_IDX.MAIN, levelName, targetTile, needSave);
    }

    public loadCrossLevel(levelName: string, levelLoadedCallback: () => any): void {
        this.loadLevelEx(MAP_IDX.CROSS, levelName, null, false, levelLoadedCallback);
    }

    public unloadCrossLevel() {
        this.unloadLevelEx(MAP_IDX.CROSS);
        this.updateInfoPanel();
    }

    public reloadLevel(): void {
        this.loadLevel(GameData.INSTANCE.currSavedData.levelName, GameData.INSTANCE.currSavedData.targetTile);
    }

    public getCrossMap() {
        return this.maps[MAP_IDX.CROSS];
    }

    private updateInfoPanel() {
        var savedData = GameData.INSTANCE.currSavedData;
        var map = this.maps[MAP_IDX.CROSS] || this.maps[MAP_IDX.MAIN];
        var levelName = map ? map.levelName : savedData.levelName;
        this.levelLabel.string = levelName.replace(/[a-zA-Z]*/g, "");

        var seconds = Math.floor(savedData.gameTime);
        var hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        var minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;
        this.timeLabel.string = string.format("%d:%02d:%02d", hours, minutes, seconds);

        this.lifeLabel.string = savedData.lifeCount + "";
        this.propLabel.string = savedData.propCount + " / 20";
        this.treasureLabel.string = savedData.treasureCount + " / 4";
    }

    public static create(): LevelScene {
        var view = new LevelScene();
        view.init();
        return view;
    }
}
