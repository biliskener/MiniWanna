import { CollisionHit } from "./CollisionHit";
import { HitResponse } from "./HitResponse";
import { CollisionGroup } from "./CollisionGroup";
import { GameMap } from "../GameMap";
import { Collider2D, Component, PhysicsSystem2D, Rect, Vec2 } from "cc";
import { cc_assert, cc_isValid, cc_rect, cc_v2 } from "../../../framework/core/nox";
import { GameConfig } from "../../config/GameConfig";
import { noxcc } from "../../../framework/core/noxcc";
import { ObjectGroup } from "../../const/ObjectGroup";

export class CollisionObject extends Component {
    private m_old_bbox: Rect = cc_rect();

    /** The bounding box of the object (as used for collision detection,
     this isn't necessarily the bounding box for graphics) */
    private m_bbox: Rect = cc_rect();

    /** The movement that will happen till next frame */
    private m_movement: Vec2 = cc_v2();

    /** The collision group */
    private m_group: CollisionGroup = CollisionGroup.COLGROUP_DISABLED;

    /** this is only here for internal collision detection use (don't touch this
     from outside collision detection code)

     This field holds the currently anticipated destination of the object
     during collision detection */
    private m_dest: Rect = cc_rect();

    /*
    public constructor(group: CollisionGroup, parent: CollisionListener) {
        this.m_group = group;
        this.m_listener = parent;
    }
    */

    private m_map: GameMap;

    public setMap(map: GameMap) {
        this.m_map = map;
        if (this.enabledInHierarchy) {
            this.m_map.collisionSystem.add(this);
        }
    }

    public getMap() {
        return this.m_map;
    }

    public load_bbox(): void {
        var colliders = this.getComponents(Collider2D);
        cc_assert(colliders.length == 1);
        for (var i = 0; i < colliders.length; ++i) {
            var collider = colliders[i];
            var bbox = collider.worldAABB;
            if (bbox.width == 0 || bbox.height == 0) {
                if (PhysicsSystem2D.PHYSICS_BUILTIN) {
                    collider.impl.update(0);
                    bbox = collider.worldAABB;
                }
            }
            var pt1 = cc_v2(bbox.xMin, bbox.yMin);
            var pt2 = cc_v2(bbox.xMax, bbox.yMax);
            pt1 = noxcc.worldToLocal(this.m_map.node, pt1);
            pt2 = noxcc.worldToLocal(this.m_map.node, pt2);
            var left = Math.min(pt1.x, pt2.x);
            var bottom = Math.min(pt1.y, pt2.y);
            var right = Math.max(pt1.x, pt2.x);
            var top = Math.max(pt1.y, pt2.y);
            this.m_bbox.set(cc_rect(left, bottom, right - left, top - bottom));
            this.m_old_bbox.set(this.m_bbox);
            return;
        }
        cc_assert(false, "fatal error");
    }

    public save_bbox(): void {
        var offsetX = this.m_bbox.x - this.m_old_bbox.x;
        var offsetY = this.m_bbox.y - this.m_old_bbox.y;
        this.node.setPosition(this.node.position.x + offsetX, this.node.position.y + offsetY);
    }

    public get_bbox(): Rect {
        return this.m_bbox;
    }

    public set_bbox(bbox: Rect): void {
        this.m_bbox.set(bbox);
    }

    public move_bbox(offset: Vec2): void {
        this.m_bbox.x += offset.x;
        this.m_bbox.y += offset.y;
    }

    public get_movement(): Vec2 {
        return this.m_movement;
    }

    public set_movement(mov: Vec2): void {
        this.m_movement.set(mov);
    }

    public get_dest(): Rect {
        return this.m_dest;
    }

    public set_dest(value: Rect): void {
        this.m_dest.set(value);
    }

    /** places the moving object at a specific position. Be careful when
     using this function. There are no collision detection checks
     performed here so bad things could happen. */
    /*
    public set_pos(pos: Vec2): void {
        this.m_dest.x += pos.x - this.get_pos().x;
        this.m_dest.y += pos.y - this.get_pos().y;
        this.m_bbox.x = pos.x;
        this.m_bbox.y = pos.y;
    }
     */

    /*
    public get_pos(): Vec2 {
        return cc_v2(this.m_bbox.x, this.m_bbox.y);
    }
     */

