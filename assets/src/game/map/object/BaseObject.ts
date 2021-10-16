import { GameMap } from "../GameMap";
import { Component, _decorator } from "cc";
import { cc_assert } from "../../../framework/core/nox";
import { NoxComponent } from "../../../framework/core/NoxComponent";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class BaseObject extends NoxComponent {
    private _map: GameMap = null;

    public get map() {
        var map = this._map;
        if (map) {
            return map;
        }

        map = this.node.parent.getComponent(GameMap);
        if (map) {
            this._map = map;
            return map;
        }

        map = this.node.parent.parent.getComponent(GameMap);
        if (map) {
            this._map = map;
            return map;
        }

        cc_assert(false);
        return null;
    }
}
