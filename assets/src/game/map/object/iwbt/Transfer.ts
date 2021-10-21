import { Collider2D, Component, Contact2DType, IPhysics2DContact, Node, _decorator } from "cc";
import { SceneManager } from "../../../../framework/base/SceneManager";
import { ObjectTag } from "../../../const/ObjectTag";
import { SceneId } from "../../../const/SceneId";
import { GameData } from "../../../data/GameData";
import { LevelScene } from "../../../ui/scene/LevelScene";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Transfer extends Component {
    start(): void {
        this.getComponent(Collider2D).on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        if (contact) contact.disabled = true;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        if (SceneManager.getRunningSceneId() == SceneId.level) {
            LevelScene.currenton().loadLevel(selfNode.name, null);
            GameData.INSTANCE.currSavedData.setLevelAndTile(selfNode.name, null);
            GameData.INSTANCE.saveGame();
        }
    }
}
