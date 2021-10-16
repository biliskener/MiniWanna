import { Asset, VideoClip } from "cc";
import { AllVideos } from "../../db/AllVideos";
import { CC_DEBUG } from "./nox";
import { noxcc } from "./noxcc";
import { noxScheduler } from "./noxScheduler";

export module noxVideo {
    let mAllVideoClips: { [key: string]: { asset: Asset, useCount: number } } = {};

    export function init(): void {
        noxScheduler.scheduleInterval(function () {
            clearUnusedVideoClips();
        }, CC_DEBUG ? 2 : 10);
    }

    export function hasVideoClip(name: string): boolean {
        return AllVideos[name] != null;
    }

    export function useVideo(asset: VideoClip): void {
        if (asset) {
            var item = mAllVideoClips[__getUrl(asset)] || { asset: asset, useCount: 0 };
            item.useCount++;
            mAllVideoClips[__getUrl(asset)] = item;
        }
    }

    export function unuseVideo(asset: Asset): void {
        if (asset) {
            var item = mAllVideoClips[__getUrl(asset)];
            item.useCount--;
        }
    }

    export function clearUnusedVideoClips(): void {
        if (!noxcc.isLoadingVideo()) {
            for (var url in mAllVideoClips) {
                var item = mAllVideoClips[url];
                if (item.useCount <= 0) {
                    delete mAllVideoClips[url];
                    noxcc.releaseAsset(item.asset);
                }
            }
        }
    }

    export function __getUrl(asset: Asset): string {
        //!! 原来为url, 现在改为nativeUrl, 未测试
        return asset.nativeUrl;
    }
}
