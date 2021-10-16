import { Collider2D, Component, IPhysics2DContact, Node, _decorator } from "cc";
import { SceneManager } from "../../../../framework/base/SceneManager";
import { ObjectTag } from "../../../const/ObjectTag";
import { SceneId } from "../../../const/SceneId";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class Transfer extends Component {
    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact): void {
        if (otherCollider.tag != ObjectTag.Default) return;
        contact.disabled = true;
        this.onContact(otherCollider.node, selfCollider.node);
    }

    private onContact(otherNode: Node, selfNode: Node): void {
        if (SceneManager.getRunningSceneId() == SceneId.level) {
            //LevelScene.currenton().loadLevel(selfNode.name);
        }
    }
}
