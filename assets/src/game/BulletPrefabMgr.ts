import { Component, Node, Prefab, _decorator } from "cc";
import { cc_assert } from "../framework/core/nox";
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class BulletPrefabMgr extends Component {
    private static gCurrenton: BulletPrefabMgr = null;
    public static get CURRENTON(): BulletPrefabMgr {
        return BulletPrefabMgr.gCurrenton;
    }

    @property({ type: Prefab })
    cherryAzure: Prefab = null;

    @property({ type: Prefab })
    cherryBlack: Prefab = null;

    @property({ type: Prefab })
    cherryBlue: Prefab = null;

    @property({ type: Prefab })
    cherryChartreuse: Prefab = null;

    @property({ type: Prefab })
    cherryCyan: Prefab = null;

    @property({ type: Prefab })
    cherryEmerald: Prefab = null;

    @property({ type: Prefab })
    cherryGray: Prefab = null;

    @property({ type: Prefab })
    cherryMagenta: Prefab = null;

    @property({ type: Prefab })
    cherryOrange: Prefab = null;

    @property({ type: Prefab })
    cherryPink: Prefab = null;

    @property({ type: Prefab })
    cherryRed: Prefab = null;

    @property({ type: Prefab })
    cherryViolet: Prefab = null;

    @property({ type: Prefab })
    cherryWhite: Prefab = null;

    @property({ type: Prefab })
    cherryYellow: Prefab = null;

    @property({ type: Prefab })
    negi: Prefab = null;

    onLoad() {
        cc_assert(BulletPrefabMgr.gCurrenton == null)
        BulletPrefabMgr.gCurrenton = this;
    }

    getPrefab(type: string): Prefab {
        var prefab = this[type];
        if (prefab instanceof Prefab) {
            return prefab;
        }
        else {
            return null;
        }
    }
}
