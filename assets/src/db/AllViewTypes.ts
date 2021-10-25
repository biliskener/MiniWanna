import { ZOrder } from "../framework/const/ZOrder";
import { ViewFlag } from "../framework/view/NoxView";


export const AllViewTypes = {
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

    LevelScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/LevelScene",
    },

    Dialog: {
        flags: ViewFlag.Dialog,
        module: ZOrder.dialog,
        hierarchy: 1,
        resPath: "common/Dialog",
    },
};
