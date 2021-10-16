import { SceneId } from "../../game/const/SceneId";
import { NoxViewMgr } from "../view/NoxViewMgr";
import { BaseScene } from "./BaseScene";
import { BaseSceneImpl } from "./BaseSceneImpl";

export module SceneManager {
    export function pushScene(scene: BaseScene): void {
        if (scene) {
            NoxViewMgr.pushScene(new BaseSceneImpl(scene));
            scene.show();
        }
    }

    export function popScene(isToRoot?: boolean): void {
        if (isToRoot) {
            NoxViewMgr.popToRootScene();
        }
        else {
            NoxViewMgr.popScene();
        }
    }

    export function replaceScene(scene: BaseScene): void {
        if (scene) {
            NoxViewMgr.replaceScene(new BaseSceneImpl(scene));
            scene.show();
        }
    }

    export function replaceSceneEx(scene: BaseScene, needDestroy: boolean = false): void {
        if (scene) {
            NoxViewMgr.replaceSceneEx(new BaseSceneImpl(scene), needDestroy);
            scene.show();
        }
    }

    export function getRunningScene(): BaseScene {
        return BaseSceneImpl.getRunningScene();
    }

    export function getRunningSceneId(): SceneId {
        return BaseSceneImpl.getRunningSceneId();
    }

    export function getSceneList(): BaseScene[] {
        return BaseSceneImpl.getSceneList();
    }
}
