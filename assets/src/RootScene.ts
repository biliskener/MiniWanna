import { _decorator } from 'cc';
import { NoxComponent } from './framework/core/NoxComponent';
import { MyApp } from './game/MyApp';
import { main } from './main';
const { ccclass, property } = _decorator;

@_decorator.ccclass
export class RootScene extends NoxComponent {
    onLoad() {
        main(this.node);
    }

    update(dt: number) {
        if (MyApp.INSTANCE) {
            MyApp.INSTANCE.update(dt);
        }
    }
}
