import { noxEvent0 } from "../../framework/core/noxEvent";

export class SavedData {
    public id: number;                              // 存档ID
    public changed: boolean = false;
    public version: number = 1;                     // 存档版本号
    public levelName: string = "";                  // 关卡名称
    public targetTile: [number, number] = null;     // 出生的块
    public mode: string = "";                       // 困难模式
    public gameTime: number = 0;                    // 游戏时间
    public lifeCount: number = 999;                 // 生命数量
    public deathCount: number = 0;                  // 玩家死亡次数
    public treasureCount: number = 0;               // 获得的宝物数量
    public propCount: number = 0;                   // 获得的道具数量
    public levelStates: SavedData.LevelStates = {}; // 每一关的每个对象的状态值

    public dataChangedEvent: noxEvent0 = new noxEvent0();

    public constructor(id: number) {
        this.id = id;
    }

    public encode(): string {
        var data = {
            version: this.version,
            levelName: this.levelName,
            targetTile: this.targetTile,
            mode: this.mode,
            gameTime: this.gameTime,
            deathCount: this.deathCount,
            lifeCount: this.lifeCount,
            treasureCount: this.treasureCount,
            propCount: this.propCount,
            levelStates: this.levelStates,
        };
        return JSON.stringify(data);
    }

    public decode(content: string): boolean {
        try {
            var data = JSON.parse(content);
            this.changed = false;
            this.version = data.version;
            this.levelName = data.levelName;
            this.targetTile = data.targetTile;
            this.mode = data.mode;
            this.gameTime = data.gameTime;
            this.deathCount = data.deathCount || 0;
            this.lifeCount = data.lifeCount || 999;
            this.treasureCount = data.treasureCount || 0;
            this.propCount = data.propCount || 0;
            this.levelStates = data.levelStates;
            return true;
        }
        catch (e) {
            return false;
        }
    }

    public getObjectState(levelName: string, objectName: string): number {
        var levelStates = this.levelStates[levelName];
        if (!levelStates) {
            levelStates = this.levelStates[levelName] = {};
        }
        var state = levelStates[objectName];
        if (state == null) {
            state = levelStates[objectName] = 0;
        }
        return state;
    }

    public setObjectState(levelName: string, objectName: string, state: number) {
        var levelStates = this.levelStates[levelName];
        if (!levelStates) {
            levelStates = this.levelStates[levelName] = {};
        }
        levelStates[objectName] = state;
        this.changed = true;
    }

    public addGameTime(dt: number) {
        var oldSeconds = Math.floor(this.gameTime);
        this.gameTime += dt;
        var newSeconds = Math.floor(this.gameTime);
        if (newSeconds != oldSeconds) {
            this.dataChangedEvent.dispatchEvent();
        }
    }

    public addPropCount() {
        this.propCount++;
        this.dataChangedEvent.dispatchEvent();
    }

    public addTreasureCount() {
        this.treasureCount++;
        this.dataChangedEvent.dispatchEvent();
    }

    public addDeathCount() {
        this.deathCount++;
        this.lifeCount--;
        this.dataChangedEvent.dispatchEvent();
    }

    public addLifeCount(count: number) {
        this.lifeCount += count;
        this.dataChangedEvent.dispatchEvent();
    }

    public setLevelAndTile(levelName: string, targetTile: [number, number]) {
        this.levelName = levelName;
        this.targetTile = targetTile;
    }
}

export module SavedData {
    export type LevelState = { [key: string]: number };
    export type LevelStates = { [key: string]: LevelState };
}
