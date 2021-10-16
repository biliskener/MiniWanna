import { CollisionHit } from "../collision/CollisionHit";
import { HitResponse } from "../collision/HitResponse";
import { CollisionObject } from "../collision/CollisionObject";
import { NoxComponent } from "../../../framework/core/NoxComponent";

export class TileObject extends NoxComponent {
    public collision_solid(hit: CollisionHit): void {
    }

    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        return true;
    }

    public collision(other: CollisionObject, hit: CollisionHit): HitResponse {
        return HitResponse.FORCE_MOVE;
    }

    public collision_tile(tile_attributes: number): void {
    }
}
