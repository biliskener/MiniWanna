import { easing, Node, Prefab, Tween, UIOpacity, v3 } from "cc";
import { UIConfig } from "../config/UIConfig";
import { ZOrder } from "../const/ZOrder";
import { cc_tween, cc_v3 } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxTime } from "../core/noxTime";
import { RichTextUtil } from "../util/RichTextUtil";
import { NoxViewMgr } from "../view/NoxViewMgr";
import { StaticPrefabMgr } from "./StaticPrefabMgr";

export module ToastManager {
    let mAutoID = 1;
    let mToasts: { [key: string]: Node } = {};
    let mBuffers: { texts: string[], duration: number, delay: number, isRichText: boolean }[] = [];
    let mPrefab: Prefab = null as any as Prefab;
    let DURATION_LONG = 4.0;

    export function init(): void {
        mPrefab = StaticPrefabMgr.getToastPrefab();
        for (var i = 0; i < mBuffers.length; ++i) {
            var buffer = mBuffers[i];
            if (buffer.texts.length == 1) {
                push(buffer.texts[0], buffer.duration, buffer.isRichText);
            }
            else {
                pushArray(buffer.texts, buffer.duration, buffer.delay);
            }
        }
        mBuffers = [];
    }

    export function shut(): void {
        for (var key in mToasts) {
            var bg = mToasts[key];
            noxcc.destroy(bg);
            delete mToasts[key];
        }
        mBuffers = [];
    }

    export function push(text: string, duration: number = 0, isRichText: boolean = false) {

        let msg;
        // 发现旧的同内容的节点就销毁
        if (mToasts[text]) {
            mToasts[text].destroy();
            delete mToasts[text];
        }

        if (isRichText) {
            msg = RichTextUtil.createBoldRichText(text, UIConfig.RICHTEXT_PARAM_LIGHT_S1).node;
        }
        else {
            text = text.replace(/[|]+/g, "");
            msg = RichTextUtil.createLabel(text, { family: UIConfig.TTF_FONT, size: UIConfig.FontSize.M1 }).node;
        }

        var bg = noxcc.instantiate(mPrefab);
        noxcc.setSize(bg, noxcc.w(msg) + 80, noxcc.h(msg) + 80);

        bg.addChild(msg);

        mToasts[text] = bg;
        runBgAction(text, duration);
    }

    export function pushArray(texts: string[], duration?: number, delay?: number) {
        var text = texts.join("<br/>");
        push(text, duration, true);
    }

    export function pushMultiline(text: string, duration?: number) {
        text = text.replace(/\n/, "<br/>");
        push(text, duration, true);
    }

    export function runBgAction(key: string, duration: number) {
        var bg: Node = mToasts[key];

        var root = NoxViewMgr.getRoot();
        bg.setPosition(0, 150);
        noxcc.setZOrder(bg, ZOrder.toast);
        noxcc.addChild(root, bg);

        var distance = (noxcc.h(root) - noxcc.y(bg)) / 2;

        var action1 = cc_tween(bg)
            .to(noxTime.absTime(0.2), { scale: cc_v3(1, 1, 1) }, { easing: 'backOut' })
            .delay(noxTime.absTime(0.3))
            .by(noxTime.absTime(2), { position: cc_v3(0, distance, 0) })
            .parallel(
                cc_tween().by(noxTime.absTime(2), { position: cc_v3(0, distance, 0) }),
                cc_tween().target(noxcc.getOrAddComponent(bg, UIOpacity)).to(noxTime.absTime(1.5), { opacity: 0 })
            );

        var action2 = cc_tween(bg).delay(duration || DURATION_LONG - 1.0).call(() => {
            bg.destroy();
            delete mToasts[key];
        });

        action1.start();
        action2.start();
    }
}
