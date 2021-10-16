//!! TODO 如何把noxcc的一部分合并过来
import { Sprite, SpriteFrame, Node, sp, ParticleAsset, ParticleSystem2D, Prefab, Animation, AnimationClip, AudioClip, Asset } from "cc";
import { CC_DEBUG, cc_error, cc_isValid, nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxScheduler } from "../core/noxScheduler";
import { AssetsTable } from "../core/T";

export module NoxResMgr {
    // 转换成审核图片名称
    export const getReviewingImageName = function (name: string): string {
        return name;
    };

    // 转换成审核动画图片
    export const getReviewingSpineName = function (name: string): string {
        return name;
    };

    function getSpriteFrameVersion(sprite: Sprite): number {
        return (sprite as any).__spriteFrameVersion || 0;
    }

    function setSpriteFrameVersion(sprite: Sprite, version: number): void {
        (sprite as any).__spriteFrameVersion = version;
    }

    export function addSpriteFrameVersion(sprite: Sprite) {
        let newVersion = getSpriteFrameVersion(sprite) + 1;
        setSpriteFrameVersion(sprite, newVersion);
        return newVersion;
    }

    export function loadSpriteFrameAsync(nameOrPath: string, callback: (err: Error | null, obj: SpriteFrame) => any): void {
        let resPath = nameOrPath;
        noxcc.loadSpriteFrame(resPath, callback);
    }

    export function setSpriteFrameAsync(target: Sprite | Node, nameOrPath: string, callback?: (spriteFrame: SpriteFrame, target?: Sprite) => void): void {
        let sprite: Sprite = target instanceof Sprite ? target : noxcc.getSprite(target);
        if (nameOrPath) {
            let spriteFrameVersion = addSpriteFrameVersion(sprite);
            loadSpriteFrameAsync(nameOrPath, function (err: Error | null, spriteFrame: SpriteFrame) {
                if (spriteFrame && cc_isValid(spriteFrame)) {
                    if (cc_isValid(sprite) && spriteFrameVersion == getSpriteFrameVersion(sprite)) {
                        sprite.spriteFrame = spriteFrame;
                        callback && callback(spriteFrame, sprite);
                    }
                }
                else {
                    CC_DEBUG && cc_error(`SpriteFrame ${nameOrPath} not found`);
                }
            });
        }
        else {
            sprite.spriteFrame = null;
            addSpriteFrameVersion(sprite);
        }
    }

    function getSkeletonVersion(skeleton: sp.Skeleton): number {
        return (skeleton as any).__animationVersion || 0;
    }

    function setSkeletonVersion(skeleton: sp.Skeleton, version: number): void {
        (skeleton as any).__animationVersion = version;
    }

    function addSkeletonVersion(skeleton: sp.Skeleton) {
        let newVersion = getSkeletonVersion(skeleton) + 1;
        setSkeletonVersion(skeleton, newVersion);
        return newVersion;
    }

    export function loadSkeletonAsync(resPath: string, callback: (err: Error | null, skeletonData: sp.SkeletonData) => any): void {
        //resPath = resPath.replace(/.*\//g, "");
        //resPath = "spine/" + resPath;
        return noxcc.loadSkeletonData(resPath, callback);
    }

    export function setSkeletonAnimAsync(target: sp.Skeleton | Node, resPath: string, skinName: string, animName: string, loop: boolean, callback?: (skeletonData: sp.SkeletonData, target?: sp.Skeleton) => void): void {
        let skeleton: sp.Skeleton = target instanceof sp.Skeleton ? target : noxcc.getSkeleton(target);
        let animationVersion = addSkeletonVersion(skeleton);
        loadSkeletonAsync(resPath, function (err: Error | null, skeletonData: sp.SkeletonData) {
            if (skeletonData) {
                if (cc_isValid(skeleton) && animationVersion == getSkeletonVersion(skeleton)) {
                    skeleton.skeletonData = skeletonData;
                    if (skinName != null) skeleton.setSkin(skinName);
                    if (animName != null) skeleton.setAnimation(1, animName, loop);
                    callback && callback(skeletonData, skeleton);
                }
                else {
                    CC_DEBUG && nox.log(`Skeleton ${resPath} version expired`);
                }
            }
            else {
                CC_DEBUG && cc_error(`Skeleton ${resPath} not found`);
            }
        });
    }

    function getParticle2DVersion(ps: ParticleSystem2D): number {
        return (ps as any).__particleVersion || 0;
    }

    function setParticle2DVersion(ps: ParticleSystem2D, version: number): void {
        (ps as any).__particleVersion = version;
    }

    function addParticle2DVersion(ps: ParticleSystem2D) {
        let newVersion = getParticle2DVersion(ps) + 1;
        setParticle2DVersion(ps, newVersion);
        return newVersion;
    }

    export function loadParticle2DAsync(resPath: string, callback: (err: Error | null, particleAsset: ParticleAsset) => any): void {
        //resPath = resPath.replace(/.*\//g, "");
        //resPath = "particle/" + resPath;
        return noxcc.loadParticleAsset(resPath, callback);
    }

