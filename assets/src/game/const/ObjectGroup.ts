import { Settings } from "cc";
import { cc_settings } from "../../framework/core/nox";


function getObjectGroupIndexByName(name: string): number {
    const collisionGroups = cc_settings.querySettings<Array<{ name: string, index: number }>>(Settings.Category.PHYSICS, 'collisionGroups');
    return collisionGroups!.find((v) => { return v.name == name })!.index;
}

export let ObjectGroup = {
    Default: 1 << 0,
    Player: -1,
    Block: -1,
    Bullet: -1,
    Spike: -1,
    Blood: -1,
    Save: -1,
    Trigger: -1,
    Platform: -1,
    Boss: -1,
    BossBullet1: -1,
    BossBullet2: -1,
    PlayerInvincible: -1,
    PlayerAll: [],
    BlockAll: [],
}

export function initObjectGroup() {
    for (var name in ObjectGroup) {
        if (name != "Default" && !name.match(/All$/)) {
            (ObjectGroup as any)[name] = 1 << getObjectGroupIndexByName(name);
        }
    }
    ObjectGroup.PlayerAll = [ObjectGroup.Player];
    ObjectGroup.BlockAll = [ObjectGroup.Block];
}
