import { Collider2D, Component, IPhysics2DContact, _decorator } from "cc";
import { GameConfig } from "../../config/GameConfig";
import { ObjectGroup } from "../../const/ObjectGroup";
import { CollisionHit } from "../collision/CollisionHit";
import { CollisionObject } from "../collision/CollisionObject";
import { HitResponse } from "../collision/HitResponse";
import { BaseObject } from "./BaseObject";

const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@disallowMultiple
export class MapEdge extends BaseObject {
    public dirName: string;

    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        var otherCollider = other.node.getComponent(Collider2D);
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            return true;
        }
        else {
            return false;
        }
    }

    public collision(other: CollisionObject, hit: CollisionHit): HitResponse {
        var otherCollider = other.node.getComponent(Collider2D);
        if (ObjectGroup.PlayerAll.indexOf(otherCollider.group) >= 0) {
            return HitResponse.FORCE_MOVE;
        }
        else {
            return HitResponse.ABORT_MOVE;
        }
    }

    public collision_solid(hit: CollisionHit): void {
    }

    public collision_tile(tile_attributes: number): void {
    }
}