    /** moves entire object to a specific position, including all
     points those the object has, exactly like the object has
     spawned in that given pos instead.*/
    /*
    public move_to(pos: Vec2): void {
        this.set_pos(pos);
    }
     */

    /** sets the moving object's bbox to a specific width. Be careful
     when using this function. There are no collision detection
     checks performed here so bad things could happen. */
    /*
    public set_width(w: number): void {
        this.m_dest.width = w;
        this.m_bbox.width = w;
    }
     */

    /** sets the moving object's bbox to a specific size. Be careful
     when using this function. There are no collision detection
     checks performed here so bad things could happen. */
    /*
    public set_size(w: number, h: number) {
        this.m_dest.width = w;
        this.m_dest.height = h;
        this.m_bbox.width = w;
        this.m_bbox.height = h;
    }
     */

    public get_group(): CollisionGroup {
        //return this.m_group;

        var collider = this.node.getComponent(Collider2D);
        if (collider) {
            switch (collider.group) {
                case ObjectGroup.Block:
                    return CollisionGroup.COLGROUP_STATIC;
                    break;
                case ObjectGroup.Player:
                    return CollisionGroup.COLGROUP_MOVING;
                    break;
                case ObjectGroup.PlayerInvincible:
                    return CollisionGroup.COLGROUP_MOVING;
                    break;
                case ObjectGroup.Platform:
                    if (GameConfig.useIwbtLevels) {
                        return CollisionGroup.COLGROUP_MOVING_STATIC;
                    }
                    else {
                        return CollisionGroup.COLGROUP_STATIC;
                    }
                    break;
                default:
                    cc_assert(false, "fatal error");
                    return CollisionGroup.COLGROUP_DISABLED;
                    break;
            }
        }
        else {
            cc_assert(false, "fatal error");
            return CollisionGroup.COLGROUP_DISABLED;
        }
    }

    public is_valid(): boolean {
        return cc_isValid(this) && this.enabledInHierarchy;
    }

    protected onEnable(): void {
        if (this.m_map) {
            this.m_map.collisionSystem.add(this);
        }
    }

    protected onDisable(): void {
        if (this.m_map) {
            this.m_map.collisionSystem.remove(this);
        }
    }

    private convert_hit_by_angle(hit: CollisionHit): CollisionHit {
        var angle = this.node.angle;
        if (angle == 0) {
            return hit;
        }
        else if (angle == 180) {
            var newHit = new CollisionHit();
            newHit.left = hit.right;
            newHit.right = hit.left;
            newHit.bottom = hit.top;
            newHit.top = hit.bottom;
            newHit.crush = hit.crush;
            newHit.slope_normal.set(hit.slope_normal.clone().negative());
            return newHit;
        }
        else {
            cc_assert(false, "fatal error");
        }
    }

    /** this function is called when the object collided with something solid */
    public collision_solid(hit: CollisionHit): void {
        for (var component of this.node.getComponents(Component)) {
            if (component != this && component["collision_solid"]) {
                return component["collision_solid"](hit);
            }
        }
        cc_assert(false);
    }

    /** when 2 objects collided, we will first call the
     pre_collision_check functions of both objects that can decide on
     how to react to the collision. */
    public collides(other: CollisionObject, hit: CollisionHit): boolean {
        for (var component of this.node.getComponents(Component)) {
            if (component != this && component["collides"]) {
                return component["collides"](other, hit);
            }
        }

        var selfGroup = this.getComponent(Collider2D).group;
        var otherGroup = other.getComponent(Collider2D).group;
        var groupsTable: [number, number][] = [
            [ObjectGroup.Player, ObjectGroup.Block],
            [ObjectGroup.Player, ObjectGroup.Platform],
        ];
        for (var [group1, group2] of groupsTable) {
            if (selfGroup == group1 && otherGroup == group2 || selfGroup == group2 && otherGroup == group1) {
                return true;
            }
        }
        return false;
    }

    /** this function is called when the object collided with any other object */
    public collision(other: CollisionObject, hit: CollisionHit): HitResponse {
        for (var component of this.node.getComponents(Component)) {
            if (component != this && component["collision"]) {
                return component["collision"](other, hit);
            }
        }
        return HitResponse.CONTINUE;
    }

    /** called when tiles with special attributes have been touched */
    public collision_tile(tile_attributes: number): void {
        for (var component of this.node.getComponents(Component)) {
            if (component != this && component["collision_tile"]) {
                return component["collision_tile"](tile_attributes);
            }
        }
    }
}
