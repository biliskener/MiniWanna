import { Collider2D, Component, IPhysics2DContact, _decorator } from "cc";
import { ObjectGroup } from "../../../const/ObjectGroup";
import { ObjectTag } from "../../../const/ObjectTag";
import { Save } from "./Save";

const { ccclass, property } = _decorator;

@ccclass
export class Bullet extends Component {

    public static count: number = 0;

    public speedX: number = 0;

    onLoad(): void {
        // 子弹速度为 800 像素/秒，在编辑器的刚体组件里设置了。
        // 子弹计数
        Bullet.count++;
        // 子弹0.8秒后删除
        this.scheduleOnce(function () {
            Bullet.count--;
            this.node.destroy();
        }, 0.8);
    }

    public onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        contact.disabled = true;
        if (otherCollider.group == ObjectGroup.Block) {
            // 子弹与方块碰撞后删除
            this.node.destroy();
        }
        else if (otherCollider.group == ObjectGroup.Save) {
            // 子弹与存档碰撞后进行存档
            otherCollider.node.getComponent(Save).save();
        }
    }
}