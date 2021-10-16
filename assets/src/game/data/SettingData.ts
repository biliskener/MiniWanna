import { cc_assert } from "../../framework/core/nox";
import { UserDefault } from "../../framework/core/UserDefault";

export class SettingData {
    private static gInstance: SettingData = null as any as SettingData;

    public enableSound: boolean = true;

    public static createInstance() {
        cc_assert(this.gInstance == null);
        this.gInstance = new SettingData();
        return this.gInstance;
    }

    public static get INSTANCE() {
        return this.gInstance;
    }

    private constructor() {
        this.loadData();
    }

    public loadData() {
        var json = UserDefault.getJsonForKey("SettingData");
        if (json) {
            this.enableSound = json.enableSound;
        }
    }

    public saveData() {
        var json = {
            enableSound: this.enableSound,
        };
        UserDefault.setJsonForKey("SettingData", json);
    }
}
