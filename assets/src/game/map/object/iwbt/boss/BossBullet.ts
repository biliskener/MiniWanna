import { Component, _decorator } from "cc";
import { cc_view } from "../../../../../framework/core/nox";

const { ccclass, property, executeInEditMode, disallowMultiple, requireComponent, executionOrder } = _decorator;

@ccclass
@disallowMultiple
export class BossBullet extends Component {
    public speedX: number = 0;

    update(dt: number): void {
        var x = this.node.position.x;
        var y = this.node.position.y;
        // BOSS 弹幕超出屏幕 150 像素后删除
        if (x < -150 || x > cc_view.getVisibleSize().width + 150 || y < -150 || y > cc_view.getVisibleSize().height + 150) {
            this.node.destroy();
        }
    }
}
