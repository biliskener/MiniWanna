import { BlockInputEvents, Node } from "cc";
import { nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxScheduler } from "../core/noxScheduler";
import { NoxScene } from "./NoxScene";
import { NoxTipWidget } from "./NoxTipWidget";
import { NoxView, ViewType } from "./NoxView";
import { NoxWidget } from "./NoxWidget";

export module NoxViewMgr {
    const OPTIMIZE_MODE: boolean = false;
    let mRootScene: Node | null = null;
    let mSceneStack: NoxScene[] = [];
    let mRunningScene: NoxScene = null as any as NoxScene;
    let mDestroyingScenes: NoxScene[] = [];
    let mAllViewTypes: { [key: string]: ViewType } = {};
    let mAllRunningWidgets: NoxWidget[] = [];
    let mScreenBlockLayer: Node | null = null;
    let mScreenBlockCount: number = 0;

    export function init(rootScene: Node, allViewTypes: { [key: string]: ViewType }): void {
        mRootScene = rootScene;
        mAllViewTypes = allViewTypes;
        noxScheduler.scheduleUpdate(NoxViewMgr.onUpdate, 0);
    }

    export function getRoot(): Node {
        return mRootScene as Node;
    }

    export function pushScene(scene: NoxScene): void {
        NoxTipWidget.hideCurrentTipWidget();

        if (!OPTIMIZE_MODE) {
            var oldScene = mSceneStack.length > 0 ? mSceneStack[mSceneStack.length - 1] : null;
            if (oldScene) {
                oldScene.exit();
            }
        }

        mSceneStack.push(scene);
        scene.create();

        if (!OPTIMIZE_MODE) {
            scene.enter();
        }
    }

    export function replaceSceneEx(scene: NoxScene, needDestroy: boolean): NoxScene | null {
        NoxTipWidget.hideCurrentTipWidget();

        if (mSceneStack.length > 0) {
            let oldScene: NoxScene = mSceneStack[mSceneStack.length - 1];

            if (!OPTIMIZE_MODE) {
                oldScene.exit();
            }

            if (needDestroy) {
                if (!OPTIMIZE_MODE) {
                    oldScene.destroy();
                }
                else {
                    mDestroyingScenes.push(oldScene);
                }
            }

            mSceneStack[mSceneStack.length - 1] = scene;
            scene.create();

            if (!OPTIMIZE_MODE) {
                scene.enter();
            }

            return oldScene;
        }
        else {
            pushScene(scene);
            return null;
        }
    }

    export function replaceScene(scene: NoxScene): void {
        replaceSceneEx(scene, true);
    }

    export function popSceneEx(needDestroy: boolean): NoxScene {
        NoxTipWidget.hideCurrentTipWidget();

        let oldScene: NoxScene = mSceneStack[mSceneStack.length - 1];

        if (!OPTIMIZE_MODE) {
            oldScene.exit();
        }

        if (needDestroy) {
            if (!OPTIMIZE_MODE) {
                oldScene.destroy();
            }
            else {
                mDestroyingScenes.push(oldScene);
            }
        }

        mSceneStack.pop();

        if (!OPTIMIZE_MODE) {
            if (mSceneStack.length > 0) {
                mSceneStack[mSceneStack.length - 1].enter();
            }
        }

        return oldScene;
    }

    export function popScene(): void {
        popSceneEx(true);
    }

    export function popToRootSceneEx(needDestroy: boolean): NoxScene[] {
        NoxTipWidget.hideCurrentTipWidget();

        var oldScenes = [];
        if (mSceneStack.length > 1) {
            var topScene = mSceneStack[mSceneStack.length - 1];

            if (!OPTIMIZE_MODE) {
                topScene.exit();
            }

            for (var i = mSceneStack.length - 1; i >= 1; --i) {
                let oldScene = mSceneStack[i];
                if (needDestroy) {
                    if (!OPTIMIZE_MODE) {
                        oldScene.destroy();
                    }
                    else {
                        mDestroyingScenes.push(oldScene);
                    }
                }
                mSceneStack.pop();
                oldScenes.push(oldScene);
            }

            if (!OPTIMIZE_MODE) {
                mSceneStack[0].enter();
            }
        }

        return oldScenes;
    }

    export function popToRootScene(): void {
        popToRootSceneEx(true);
    }

    export function getRunningScene(): NoxScene {
        if (!OPTIMIZE_MODE) {
            if (mSceneStack.length > 0) {
                return mSceneStack[mSceneStack.length - 1];
            }
            else {
                return null as any as NoxScene;
            }
        }
        else {
            return mRunningScene;
        }
    }

    export function getNextScene(): NoxScene | null {
        if (mSceneStack.length > 0) {
            return mSceneStack[mSceneStack.length - 1];
        }
        else {
            return null;
        }
    }

    export function getSceneStack(): NoxScene[] {
        return mSceneStack;
    }

    export function addWidget(widget: NoxWidget): void {
        nox.addUniqueItem(mAllRunningWidgets, widget);
    }

    export function removeWidget(widget: NoxWidget): void {
        nox.removeUniqueItem(mAllRunningWidgets, widget);
    }

    export function findView(typeOrName: ViewType | string): NoxView | null {
        var type = typeof (typeOrName) == "string" ? mAllViewTypes[typeOrName] : typeOrName;
        return type && getRunningScene().findView(type) || null;
    }

    export function addView(view: NoxView): void {
        getRunningScene().addView(view);
    }

    export function removeView(view: NoxView, noCleanup?: boolean, ignoreAnim?: boolean): void {
        getRunningScene().removeView(view, noCleanup, ignoreAnim);
    }

    export function makeAsTopView(view: NoxView): void {
        getRunningScene().makeAsTopView(view);
    }

    export function forceUpdateScene(): void {
        if (!OPTIMIZE_MODE) {

        }
        else {
            var currScene = getRunningScene();
            var nextScene = getNextScene();
            if (currScene != nextScene) {
                if (currScene) {
                    currScene.exit();
                }
                mRunningScene = nextScene as NoxScene;

                var scenes = mDestroyingScenes.slice();
                mDestroyingScenes = [];
                for (var i = 0; i < scenes.length; ++i) {
                    scenes[i].destroy();
                }

                if (nextScene) {
                    nextScene.enter();
                }
            }
        }
    }

    export function onUpdate(dt: number): void {
        forceUpdateScene();

        var scene: NoxScene = NoxViewMgr.getRunningScene();
        if (scene) {
            scene.processUpdate(dt);
        }

        var widgets = mAllRunningWidgets.slice();
        for (var i = 0; i < widgets.length; ++i) {
            var widget = widgets[i];
            if (widget.isRunning()) {
                widget.onUpdate(dt);
            }
        }
    }

    // 添加屏幕阻断
    export function addScreenBlock(): void {
        if (mScreenBlockLayer == null) {
            mScreenBlockLayer = mScreenBlockLayer = noxcc.createNodeAndFullSize();
            mScreenBlockLayer.addComponent(BlockInputEvents);
            mScreenBlockLayer.active = false;
            noxcc.setZOrder(mScreenBlockLayer, 100);
            noxcc.addChild(getRoot(), mScreenBlockLayer);
        }
        mScreenBlockCount++;
        mScreenBlockLayer.active = mScreenBlockCount > 0;
    }

    // 移除屏幕阻断
    export function removeScreenBlock(): void {
        mScreenBlockCount--;
        if (mScreenBlockLayer) {
            mScreenBlockLayer.active = mScreenBlockCount > 0;
        }
    }
}
