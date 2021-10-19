import { cc_assert, cc_sys } from "../../framework/core/nox";
import { UserDefault } from "../../framework/core/UserDefault";
import { SavedData } from "./SavedData";

export class GameData {
    private static gInstance: GameData = null as any as GameData;

    public static createInstance() {
        cc_assert(this.gInstance == null);
        this.gInstance = new GameData();
        return this.gInstance;
    }

    public static get INSTANCE() {
        return this.gInstance;
    }

    public init: boolean = false;   // 是否初始化
    public currSaveId: number = 0;  // 存档 ID
    public currSavedData: SavedData = null;
    public allSavedData: { [key: string]: SavedData } = {};

    public flipedRotateAngle: number = 0;  // 翻转后需要旋转的角度

    // 清空数据
    public clear(): void {
        this.currSavedData = null;
    }

    // 读取游戏
    public loadGame(): boolean {
        if (this.currSaveId) {
            var savedData = this.loadSavedData(this.currSaveId);
            this.currSavedData = savedData;
            return true;
        }
        return false;
    }

    // 保存游戏
    public saveGame(): void {
        if (this.currSaveId && this.currSavedData) {
            var content = this.currSavedData.encode();
            UserDefault.setStringForKey("save" + this.currSaveId, content);
        }
    }

    // 读取存档数据
    public getSavedData(id: number): SavedData {
        return this.allSavedData[id];
    }

    // 加载指定的存档
    private loadSavedData(id: number) {
        var savedData = new SavedData(id);
        var content = UserDefault.getStringForKey("save" + id);
        if (content) {
            savedData.decode(content);
        }
        return savedData;
    }

    // 加载所有的存档
    public loadAllSavedData() {
        this.allSavedData = {}
        for (var id = 1; id <= 3; ++id) {
            var savedData = this.loadSavedData(id);
            this.allSavedData[id] = savedData;
        }
    }

    public unloadAllSavedData() {
        this.allSavedData = {};
    }

    public setCurrSaveId(id: number) {
        this.currSaveId = id;
    }
}
