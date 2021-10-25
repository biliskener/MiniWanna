import { ViewFlag } from "../../framework/view/NoxView";
import { ZOrder } from "../const/ZOrder";

export const AllViewTypes = {
    LevelScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/LevelScene",
    },

    SplashScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/SplashScene",
    },

    SelectScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/SelectScene",
    },

    MenuScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/MenuScene",
    },

    BossScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/BossScene",
    },

    EndScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/EndScene",
    },

    Dialog: {
        flags: ViewFlag.Dialog,
        module: ZOrder.dialog,
        hierarchy: 1,
        resPath: "common/Dialog",
    },

    TreasurePromptForm: {
        flags: ViewFlag.Panel,
        module: ZOrder.form,
        hierarchy: 1,
        resPath: "form/TreasurePromptForm",
    }
};
