import { Node, Prefab, RichText } from "cc";
import { ZOrder } from "../const/ZOrder";
import { cc_tween, nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxScheduler } from "../core/noxScheduler";
import { NoxViewMgr } from "../view/NoxViewMgr";
import { StaticPrefabMgr } from "./StaticPrefabMgr";

export module NoticeManager {
    var MAX_TEXT_WIDTH = 640;
    var MOVE_SPEED = 400;

    const PaddingX = 4;
    const PaddingY = 4;
    const SpacingX = 2;
    const SpacingY = 2;

    let mPrefab: Prefab = null as any as Prefab;
    var mPanels: { [key: number]: Node } = {};
    var mSortedPanels: Node[] = [];
    var mUpdateID: noxScheduler.UpdateID | null = null;

    export function init(): void {
        mPrefab = StaticPrefabMgr.getNoticePrefab();

        if (mUpdateID == null) {
            mUpdateID = noxScheduler.scheduleUpdate(scheduler, 0);
        }
    }

    export function shut(): void {
        if (mUpdateID) {
            noxScheduler.unscheduleUpdate(mUpdateID);
            mUpdateID = null;
        }
    }

    export function show(node: Node, myType?: string, duration?: number, noticeId?: number): number {
        var root = getRootNode();
        if (root == null) {
            node.destroy();
            return noticeId ?? -1;
        }

        if (noticeId != null && mPanels[noticeId] != null) {
            node.destroy();
            return noticeId;
        }

        var newNoticeId = 1;
        while (mPanels[newNoticeId] != null) {
            newNoticeId = newNoticeId + 1;
        }

        let richText = node.getComponent(RichText);
        if (richText) {
            richText.maxWidth = MAX_TEXT_WIDTH;
        }

        var panel = noxcc.instantiate(mPrefab);
        var button = noxcc.findButton("CloseBtn", panel);
        noxcc.addClick(button, null, function () {
            hide(newNoticeId);
        });

        noxcc.setSize(panel, PaddingX * 2 + MAX_TEXT_WIDTH + SpacingX + noxcc.w(button.node), Math.max(noxcc.h(node), noxcc.h(button.node)) + PaddingY * 2);
        noxcc.setNodeOpacity(panel, 250);

        noxcc.setParent(node, panel);
        if (myType == "push_notice_maintenance") {
            node.setPosition(0, 0);// 加到中心
        }
        else {
            node.setPosition(noxcc.aleft(panel) + noxcc.asw(node) + PaddingX, 0);
        }

        noxcc.setZOrder(panel, ZOrder.toast);
        noxcc.addChild(root, panel);

        sortPanels();

        if (mSortedPanels.length > 0) {
            panel.setPosition(0, noxcc.top(mSortedPanels[0]) + noxcc.ash(panel) + SpacingY);
        }
        else {
            panel.setPosition(0, noxcc.atop(root) + noxcc.ash(panel));
        }

        mPanels[newNoticeId] = panel;
        mSortedPanels.unshift(panel);

        if (duration != null) {
            cc_tween(panel).delay(duration).call(() => {
                hide(newNoticeId);
            }).start();
        }
        return newNoticeId;
    }

    export function hide(noticeId: number): void {
        if (mPanels[noticeId] == null) return;

        var panel = mPanels[noticeId];
        noxcc.destroy(panel);
        delete mPanels[noticeId];

        sortPanels();
    }

    export function hideAll(): void {
        for (var noticeId in mPanels) {
            var panel = mPanels[noticeId];
            hide(parseInt(noticeId));
        }
    }

    export function bindToRunningScene(): void {
        var root = getRootNode();
        for (var noticeId in mPanels) {
            var panel = mPanels[noticeId];
            if (panel.getParent() == null) {
                noxcc.setZOrder(panel, ZOrder.toast);
                noxcc.setParent(panel, root);
            }
        }
    }

    export function unbindFromRunningScene(): void {
        for (var noticeId in mPanels) {
            var panel = mPanels[noticeId];
            if (panel.parent != null) {
                noxcc.setParent(panel, null);
            }
        }
        mPanels = {};
        mSortedPanels = [];
    }

    export function sortPanels(): void {
        mSortedPanels = nox.values(mPanels).sort(function (a, b) {
            return noxcc.y(b) - noxcc.y(a);
        });
    }

    function scheduler(dt: number): void {
        var root = getRootNode();
        if (mSortedPanels.length > 0) {
            for (var i = 0; i < mSortedPanels.length; ++i) {
                var targetY;
                if (i == 0) {
                    targetY = noxcc.atop(root) - noxcc.astop(mSortedPanels[i]);
                }
                else {
                    targetY = noxcc.bottom(mSortedPanels[i - 1]) - SpacingY - noxcc.astop(mSortedPanels[i]);
                }
                var srcY = noxcc.y(mSortedPanels[i]);
                if (targetY > srcY) {
                    noxcc.setY(mSortedPanels[i], (Math.min(srcY + MOVE_SPEED * dt, targetY)));
                }
                else {
                    noxcc.setY(mSortedPanels[i], (Math.max(srcY - MOVE_SPEED * dt, targetY)));
                }
            }
        }
    }

    function getRootNode(): Node {
        return NoxViewMgr.getRunningScene() && NoxViewMgr.getRunningScene().getSceneNode();
    }
}
