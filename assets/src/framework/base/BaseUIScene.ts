import { ViewType } from "../view/NoxView";
import { BaseScene } from "./BaseScene";

export class BaseUIScene extends BaseScene {
    public onEnter(): void {
        super.onEnter();

        /*
        var resource = ResourceUI.getResourceUI();
        resource.setMode(Data.ResType.gold);
        noxcc.setZOrder(resource.node, ZOrder.ui);
        noxcc.addChild(this.getSceneNode(), resource.node);
         */
    }

    public onExit(): void {
        /*
        ResourceUI.removeResourceFromParent();
        */
        super.onExit();
    }
}
