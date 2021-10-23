import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, _decorator } from "cc";
import { SceneManager } from "../../../../framework/base/SceneManager";
import { ObjectTag } from "../../../const/ObjectTag";
import { GameData } from "../../../data/GameData";
import { LevelScene } from "../../../ui/scene/LevelScene";
import { SelectScene } from "../../../ui/scene/SelectScene";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Select extends Component {
    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        if (contact) contact.disabled = true;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        this.scheduleOnce(() => {
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
                GameData.INSTANCE.newGame();
                GameData.INSTANCE.currSavedData.setLevelAndTile("level1", null);
                GameData.INSTANCE.currSavedData.mode = selfNode.name;
                GameData.INSTANCE.saveGame();
                SceneManager.replaceScene(LevelScene.create());
            }
        });
    }
}
