import { _decorator, Node } from 'cc';
import { noxcc } from './framework/core/noxcc';
import { noxSound } from './framework/core/noxSound';
import { noxVideo } from './framework/core/noxVideo';
import { MarqueeManager } from './framework/mgr/MarqueeManager';
import { ActiveIndicator } from './framework/mgr/ActiveIndicator';
import { NoxViewMgr } from './framework/view/NoxViewMgr';
import { ResourceAlivePools } from './framework/mgr/ResourceAlivePools';
import { ResourceCleaner } from './framework/mgr/ResourceCleaner';
import { StaticPrefabMgr } from './framework/mgr/StaticPrefabMgr';
import { AllViewTypes } from './db/AllViewTypes';
import { ToastManager } from './framework/mgr/ToastManager';
import { NoticeManager } from './framework/mgr/NoticeManager';
import { MyApp } from './game/MyApp';
import { initObjectGroup } from './game/const/ObjectGroup';
import { MapUtil } from './game/map/MapUtil';

export function main(uiRootNode: Node) {
    //cc_game.setFrameRate(25);
    noxcc.init(uiRootNode);
    ResourceAlivePools.init();
    ResourceCleaner.init();

    noxSound.init(uiRootNode);
    noxVideo.init();

    initObjectGroup();
    MapUtil.initColliderEngine();

    NoxViewMgr.init(uiRootNode, AllViewTypes);

    ActiveIndicator.init();
    ActiveIndicator.showLoading();

    noxcc.loadAllInfos(function () {
        noxcc.initAllInfos();
        StaticPrefabMgr.init(function () {
            ActiveIndicator.hideLoading();
            ToastManager.init();
            MarqueeManager.init();
            NoticeManager.init();
            MyApp.createInstance();
        });
    });
}
