import { cc_assert, cc_sys } from "../../framework/core/nox";
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
    public saveId: number = 0;      // 存档 ID
    public savedData: SavedData = new SavedData();

    public flipedRotateAngle: number = 0;  // 翻转后需要旋转的角度

    // 清空数据
    public clear(): void {
        this.savedData = new SavedData();
    }

    // 读取游戏
    public loadGame(): boolean {
        var savedData = this.getSaveData(this.saveId);
        if (savedData) {
            this.savedData = savedData;
            return true;
        }
        return false;
    }

    // 保存游戏
    public saveGame(): void {
        var content = this.savedData.encode();
        cc_sys.localStorage.setItem("save" + this.saveId, content);
    }

    // 读取存档数据
    private getSaveData(id: number): SavedData {
        var content = cc_sys.localStorage.getItem("save" + id);
        if (content) {
            var save = new SavedData();
            if (save.decode(content)) {
                return save;
            }
        }
        return null;
    }
}
