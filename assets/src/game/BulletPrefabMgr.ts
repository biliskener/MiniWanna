import { Animation, Component, Node, Prefab, Rect, _decorator } from "cc";
import { cc_assert, cc_instantiate } from "../framework/core/nox";
import { noxcc } from "../framework/core/noxcc";
import { GameMap } from "./map/GameMap";
import { MapUtil } from "./map/MapUtil";
//import { BossBullet } from "./map/object/iwbt/boss/BossBullet";
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

    createRawBullet(type: string): Node {
        var prefab = this[type] as Prefab;
        if (prefab) {
            var node = cc_instantiate(prefab);
            var animation = node.getComponent(Animation);
            if (animation) animation.enabled = true;
            node.getComponent("BossBullet").enabled = true;
            return node;
        }
        else {
            return null;
        }
    }

    createBullet(map: GameMap, type: string, group: number): Node {
        var prefab = this[type] as Prefab;
        if (prefab) {
            var node = cc_instantiate(prefab);
            var animation = node.getComponent(Animation);
            if (animation) animation.enabled = true;
            node.getComponent("BossBullet").enabled = true;
            if (type.match(/^cherry/)) {
                MapUtil.addCircleCollider(node, map, group, true, new Rect(0, 0, noxcc.w(node), noxcc.h(node)), 0);
            }
            else {
                MapUtil.addBoxCollider(node, map, group, true, null, 0);
            }
            MapUtil.setDynamicType(node);
            return node;
        }
        else {
            return null;
        }
    }
}
