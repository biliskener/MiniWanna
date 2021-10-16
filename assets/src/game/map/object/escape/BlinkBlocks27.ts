import { Node, TiledMap, _decorator } from "cc";
import { cc_assert } from "../../../../framework/core/nox";
import { BaseObject } from "../BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class BlinkBlocks27 extends BaseObject {
    private params: { layers: [number, number], intervalTime: number };
    private tileMap: TiledMap;
    private intervalTime: number;

    private layers1: Node[] = [];
    private enabledLayers1: Node[] = [];
    private layers2: Node[] = [];
    private enabledLayers2: Node[] = [];

    start(): void {
        cc_assert((this.map.levelName == "level27"), "scripts are for this level only");
        this.tileMap = this.map.getTiledMap();
        cc_assert(this.tileMap, "fatal error");

        this.intervalTime = 0;
        this.layers1 = [];
        this.enabledLayers1 = [];
        this.layers2 = [];
        this.enabledLayers2 = [];
        let layerArr = this.params.layers;
        for (var i = layerArr[0]; i <= layerArr[1]; ++i) {
            let layer1 = this.tileMap.getLayer("Layer" + i);
            this.map.deferredActivateNode(layer1.node, false);
            this.layers1.push(layer1.node);
            let layer2 = this.tileMap.getLayer("Layer" + (i + 10));
            this.map.deferredActivateNode(layer2.node, false);
            this.layers2.push(layer2.node);
        }

        for (var index = 0; index < 2; ++index) {
            let layer1 = this.layers1.shift();
            this.map.deferredActivateNode(layer1, true);
            this.enabledLayers1.push(layer1);
            let layer2 = this.layers2.shift();
            this.map.deferredActivateNode(layer2, true);
            this.enabledLayers2.push(layer2);
        }
    }

    update(dt: number): void {
        if (this.enabledLayers1.length > 1 && this.enabledLayers2.length > 1) {
            this.intervalTime += dt;
            if (this.intervalTime >= this.params.intervalTime) {
                let enabledLayer1 = this.enabledLayers1.shift();
                enabledLayer1.active = false;
                this.layers1.push(enabledLayer1);
                let disabledLayer1 = this.layers1.shift();
                disabledLayer1.active = true;
                this.enabledLayers1.push(disabledLayer1);

                let enabledLayer2 = this.enabledLayers2.shift();
                enabledLayer2.active = false;
                this.layers2.push(enabledLayer2);
                let disabledLayer2 = this.layers2.shift();
                disabledLayer2.active = true;
                this.enabledLayers2.push(disabledLayer2)
                this.intervalTime = 0;
            }
        }
    }
}
