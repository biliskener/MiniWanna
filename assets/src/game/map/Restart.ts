import { Component, EventKeyboard, Input, KeyCode } from "cc";
import { SceneManager } from "../../framework/base/SceneManager";
import { cc_input } from "../../framework/core/nox";
import { SplashScene } from "../ui/scene/SplashScene";

export class Restart extends Component {
    onLoad(): void {
        // 监听键盘按下事件 
        cc_input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    // 键盘按下
    onKeyDown(event: EventKeyboard): void {
        switch (event.keyCode) {
            case KeyCode.F2:
                SceneManager.popScene(true);
                SceneManager.pushScene(SplashScene.create());
                break;
        }
    }
}

