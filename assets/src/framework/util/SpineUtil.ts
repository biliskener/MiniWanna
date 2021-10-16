import { Node, sp } from "cc";
import { noxcc } from "../core/noxcc";
import { NoxResMgr } from "../mgr/NoxResMgr";

export module SpineUtil {
    export function createSpineAnim(resPath: string, skinName: string, animName: string, loop: boolean): sp.Skeleton {
        var node = noxcc.newNode();
        var spine = noxcc.getOrAddComponent(node, sp.Skeleton);
        NoxResMgr.setSkeletonAnimAsync(spine, resPath, skinName, animName, loop);
        return spine;
    }

    export function setSpineAnim(target: Node | sp.Skeleton, resPath: string, skinName: string, animName: string, loop: boolean): void {
        NoxResMgr.setSkeletonAnimAsync(target, resPath, skinName, animName, loop);
    }
}
