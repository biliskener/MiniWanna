import { Tween } from "cc";
import { GuideConfig } from "../config/GuideConfig";
import { cc_tween } from "../core/nox";
import { noxEvent1 } from "../core/noxEvent";
import { NoxWidget } from "../view/NoxWidget";

const GUIDE_ACTION_TAG = 10234;

export class BasePage extends NoxWidget {
    public static Event = {
        CheckGuide: new noxEvent1<BasePage>(),
    };

    public constructor(resPath: string) {
        super(resPath);
    }

    public onEnter(): void {
        super.onEnter();

        this.delayCheckGuide();
    }

    public onExit(): void {
        Tween.stopAllByTag(GUIDE_ACTION_TAG, this.getRoot());
        super.onExit();
    }

    public delayCheckGuide(): void {
        if (GuideConfig.isEnableGuide()) {
            Tween.stopAllByTag(GUIDE_ACTION_TAG, this.getRoot());
            var action = cc_tween(this.getRoot()).delay(0).call(() => {
                BasePage.Event.CheckGuide.dispatchEvent(this);
                this.checkGuide();
            });
            action.tag(GUIDE_ACTION_TAG);
            action.start();
        }
    }

    public checkGuide(): void {
    }
}