    export function setParticle2DAsync(target: ParticleSystem2D | Node, resPath: string, autoRemove: boolean, callback?: (particleAsset: ParticleAsset, target?: ParticleSystem2D) => void): void {
        let particleSystem: ParticleSystem2D = target instanceof ParticleSystem2D ? target : noxcc.getParticleSystem2D(target);
        let particleVersion = addParticle2DVersion(particleSystem);
        loadParticle2DAsync(resPath, function (err: Error | null, particleAsset: ParticleAsset) {
            if (particleAsset) {
                if (cc_isValid(particleSystem) && particleVersion == getParticle2DVersion(particleSystem)) {
                    particleSystem.file = particleAsset;
                    callback && callback(particleAsset, particleSystem);
                }
            }
            else {
                CC_DEBUG && cc_error(`Particle ${resPath} not found`);
            }
        });
    }

    export function loadPrefabAsync(resPath: string, callback: (err: Error | null, prefab: Prefab) => any, progressCallback?: (completedCount: number, totalCount: number, item: any) => any) {
        noxcc.loadPrefab(resPath, callback, progressCallback);
    }

    export function setPrefabToParentAsync(target: Node, resPath: string, callback?: (node: Node, target?: Node) => void): void {
        loadPrefabAsync(resPath, function (err: Error | null, prefab: Prefab) {
            if (prefab) {
                if (cc_isValid(target)) {
                    let node = noxcc.instantiate(prefab);
                    noxcc.setParent(node, target);
                    callback && callback(node, target);
                }
            }
            else {
                CC_DEBUG && cc_error(`Prefab ${resPath} not found`);
            }
        });
    }

    function getAnimClipVersion(anim: Animation): number {
        return (anim as any).__animClipVersion || 0;
    }

    function setAnimClipVersion(anim: Animation, version: number): void {
        (anim as any).__animClipVersion = version;
    }

    function addAnimClipVersion(anim: Animation) {
        let newVersion = getAnimClipVersion(anim) + 1;
        setAnimClipVersion(anim, newVersion);
        return newVersion;
    }

    export function loadAnimClipAsync(resPath: string, callback: (err: Error | null, animClip: AnimationClip) => any): void {
        noxcc.loadAnimationClip(resPath, callback);
    }

    export function playAnimClipAsync(target: Animation | Node, resPath: string, callback?: (animClip: AnimationClip, target: Animation) => any): void {
        let anim = target instanceof Animation ? target : noxcc.getAnimation(target);
        let clipVersion = addAnimClipVersion(anim);
        loadAnimClipAsync(resPath, function (err: Error | null, animClip: AnimationClip) {
            if (animClip) {
                if (cc_isValid(anim) && clipVersion == getAnimClipVersion(anim)) {
                    if (anim.clips.indexOf(animClip) < 0) {
                        anim.addClip(animClip, animClip.name);
                    }
                    anim.play(animClip.name);
                    callback && callback(animClip, anim);
                }
            }
            else {
                CC_DEBUG && cc_error(`AnimationClip ${resPath} not found`);
            }
        });
    }

    export function loadAssetsTable(assetsTable: AssetsTable, callback: (errors: Error[]) => any, progressCallback?: (completedCount: number, totalCount: number, item: Asset) => any) {
        let totalCount = 0;
        let doneCount = 0;

        let prefabs = assetsTable.prefabs as { [key: string]: Prefab };
        let spriteFrames = assetsTable.spriteFrames as { [key: string]: SpriteFrame };
        let audioClips = assetsTable.audioClips as { [key: string]: AudioClip };
        let errors: Error[] = [];

        if (prefabs) {
            totalCount += nox.tableSize(prefabs);
        }
        if (spriteFrames) {
            totalCount += nox.tableSize(spriteFrames);
        }
        if (audioClips) {
            totalCount += nox.tableSize(audioClips);
        }

        if (prefabs) {
            for (let url in prefabs) {
                if (prefabs[url] == null) {
                    noxcc.loadPrefab(url, (err: Error | null, prefab: Prefab) => {
                        ++doneCount;
                        if (err) {
                            errors.push(err);
                        }
                        if (prefab) {
                            prefabs[url] = prefab;
                        }
                        progressCallback && progressCallback(doneCount, totalCount, prefab);
                        if (doneCount == totalCount) {
                            callback && callback(errors);
                        }
                    });
                }
            }
        }

        if (spriteFrames) {
            for (let url in spriteFrames) {
                if (spriteFrames[url] == null) {
                    noxcc.loadSpriteFrame(url, (err: Error | null, spriteFrame: SpriteFrame) => {
                        ++doneCount;
                        if (err) {
                            errors.push(err);
                        }
                        if (spriteFrame) {
                            spriteFrames[url] = spriteFrame;
                        }
                        progressCallback && progressCallback(doneCount, totalCount, spriteFrame);
                        if (doneCount == totalCount) {
                            callback && callback(errors);
                        }
                    });
                }
            }
        }

        if (audioClips) {
            for (let url in audioClips) {
                if (audioClips[url] == null) {
                    noxcc.loadAudioClip(url, (err: Error | null, audioClip: AudioClip) => {
                        ++doneCount;
                        if (err) {
                            errors.push(err);
                        }
                        if (audioClip) {
                            audioClips[url] = audioClip;
                        }
                        progressCallback && progressCallback(doneCount, totalCount, audioClip);
                        if (doneCount == totalCount) {
                            callback && callback(errors);
                        }
                    });
                }
            }
        }

        if (totalCount == 0) {
            noxScheduler.scheduleOnce(() => {
                callback && callback(errors);
            }, 0);
        }
    }
}
