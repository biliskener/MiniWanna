import { ZOrder } from "../framework/const/ZOrder";
import { ViewFlag } from "../framework/view/NoxView";


export const AllViewTypes = {
    GameScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/GameScene",
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

    LevelScene: {
        flags: ViewFlag.Main,
        module: ZOrder.scene,
        hierarchy: 1,
        resPath: "scene/LevelScene",
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

    ResourcePanel: {
        flags: ViewFlag.Panel,
        module: ZOrder.form,
        hierarchy: 1,
        resPath: "panel/ResourcePanel",
    },

    Dialog: {
        flags: ViewFlag.Dialog,
        module: ZOrder.dialog,
        hierarchy: 1,
        resPath: "common/Dialog",
    },

    AcrossLevelPanel: {
        flags: ViewFlag.Panel,
        module: ZOrder.form,
        hierarchy: 1,
        resPath: "panel/AcrossLevelPanel",
    }
};
