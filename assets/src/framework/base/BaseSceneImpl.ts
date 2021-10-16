import { SceneId } from "../../game/const/SceneId";
import { cc_assert } from "../core/nox";
import { NoxScene } from "../view/NoxScene";
import { NoxViewMgr } from "../view/NoxViewMgr";
import { BaseScene } from "./BaseScene";

export class BaseSceneImpl extends NoxScene {
    public _layer: BaseScene;

    public constructor(layer: BaseScene) {
        super();
        this._layer = layer;
    }

    public static getRunningScene(): BaseScene {
        var scene = NoxViewMgr.getRunningScene();
        if (scene instanceof BaseSceneImpl) {
            return scene._layer;
        }
        cc_assert(false, "need BaseSceneImpl");
        return null;
    }

    public static getRunningSceneId(): SceneId {
        var scene = NoxViewMgr.getRunningScene();
        if (scene instanceof BaseSceneImpl) {
            return scene._layer._sceneId;
        }
        cc_assert(false, "need BaseSceneImpl");
        return null;
    }

    public static getSceneList(): BaseScene[] {
        var results: BaseScene[] = [];
        var scenes = NoxViewMgr.getSceneStack();
        for (var i = 0; i < scenes.length; ++i) {
            var scene = scenes[i];
            if (scene instanceof BaseSceneImpl) {
                results.push(scene._layer);
            }
        }
        return results;
    }
}
