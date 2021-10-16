import { cc_color } from "../core/nox";
import { noxEvent0 } from "../core/noxEvent";
import { BaseComponent } from "../base/BaseComponent";
import { SpriteUtil } from "../util/SpriteUtil";

export class BlurredLayer extends BaseComponent {
    public static director_after_blur: noxEvent0 = new noxEvent0();

    protected onEnable(): void {
        super.onEnable();
        this.scheduleOnce(function () {
            BlurredLayer.director_after_blur.dispatchEvent();
        }, 0.01);
    }

    protected onDisable(): void {
        super.onDisable();
    }

    public static create(alpha: number): BlurredLayer {
        var node = SpriteUtil.createLayerColor(cc_color(0, 0, 0, alpha), 8192, 8192);
        node.name = "BlurredLayer";
        var layer = node.addComponent(BlurredLayer);
        return layer;
    }
}
