// 常驻预制件加载

import { Font, Label, Node, ParticleSystem2D, Prefab, RichText, Sprite, SpriteFrame, TTFFont } from "cc";
import { ResConfig } from "../config/ResConfig";
import { cc_assert, CC_DEBUG, nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { NoxResMgr } from "./NoxResMgr";
import { ResourceAlivePools } from "./ResourceAlivePools";

export module StaticPrefabMgr {
    enum State {
        NotLoaded = 0,
        Loading = 1,
        Loaded = 2,
    }

    let mState: State = State.NotLoaded;
    let mRootPrefab: Node = null as any as Node;
    let mToastPrefab: Prefab = null as any as Prefab;
    let mMarqueePrefab: Prefab = null as any as Prefab;
    let mNoticePrefab: Prefab = null as any as Prefab;

    let mGuideNpcTipLayerPrefab: Prefab = null as any as Prefab;

    let mSprites: { [key: string]: Sprite } = {};
    let mParticles: { [key: string]: ParticleSystem2D } = {};
    let mLabelsWithBMFont: { [key: string]: Label } = {};

    let mSingleColorSprite: Sprite = null as any as Sprite;

    let mListH: Node = null as any as Node;
    let mListV: Node = null as any as Node;
    let mEditBoxS: Node = null as any as Node;
    let mEditBoxM: Node = null as any as Node;
    let mBoxProgressBar: Node = null as any as Node;
    let mSingleSprite: Node = null as any as Node;
    let mDefaultTTFFont: TTFFont = null as any as TTFFont;

    export function init(callback: () => void): void {
        if (mState == State.NotLoaded) {
            mState = State.Loading;

            var doneTaskCount = 0;
            var allTaskCount = 0;

            var prefabTasks: { [key: string]: (prefab: Prefab) => void } = {
                "common/StaticPrefab": (prefab: Prefab) => {
                    mRootPrefab = noxcc.instantiate(prefab);
                },
                "common/Toast": (prefab: Prefab) => {
                    mToastPrefab = prefab;
                    ResourceAlivePools.setAliveAsset("StaticPrefabMgr", "common/Toast", mToastPrefab);
                },
                "common/Marquee": (prefab: Prefab) => {
                    mMarqueePrefab = prefab;
                    ResourceAlivePools.setAliveAsset("StaticPrefabMgr", "common/Marquee", mMarqueePrefab);
                },
                "common/Notice": (prefab: Prefab) => {
                    mNoticePrefab = prefab;
                    ResourceAlivePools.setAliveAsset("StaticPrefabMgr", "common/Notice", mNoticePrefab);
                },

                "guide/GuideNpcTipLayer": (prefab: Prefab) => {
                    mGuideNpcTipLayerPrefab = prefab;
                    ResourceAlivePools.setAliveAsset("StaticPrefabMgr", "guide/GuideNpcTipLayer", mGuideNpcTipLayerPrefab);
                },
            };

            var allTaskCount = nox.keys(prefabTasks).length;
            var doneTaskCount = 0;
            for (let name in prefabTasks) {
                noxcc.loadPrefab(nox.pathJoin(ResConfig.viewPath, name), function (err: Error | null, prefab: Prefab) {
                    if (mState == State.Loading) {
                        cc_assert(prefab, "prefab load failed");
                        prefabTasks[name](prefab);
                        if (++doneTaskCount == allTaskCount) {
                            noxcc.loadTtfFont(nox.isJsb ? "fonts/arialuni-cafeta" : "fonts/cafeta", function (err: Error | null, ttfFont: TTFFont) {
                                cc_assert(ttfFont, "ttfFont load failed");
                                mDefaultTTFFont = ttfFont;
                                mState = State.Loaded;
                                onPrefabLoaded();
                                callback && callback();
                            });
                        }
                    }
                });
            }
        }
    }

    export function shut(): void {
    }

    function onPrefabLoaded(): void {
        mSprites = {};
        var spritesNode = noxcc.findNode("Sprites", mRootPrefab);
        var children = spritesNode.children;
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            var name = child.name;
            var sprite = noxcc.getSprite(child);
            CC_DEBUG && cc_assert(name, "need name");
            CC_DEBUG && cc_assert(mSprites[name] == null, `sprite ${name} already exists`);
            mSprites[name] = sprite;
        }

        var particlesNode = noxcc.findNode("Particles", mRootPrefab);
        var children = particlesNode.children;
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            var name = child.name;
            var particle = noxcc.getParticleSystem2D(child);
            CC_DEBUG && cc_assert(name, "need name");
            CC_DEBUG && cc_assert(mParticles[name] == null, `ParticleSystem ${name} already exists`);
            mParticles[name] = particle;
        }

        mLabelsWithBMFont = {};
        var mBMFontsNode = noxcc.findNode("BMFonts", mRootPrefab);
        var children = mBMFontsNode.children;
        for (var i = 0; i < children.length; ++i) {
            var child = children[i];
            var name = child.name;
            var label = noxcc.getLabel(child);
            CC_DEBUG && cc_assert(name, "need name");
            CC_DEBUG && cc_assert(mLabelsWithBMFont[name] == null, `bmfont ${name} already exists`);
            mLabelsWithBMFont[name] = label;
        }

        mSingleColorSprite = mSprites["singleColor"];
        cc_assert(mSingleColorSprite, "mSingleColorSprite not found");

        mListH = noxcc.findNode("ListView/ListViewH", mRootPrefab);
        mListH.setPosition(0, 0);

        mListV = noxcc.findNode("ListView/ListViewV", mRootPrefab);
        mListV.setPosition(0, 0);

        mEditBoxS = noxcc.findNode("EditBox/EditBoxS", mRootPrefab);
        mEditBoxS.setPosition(0, 0);

        mEditBoxM = noxcc.findNode("EditBox/EditBoxM", mRootPrefab);
        mEditBoxM.setPosition(0, 0);

        mBoxProgressBar = noxcc.findNode("ProgressBar/BoxProgressBar", mRootPrefab);
        mBoxProgressBar.setPosition(0, 0);

        mSingleSprite = noxcc.findNode("SingleSprite", mRootPrefab);
        mSingleSprite.setPosition(0, 0);
    }

    export function getToastPrefab(): Prefab {
        return mToastPrefab;
    }

    export function getMarqueePrefab(): Prefab {
        return mMarqueePrefab;
    }

    export function getNoticePrefab(): Prefab {
        return mNoticePrefab;
    }

    export function getGuideNpcTipLayerPrefab(): Prefab {
        return mGuideNpcTipLayerPrefab;
    }

    // 获得池中的Sprite对象
    export function getSprite(name: string): Sprite {
        return mSprites[name];
    }

    export function getSpriteFrame(path: string): SpriteFrame {
        var sprite: Sprite = mSprites[path];
        return sprite && sprite.spriteFrame as SpriteFrame;
    }

    export function getParticleSystem(name: string): ParticleSystem2D {
        return mParticles[name];
    }

    export function getLabelWithBMFont(name: string): Label {
        name = name.replace(/\.fnt$/, '').replace(/.*[\\\/]/g, '');
        return mLabelsWithBMFont[name];
    }

    export function getBMFont(name: string): Font {
        var label = getLabelWithBMFont(name);
        return label && label.font as Font;
    }

    // 给Sprite组件设置图片, 优先查找预制体池
    export function loadAndSetSpriteFrame(sprite: Sprite, path: string): void {
        var sp = getSprite(path);
        if (sp) {
            NoxResMgr.addSpriteFrameVersion(sprite);
            sprite.spriteFrame = sp.spriteFrame;
            sprite.type = sp.type;
        }
        else {
            NoxResMgr.setSpriteFrameAsync(sprite, path);
        }
    }

    export function getColorSprite(): Node {
        return mSingleColorSprite.node;
    }

    export function getListHPrefab(): Node {
        return mListH;
    }

    export function getListVPrefab(): Node {
        return mListV;
    }

    export function getEditBoxS(): Node {
        return mEditBoxS;
    }

    export function getEditBoxM(): Node {
        return mEditBoxM;
    }

    export function getBoxProgressBar(): Node {
        return mBoxProgressBar;
    }

    export function getSingleSprite(): Node {
        return mSingleSprite;
    }

    export function getDefaultTTFFont(): TTFFont {
        return mDefaultTTFFont;
    }

    export function configDefaultTTFFont(target: Label | RichText): void {
        target.font = mDefaultTTFFont;
        target.useSystemFont = false;
    }
}
