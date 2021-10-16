
import { _decorator, Component, Node, Asset } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NoxComponent')
export class NoxComponent extends Component {
    public getUsingAssets(): Asset[] {
        //如果父类有资源引用,重载记得调用父类的函数
        return [];
    }

    protected onLoad(): void {
    }

    protected onEnable(): void {
    }

    protected onDisable(): void {
    }

    protected onDestroy(): void {
    }

    public _onPreDestroy(): void {
        super._onPreDestroy();
        this.onCleanup();
    }

    protected onCleanup(): void {
    }

    public static POOL_ENABLED = true;
}
