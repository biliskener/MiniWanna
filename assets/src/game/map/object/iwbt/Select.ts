import { Collider2D, Component, IPhysics2DContact, Node, _decorator } from "cc";
import { SceneManager } from "../../../../framework/base/SceneManager";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { LevelScene } from "../../../ui/scene/LevelScene";
import { SelectScene } from "../../../ui/scene/SelectScene";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Select extends Component {
    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        contact.disabled = true;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        var name = selfNode.name;
        if (name == "LoadGame") {
            // 读取游戏
            GameData.INSTANCE.loadGame();
            if (GameData.INSTANCE.currSavedData.levelName == "") {
                SceneManager.replaceScene(SelectScene.create());
            }
            else {
                SceneManager.replaceScene(LevelScene.create());
            }
        }
        else {
            // 新游戏
            GameData.INSTANCE.currSavedData.setLevelAndGate("level1", "");
            GameData.INSTANCE.currSavedData.mode = selfNode.name;
            SceneManager.replaceScene(LevelScene.create());
        }
    }
}
