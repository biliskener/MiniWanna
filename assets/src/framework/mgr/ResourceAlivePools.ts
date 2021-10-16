import { Asset } from "cc";
import { nox } from "../core/nox";

export module ResourceAlivePools {
    let aliveAssetPools: { [key: string]: { [key: string]: Asset } } = {
    };

    export function init() {
    }

    export function getAliveAsset(poolName: string, assetKey: string): Asset | null {
        var pool = aliveAssetPools[poolName];
        if (pool) {
            return pool[assetKey];
        }
        return null;
    }

    export function setAliveAsset(poolName: string, assetKey: string, asset: Asset): void {
        var pool = aliveAssetPools[poolName];
        if (!pool) {
            pool = {};
            aliveAssetPools[poolName] = pool;
        }
        //cc.assert(pool[assetKey] == null, "asset " + assetKey + " already exists in pool " + poolName);
        pool[assetKey] = asset;
    }

    export function getAllAliveAssets(): Asset[] {
        var assets: Asset[] = [];
        var pools = nox.values(aliveAssetPools);
        for (var i = 0; i < pools.length; ++i) {
            assets = assets.concat(nox.values(pools[i]));
        }
        return assets;
    }
}
