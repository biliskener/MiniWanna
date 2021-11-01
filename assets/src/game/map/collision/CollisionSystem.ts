import { CollisionObject } from "./CollisionObject";
import { Collision } from "./Collision";
import { CollisionHit } from "./CollisionHit";
import { HitResponse } from "./HitResponse";
import { CollisionGroup } from "./CollisionGroup";
import { AATriangle } from "./AATriangle";
import { AnchorPoint } from "./AnchorPoint";
import { GameConfig } from "../../config/GameConfig";
import { GameMap } from "../GameMap";
import { TileAttribute } from "./TileAttribute";
import { Player } from "../object/Player";
import { Collider2D, ISchedulable, Rect, TiledLayer, TiledMap, TiledTile, Vec2 } from "cc";
import { cc_assert, CC_DEV, cc_director, CC_EDITOR, cc_rect, cc_v2, nox } from "../../../framework/core/nox";
import { noxcc } from "../../../framework/core/noxcc";
import { ObjectGroup } from "../../const/ObjectGroup";

const Constraints = Collision.Constraints;

function get_bbox_anchor_pos(rect: Readonly<Rect>, point: AnchorPoint): Vec2 {
    var result = cc_v2();

    switch (point & AnchorPoint.ANCHOR_V_MASK) {
        case AnchorPoint.ANCHOR_LEFT:
            result.x = rect.xMin;
            break;
        case AnchorPoint.ANCHOR_MIDDLE:
            result.x = rect.xMin + rect.width / 2.0;
            break;
        case AnchorPoint.ANCHOR_RIGHT:
            result.x = rect.xMax;
            break;
        default:
            cc_assert(false, "Invalid anchor point found");
            result.x = rect.xMin;
            break;
    }

    switch (point & AnchorPoint.ANCHOR_H_MASK) {
        case AnchorPoint.ANCHOR_TOP:
            result.y = rect.yMax;
            break;
        case AnchorPoint.ANCHOR_MIDDLE:
            result.y = rect.yMin + rect.height / 2.0;
            break;
        case AnchorPoint.ANCHOR_BOTTOM:
            result.y = rect.yMin;
            break;
        default:
            cc_assert(false, "Invalid anchor point found");
            result.y = rect.yMin;
            break;
    }

    return result;
}

function get_bbox_distance(self: Rect, other: Vec2, ap: AnchorPoint = AnchorPoint.ANCHOR_MIDDLE): number {
    var v = get_bbox_anchor_pos(self, ap);
    return v.clone().subtract(other).length();
}

enum TileFlip {
    NO_FLIP = 0,
    VERTICAL_FLIP = (1 << 1),
    HORIZONTAL_FLIP = (1 << 2),
}

export class CollisionSystem /*implements ISchedulable*/ {
    id?: string;
    uuid?: string;

    private m_objects: CollisionObject[] = [];
    private m_adding: CollisionObject[] = [];
    private m_removing: CollisionObject[] = [];
    private m_updating: boolean = false;
    private m_pauseCount: number = 0;
    private m_angle: number = 0;

    private m_map: GameMap;

    constructor(map: GameMap) {
        this.id = this.uuid = 'CollisionSystem';
        this.m_map = map;
    }

    public add(object: CollisionObject): void {
        if (this.m_updating) {
            nox.removeUniqueItem(this.m_removing, object);
            nox.addUniqueItem(this.m_adding, object);
        }
        else {
            if (this.m_objects.indexOf(object) >= 0) {
                cc_assert(false);
            }
            this.m_objects.push(object);
        }
    }

    public remove(object: CollisionObject): void {
        if (this.m_updating) {
            nox.removeUniqueItem(this.m_adding, object);
            nox.addUniqueItem(this.m_removing, object);
        }
        else {
            var index = this.m_objects.indexOf(object);
            if (index >= 0) {
                this.m_objects.splice(index, 1);
            }
        }
    }

    public init(): void {
        //let _targetNode: Node = new Node();
        //game.addPersistRootNode(_targetNode);
        cc_director.getScheduler().scheduleUpdate(this, 0, false);
        this.m_pauseCount = 0;
    }

    public pause(): void {
        ++this.m_pauseCount;
    }

    public resume(): void {
        --this.m_pauseCount;
    }

    public setAngle(angle: number): void {
        angle = (angle + 360) % 360;
        cc_assert(angle >= 0 && angle < 360 && angle % 90 == 0, "fatal error");
        this.m_angle = angle;
    }

    public update(dt: number): void {
        if (CC_EDITOR) {
            return;
            //Oběcts in editor shouldn't collide.
        }

        if (this.m_pauseCount > 0) return;

        this.m_updating = true;

        for (const object of this.m_objects) {
            object.load_bbox();
        }

        // calculate destination positions of the objects
        for (const object of this.m_objects) {
            const mov = object.get_movement();

            // make sure movement is never faster than MAX_SPEED. Norm is pretty fat, so two addl. checks are done before.
            if (((mov.x > Collision.MAX_SPEED * Math.SQRT1_2) || (mov.y > Collision.MAX_SPEED * Math.SQRT1_2)) &&
                (mov.length() > Collision.MAX_SPEED)) {
                object.set_movement(mov.normalize().clone().multiplyScalar(Collision.MAX_SPEED));
                //log_debug << "Temporarily reduced object's speed of " << mov.norm() << " to " << object->movement.norm() << "." << std::endl;
            }

            const dest = object.get_bbox().clone();
            dest.x += object.get_movement().x;
            dest.y += object.get_movement().y;
            object.set_dest(dest);
        }

        // part1: COLGROUP_MOVING vs COLGROUP_STATIC and tilemap
        for (const object of this.m_objects) {
            if ((object.get_group() != CollisionGroup.COLGROUP_MOVING
                && object.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC
                && object.get_group() != CollisionGroup.COLGROUP_MOVING_ONLY_STATIC)
                || !object.is_valid())
                continue;

            if (GameConfig.useSimpleCollision) {
                this.collision_static_constrains_simple(object);
            }
            else {
                this.collision_static_constrains(object);
            }
        }

        // part2: COLGROUP_MOVING vs tile attributes
        for (const object of this.m_objects) {
            if ((object.get_group() != CollisionGroup.COLGROUP_MOVING &&
                object.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC &&
                object.get_group() != CollisionGroup.COLGROUP_MOVING_ONLY_STATIC) ||
                !object.is_valid()) {
                continue;
            }

            var tile_attributes = this.collision_tile_attributes(object.get_dest(), object.get_movement());
            if (tile_attributes >= TileAttribute.FIRST_INTERESTING_FLAG) {
                object.collision_tile(tile_attributes);
            }
        }

        // part2.5: COLGROUP_MOVING vs COLGROUP_TOUCHABLE
        for (const object of this.m_objects) {
            if ((object.get_group() != CollisionGroup.COLGROUP_MOVING &&
                object.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC) ||
                !object.is_valid()) {
                continue;
            }

            for (const object_2 of this.m_objects) {
                if (object_2.get_group() != CollisionGroup.COLGROUP_TOUCHABLE
                    || !object_2.is_valid()) {
                    continue;
                }

                if (Collision.intersects(object.get_dest(), object_2.get_dest())) {
                    var normal = cc_v2(0, 0);
                    var hit = new CollisionHit();
                    this.get_hit_normal(object.get_dest(), object_2.get_dest(),
                        hit, normal);
                    if (!object.collides(object_2, hit)) {
                        continue;
                    }
                    if (!object_2.collides(object, hit)) {
                        continue;
                    }

                    object.collision(object_2, hit);
                    object_2.collision(object, hit);
                }
            }
        }

        // part3: COLGROUP_MOVING vs COLGROUP_MOVING
        for (var i = 0; i < this.m_objects.length; ++i) {
            var object = this.m_objects[i];

            if ((object.get_group() != CollisionGroup.COLGROUP_MOVING &&
                object.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC) ||
                !object.is_valid()) {
                continue;
            }

            for (var i2 = i + 1; i2 < this.m_objects.length; ++i2) {
                var object_2 = this.m_objects[i2];
                if ((object_2.get_group() != CollisionGroup.COLGROUP_MOVING &&
                    object_2.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC) ||
                    !object_2.is_valid()) {
                    continue;
                }

                this.collision_object(object, object_2);
            }
        }

        // apply object movement
        for (const object of this.m_objects) {
            object.set_bbox(object.get_dest());
            object.set_movement(cc_v2(0, 0));
            object.save_bbox();
        }

        this.m_updating = false;

        this.m_objects = this.m_objects.concat(this.m_adding);
        this.m_adding = [];

        for (var i = 0; i < this.m_removing.length; ++i) {
            nox.removeUniqueItem(this.m_objects, this.m_removing[i]);
        }
        this.m_removing = [];
    }

    public is_free_of_tiles(rect: Rect, ignoreUnisolid?: boolean): boolean {
        for (var solids of this.get_solid_tilemaps()) {
            // test with all tiles in this rectangle
            const test_tiles = this.get_tiles_overlapping(solids, rect);

            for (var x = test_tiles.xMin; x <= test_tiles.xMax; ++x) {
                for (var y = test_tiles.yMin; y <= test_tiles.yMax; ++y) {
                    const tile = this.get_tile(solids, x, y);

                    if (!(this.get_tile_attributes(tile) & TileAttribute.SOLID)) {
                        continue;
                    }
                    if (this.is_tile_unisolid(tile) && ignoreUnisolid) {
                        continue;
                    }
                    if (this.is_tile_slope(tile)) {
                        const tbbox = this.get_tile_bbox(tile);
                        var triangle = new AATriangle(tbbox, this.get_tile_data(tile));
                        var constraints = new Constraints();
                        if (!Collision.rectangle_aatriangle(constraints, rect, triangle)) {
                            continue;
                        }
                    }
                    // We have a solid tile that overlaps the given rectangle.
                    return false;
                }
            }
        }

        return true;
    }

    public is_free_of_statics(rect: Rect, ignore_object: CollisionObject, ignoreUnisolid: boolean): boolean {
        if (!this.is_free_of_tiles(rect, ignoreUnisolid)) {
            return false;
        }

        for (var object of this.m_objects) {
            if (object == ignore_object) {
                continue;
            }
            if (!object.is_valid()) {
                continue;
            }
            if (object.get_group() == CollisionGroup.COLGROUP_STATIC) {
                if (Collision.intersects(rect, object.get_bbox())) {
                    return false;
                }
            }
        }

        return true;
    }

    public is_free_of_movingstatics(rect: Rect, ignore_object: CollisionObject): boolean {
        if (!this.is_free_of_tiles(rect)) {
            return false;
        }

        for (var object of this.m_objects) {
            if (object == ignore_object) {
                continue;
            }
            if (!object.is_valid()) {
                continue;
            }
            if ((object.get_group() == CollisionGroup.COLGROUP_MOVING)
                || (object.get_group() == CollisionGroup.COLGROUP_MOVING_STATIC)
                || (object.get_group() == CollisionGroup.COLGROUP_STATIC)) {
                if (Collision.intersects(rect, object.get_bbox())) {
                    return false;
                }
            }
        }

        return true;
    }

    public free_line_of_sight(line_start: Vec2, line_end: Vec2, ignore_object: CollisionObject): boolean {
        // check if no tile is in the way
        const lsx = Math.min(line_start.x, line_end.x);
        const lex = Math.max(line_start.x, line_end.x);
        const lsy = Math.min(line_start.y, line_end.y);
        const ley = Math.max(line_start.y, line_end.y);

        for (var test_x = lsx; test_x <= lex; test_x += 16) { // NOLINT
            for (var test_y = lsy; test_y <= ley; test_y += 16) { // NOLINT
                for (var solids of this.get_solid_tilemaps()) {
                    const tile = this.get_tile_at(solids, test_x, test_y);
                    // FIXME: check collision with slope tiles
                    if ((this.get_tile_attributes(tile) & TileAttribute.SOLID)) {
                        return false;
                    }
                }
            }
        }

        // check if no object is in the way
        for (const object of this.m_objects) {
            if (object == ignore_object) {
                continue;
            }
            if (!object.is_valid()) {
                continue;
            }
            if ((object.get_group() == CollisionGroup.COLGROUP_MOVING) ||
                (object.get_group() == CollisionGroup.COLGROUP_MOVING_STATIC) ||
                (object.get_group() == CollisionGroup.COLGROUP_STATIC)) {
                if (Collision.intersects_line(object.get_bbox(), line_start, line_end)) {
                    return false;
                }
            }
        }

        return true;
    }

    public get_nearby_objects(center: Vec2, max_distance: number): CollisionObject[] {
        var ret: CollisionObject[] = [];
        for (const object of this.m_objects) {
            var distance = get_bbox_distance(object.get_bbox(), center);
            if (distance <= max_distance) {
                ret.push(object);
            }
        }
        return ret;
    }

    /** r1 is supposed to be moving, r2 a solid object */
    private check_collisions(constraints: Collision.Constraints,
        obj_movement: Readonly<Vec2>,
        obj_rect: Readonly<Rect>,
        other_rect: Readonly<Rect>,
        object?: CollisionObject,
        other?: CollisionObject,
        other_movement?: Readonly<Vec2>) {
        other_movement = other_movement || cc_v2(0, 0);

        if (!Collision.intersects(obj_rect, other_rect))
            return;

        var dummy = new CollisionHit();

        if (other != null && object != null && !other.collides(object, dummy))
            return;
        if (object != null && other != null && !object.collides(other, dummy))
            return;

        // calculate intersection
        const ileft = obj_rect.xMax - other_rect.xMin;
        const iright = other_rect.xMax - obj_rect.xMin;
        const ibottom = obj_rect.yMax - other_rect.yMin;
        const itop = other_rect.yMax - obj_rect.yMin;

        if (Math.abs(obj_movement.y) > Math.abs(obj_movement.x)) {
            if (ileft < Collision.SHIFT_DELTA) {
                constraints.constrain_right(other_rect.xMin, other_movement.x);
                return;
            }
            else if (iright < Collision.SHIFT_DELTA) {
                constraints.constrain_left(other_rect.xMax, other_movement.x);
                return;
            }
        }
        else {
            // shiftout bottom/top
            if (ibottom < Collision.SHIFT_DELTA) {
                constraints.constrain_top(other_rect.yMin, other_movement.y);
                return;
            }
            else if (itop < Collision.SHIFT_DELTA) {
                constraints.constrain_bottom(other_rect.yMax, other_movement.y);
                return;
            }
        }

        constraints.ground_movement.add(other_movement);
        if (other != null && object != null) {
            const response: HitResponse = other.collision(object, dummy);
            if (response == HitResponse.ABORT_MOVE)
                return;

            if (!other.get_movement().equals(cc_v2(0, 0))) {
                // TODO what todo when we collide with 2 moving objects?!?
                constraints.ground_movement.add(other.get_movement());
            }
        }

        const vert_penetration = Math.min(itop, ibottom);
        const horiz_penetration = Math.min(ileft, iright);

        if (vert_penetration < horiz_penetration) {
            if (ibottom < itop) {
                constraints.constrain_top(other_rect.yMin, other_movement.y);
                constraints.hit.top = true;
            }
            else {
                constraints.constrain_bottom(other_rect.yMax, other_movement.y);
                constraints.hit.bottom = true;
            }
        }
        else {
            if (ileft < iright) {
                constraints.constrain_right(other_rect.xMin, other_movement.x);
                constraints.hit.right = true;
            }
            else {
                constraints.constrain_left(other_rect.xMax, other_movement.x);
                constraints.hit.left = true;
            }
        }
    }

    public collision_static(constraints: Collision.Constraints,
        movement: Readonly<Vec2>,
        dest: Readonly<Rect>,
        object: CollisionObject): void {
        this.collision_tilemap(constraints, movement, dest, object);

        // collision with other (static) objects
        for (var static_object of this.m_objects) {
            if (static_object.get_group() != CollisionGroup.COLGROUP_STATIC &&
                static_object.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC)
                continue;
            if (!static_object.is_valid())
                continue;

            if (static_object != object) {
                this.check_collisions(constraints, movement, dest, static_object.get_bbox(),
                    object, static_object);
            }
        }
    }

    public collision_tilemap(constraints: Collision.Constraints, movement: Readonly<Vec2>, dest: Readonly<Rect>, object: CollisionObject): void {
        // calculate rectangle where the object will move
        for (var solids of this.get_solid_tilemaps()) {
            // test with all tiles in this rectangle
            const test_tiles = this.get_tiles_overlapping(solids, dest);
            for (var x = test_tiles.xMin; x <= test_tiles.xMax; ++x) {
                for (var y = test_tiles.yMin; y <= test_tiles.yMax; ++y) {
                    const tile = this.get_tile(solids, x, y);

                    if (!tile) {
                        continue;
                    }

                    // skip non-solid tiles
                    if (!this.is_tile_solid(tile, object)) {
                        continue;
                    }

                    //var tile_bbox = this.get_tile_bbox(tile, ->get_tile_bbox(x, y);
                    var tile_bbox = this.get_tile_bbox(tile);

                    /* If the tile is a unisolid tile, the "is_solid()" function above
                     * didn't do a thorough check. Calculate the position and (relative)
                     * movement of the object and determine whether or not the tile is
                     * solid with regard to those parameters. */
                    if (this.is_tile_unisolid(tile)) {
                        var relative_movement = movement.clone().subtract(this.get_solids_movement(solids, true));

                        if (!this.is_tile_solid_ex(tile, tile_bbox, object.get_bbox(), relative_movement)) {
                            continue;
                        }
                    }

                    if (this.is_tile_slope(tile)) { // slope tile
                        var triangle = new AATriangle();
                        var slope_data = this.get_tile_data(tile);
                        if (this.get_solids_flip(solids) & TileFlip.VERTICAL_FLIP) {
                            slope_data = AATriangle.vertical_flip(slope_data);
                        }
                        triangle = new AATriangle(tile_bbox, slope_data);

                        Collision.rectangle_aatriangle(constraints, dest, triangle,
                            this.get_solids_movement(solids, false));
                    }
                    else { // normal rectangular tile
                        this.check_collisions(constraints, movement, dest, tile_bbox, null, null,
                            this.get_solids_movement(solids, false));
                    }
                }
            }
        }
    }

    public collision_tile_attributes(dest: Rect, mov: Vec2): number {
        var result = 0;
        for (var solids of this.get_solid_tilemaps()) {
            // test with all tiles in this rectangle
            const test_tiles = this.get_tiles_overlapping(solids, dest);

            // For ice (only), add a little fudge to recognize tiles Tux is standing on.
            var test_rect_ice = cc_rect(dest.x, dest.y - Collision.SHIFT_DELTA, dest.width, dest.height + Collision.SHIFT_DELTA);
            const test_tiles_ice = this.get_tiles_overlapping(solids, test_rect_ice);

            for (var x = test_tiles.xMin; x <= test_tiles.xMax; ++x) {
                var y: number;
                for (y = test_tiles.yMax; y >= test_tiles.yMin; --y) {
                    const tile = this.get_tile(solids, x, y);
                    if (tile && this.is_tile_collisionful(tile, this.get_tile_bbox(tile), dest, mov)) {
                        result |= this.get_tile_attributes(tile);
                    }
                }
                for (; y >= test_tiles_ice.yMin; --y) {
                    const tile = this.get_tile(solids, x, y);
                    if (tile && this.is_tile_collisionful(tile, this.get_tile_bbox(tile), dest, mov)) {
                        result |= (this.get_tile_attributes(tile) & TileAttribute.ICE);
                    }
                }
            }
        }

        return result;
    }


    /** fills in CollisionHit and Normal vector of 2 intersecting rectangle */
    public get_hit_normal(r1: Readonly<Rect>, r2: Readonly<Rect>, hit: CollisionHit, normal: Vec2): void {
        const ileft = r1.xMax - r2.xMin;
        const iright = r2.xMax - r1.xMin;
        const ibottom = r1.yMax - r2.yMin;
        const itop = r2.yMax - r1.yMin;

        const vert_penetration = Math.min(itop, ibottom);
        const horiz_penetration = Math.min(ileft, iright);

        if (vert_penetration < horiz_penetration) {
            if (ibottom < itop) {
                hit.top = true;
                normal.y = vert_penetration;
            }
            else {
                hit.bottom = true;
                normal.y = -vert_penetration;
            }
        }
        else {
            if (ileft < iright) {
                hit.right = true;
                normal.x = horiz_penetration;
            }
            else {
                hit.left = true;
                normal.x = -horiz_penetration;
            }
        }
    }

    public collision_object(object1: CollisionObject, object2: CollisionObject): void {
        const r1: Readonly<Rect> = object1.get_dest();
        const r2: Readonly<Rect> = object2.get_dest();

        var hit = new CollisionHit();
        if (Collision.intersects(r1, r2)) {
            var normal = cc_v2();

            this.get_hit_normal(r1, r2, hit, normal);
            if (!object1.collides(object2, hit)) {
                return;
            }

            hit.swap();
            if (!object2.collides(object1, hit)) {
                return;
            }

            hit.swap();
            var response1 = object1.collision(object2, hit);

            hit.swap();
            var response2 = object2.collision(object1, hit);

            if (response1 == HitResponse.CONTINUE && response2 == HitResponse.CONTINUE) {
                normal.multiplyScalar(0.5 + Collision.DELTA);
                var dest1 = object1.get_dest();
                dest1.x -= normal.x;
                dest1.y -= normal.y;
                var dest2 = object2.get_dest();
                dest2.x += normal.x;
                dest2.y += normal.y;
            }
            else if (response1 == HitResponse.CONTINUE && response2 == HitResponse.FORCE_MOVE) {
                normal.multiplyScalar(1 + Collision.DELTA);
                var dest1 = object1.get_dest();
                dest1.x -= normal.x;
                dest1.y -= normal.y;
            }
            else if (response1 == HitResponse.FORCE_MOVE && response2 == HitResponse.CONTINUE) {
                normal.multiplyScalar(1 + Collision.DELTA);
                var dest2 = object2.get_dest();
                dest2.x += normal.x;
                dest2.y += normal.y;
            }
        }
    }

    public collision_static_constrains(object: CollisionObject): void {
        switch (this.m_angle % 360) {
            case 0:
                this.collision_static_constrains_0(object);
                break;
            case 180:
                this.collision_static_constrains_180(object);
                break;
            case 90:
                this.collision_static_constrains_90(object);
                break;
            case 270:
                this.collision_static_constrains_270(object);
                break;
            default:
                CC_DEV && cc_assert(false, "fatal error");
                break;
        }
    }

    public collision_static_constrains_0(object: CollisionObject) {
        var constraints = new Constraints();
        const movement = object.get_movement();
        var pressure = cc_v2(0, 0);
        var dest = object.get_dest(); // 注意，对dest的修改会直接影响object的dest属性

        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, cc_v2(0, movement.y), dest, object);

            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated horizontal constraints
            if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                const height = constraints.get_height();
                if (height < object.get_bbox().height) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the vertical constraints
                    pressure.y += object.get_bbox().height - height;
                }
                else {
                    dest.height = object.get_bbox().height;
                    dest.y = constraints.get_position_bottom() + Collision.DELTA;
                }
            }
            else if (constraints.get_position_top() < Collision.POS_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_top() - Collision.DELTA - dest.height;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.bottom) {
                dest.x += constraints.ground_movement.x;
                dest.y += constraints.ground_movement.y;
            }

            if (constraints.hit.top || constraints.hit.bottom) {
                constraints.hit.left = false;
                constraints.hit.right = false;
                object.collision_solid(constraints.hit);
            }
        }

        constraints = new Constraints();
        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, movement, dest, object);
            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated vertical constraints
            const width = constraints.get_width();
            if (width < Collision.POS_INFINITY) {
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the horizontal constraints
                    pressure.x += object.get_bbox().width - width;
                }
                else {
                    var xmid = constraints.get_x_midpoint();
                    dest.width = object.get_bbox().width;
                    dest.x = xmid - object.get_bbox().width / 2;
                }
            }
            else if (constraints.get_position_right() < Collision.POS_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_right() - Collision.DELTA - dest.width;
            }
            else if (constraints.get_position_left() > Collision.NEG_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_left() + Collision.DELTA;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.left || constraints.hit.right ||
                constraints.hit.top || constraints.hit.bottom ||
                constraints.hit.crush) {
                object.collision_solid(constraints.hit);
            }
        }

        // an extra pass to make sure we're not crushed vertically
        if (pressure.y > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                const height = constraints.get_height();
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.crush = pressure.y > 16;
                    object.collision_solid(h);
                }
            }
        }

        // an extra pass to make sure we're not crushed horizontally
        if (pressure.x > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_right() < Collision.POS_INFINITY) {
                var width = constraints.get_width();
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.x > 16;
                    object.collision_solid(h);
                }
            }
        }
    }

    public collision_static_constrains_180(object: CollisionObject): void {
        var constraints = new Constraints();
        const movement = object.get_movement();
        var pressure = cc_v2(0, 0);
        var dest = object.get_dest(); // 注意，对dest的修改会直接影响object的dest属性

        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, cc_v2(0, movement.y), dest, object);

            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated horizontal constraints
            if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                const height = constraints.get_height();
                if (height < object.get_bbox().height) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the vertical constraints
                    pressure.y += object.get_bbox().height - height;
                }
                else {
                    dest.height = object.get_bbox().height;
                    dest.y = constraints.get_position_bottom() + Collision.DELTA;
                }
            }
            else if (constraints.get_position_top() < Collision.POS_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_top() - Collision.DELTA - dest.height;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.top) {
                dest.x += constraints.ground_movement.x;
                dest.y += constraints.ground_movement.y;
            }

            if (constraints.hit.top || constraints.hit.bottom) {
                constraints.hit.left = false;
                constraints.hit.right = false;
                object.collision_solid(constraints.hit);
            }
        }

        constraints = new Constraints();
        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, movement, dest, object);
            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated vertical constraints
            const width = constraints.get_width();

            if (width < Collision.POS_INFINITY) {
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the horizontal constraints
                    pressure.x += object.get_bbox().width - width;
                }
                else {
                    var xmid = constraints.get_x_midpoint();
                    dest.width = object.get_bbox().width;
                    dest.x = xmid - object.get_bbox().width / 2;
                }
            }
            else if (constraints.get_position_right() < Collision.POS_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_right() - Collision.DELTA - dest.width;
            }
            else if (constraints.get_position_left() > Collision.NEG_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_left() + Collision.DELTA;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.left || constraints.hit.right ||
                constraints.hit.top || constraints.hit.bottom ||
                constraints.hit.crush) {
                object.collision_solid(constraints.hit);
            }
        }

        // an extra pass to make sure we're not crushed vertically
        if (pressure.y > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_top() < Collision.POS_INFINITY) {
                const height = constraints.get_height();
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.crush = pressure.y > 16;
                    object.collision_solid(h);
                }
            }
        }

        // an extra pass to make sure we're not crushed horizontally
        if (pressure.x > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_right() < Collision.POS_INFINITY) {
                var width = constraints.get_width();
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.x > 16;
                    object.collision_solid(h);
                }
            }
        }
    }

    public collision_static_constrains_90(object: CollisionObject): void {
        var constraints = new Constraints();
        const movement = object.get_movement();
        var pressure = cc_v2(0, 0);
        var dest = object.get_dest(); // 注意，对dest的修改会直接影响object的dest属性

        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, cc_v2(movement.x, 0), dest, object);

            if (!constraints.has_constraints()) {
                break;
            }

            if (constraints.get_position_left() > Collision.NEG_INFINITY) {
                const width = constraints.get_width();
                if (width < object.get_bbox().width) {
                    pressure.x += object.get_bbox().width - width;
                }
                else {
                    dest.width = object.get_bbox().width;
                    dest.x = constraints.get_position_left() + Collision.DELTA;
                }
            }
            else if (constraints.get_position_right() < Collision.POS_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_right() - Collision.DELTA - dest.width;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.left) {
                dest.x += constraints.ground_movement.x;
                dest.y += constraints.ground_movement.y;
            }

            if (constraints.hit.left || constraints.hit.right) {
                constraints.hit.top = false;
                constraints.hit.bottom = false;
                object.collision_solid(constraints.hit);
            }
        }

        constraints = new Constraints();
        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, movement, dest, object);
            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated vertical constraints
            const height = constraints.get_height();
            if (height < Collision.POS_INFINITY) {
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the horizontal constraints
                    pressure.y += object.get_bbox().height - height;
                }
                else {
                    var ymid = constraints.get_y_midpoint();
                    dest.height = object.get_bbox().height;
                    dest.y = ymid - object.get_bbox().height / 2;
                }
            }
            else if (constraints.get_position_top() < Collision.POS_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_top() - Collision.DELTA - dest.height;
            }
            else if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_bottom() + Collision.DELTA;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.top || constraints.hit.bottom ||
                constraints.hit.left || constraints.hit.right ||
                constraints.hit.crush) {
                object.collision_solid(constraints.hit);
            }
        }

        // an extra pass to make sure we're not crushed vertically
        if (pressure.x > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_left() > Collision.NEG_INFINITY) {
                const width = constraints.get_width();
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    var h = new CollisionHit();
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.x > 16;
                    object.collision_solid(h);
                }
            }
        }

        // an extra pass to make sure we're not crushed horizontally
        if (pressure.y > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_top() < Collision.POS_INFINITY) {
                var height = constraints.get_height();
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.y > 16;
                    object.collision_solid(h);
                }
            }
        }
    }

    public collision_static_constrains_270(object: CollisionObject): void {
        var constraints = new Constraints();
        const movement = object.get_movement();
        var pressure = cc_v2(0, 0);
        var dest = object.get_dest(); // 注意，对dest的修改会直接影响object的dest属性

        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, cc_v2(movement.x, 0), dest, object);

            if (!constraints.has_constraints()) {
                break;
            }

            if (constraints.get_position_left() > Collision.NEG_INFINITY) {
                const width = constraints.get_width();
                if (width < object.get_bbox().width) {
                    pressure.x += object.get_bbox().width - width;
                }
                else {
                    dest.width = object.get_bbox().width;
                    dest.x = constraints.get_position_left() + Collision.DELTA;
                }
            }
            else if (constraints.get_position_right() < Collision.POS_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_right() - Collision.DELTA - dest.width;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.right) {
                dest.x += constraints.ground_movement.x;
                dest.y += constraints.ground_movement.y;
            }

            if (constraints.hit.left || constraints.hit.right) {
                constraints.hit.top = false;
                constraints.hit.bottom = false;
                object.collision_solid(constraints.hit);
            }
        }

        constraints = new Constraints();
        for (var i = 0; i < 2; ++i) {
            this.collision_static(constraints, movement, dest, object);
            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated vertical constraints
            const height = constraints.get_height();

            if (height < Collision.POS_INFINITY) {
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the horizontal constraints
                    pressure.y += object.get_bbox().height - height;
                }
                else {
                    var ymid = constraints.get_y_midpoint();
                    dest.height = object.get_bbox().height;
                    dest.y = ymid - object.get_bbox().height / 2;
                }
            }
            else if (constraints.get_position_top() < Collision.POS_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_top() - Collision.DELTA - dest.height;
            }
            else if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_bottom() + Collision.DELTA;
            }
        }

        if (constraints.has_constraints()) {
            if (constraints.hit.top || constraints.hit.bottom ||
                constraints.hit.left || constraints.hit.right ||
                constraints.hit.crush) {
                object.collision_solid(constraints.hit);
            }
        }

        // an extra pass to make sure we're not crushed vertically
        if (pressure.x > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_top() < Collision.POS_INFINITY) {
                const width = constraints.get_width();
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    var h = new CollisionHit();
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.x > 16;
                    object.collision_solid(h);
                }
            }
        }

        // an extra pass to make sure we're not crushed horizontally
        if (pressure.y > 0) {
            constraints = new Constraints();
            this.collision_static(constraints, movement, dest, object);
            if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                var height = constraints.get_height();
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.y > 16;
                    object.collision_solid(h);
                }
            }
        }
    }

    private get_solid_tilemaps(): TiledLayer[] {
        if (!GameConfig.useBlockTileAsObject || !GameConfig.useSpikeTileAsObject) {
            var tiledMap = this.m_map.getTiledMap();
            return tiledMap.getLayers();
        }
        else {
            return [];
        }
    }

    private get_solids_movement(solids: TiledLayer, actual: boolean): Vec2 {
        return cc_v2(0, 0);
    }


    private get_solids_flip(solids: TiledLayer): number {
        return 0;
    }

    private get_tiles_overlapping(solids: TiledLayer, rect: Rect): Rect {
        return this.m_map.getRectOfOverlappingTiles(solids, rect);
    }

    private get_tile(solids: TiledLayer, x: number, y: number): TiledTile {
        return this.m_map.getTileAt(solids, x, y);
    }

    private get_tile_at(solids: TiledLayer, x: number, y: number): TiledTile {
        cc_assert(false, "未测试");
        var pt = noxcc.worldToLocal(solids.node, cc_v2(x, y));
        pt.add2f(noxcc.aw(solids.node), noxcc.ah(solids.node));
        var layerSize = solids.getLayerSize();
        return this.get_tile(solids, Math.floor(pt.x / layerSize.width), Math.floor(pt.y / layerSize.height));
    }

    private is_tile_solid(tile: TiledTile, object: CollisionObject): boolean {
        var collider = tile.node.getComponent(Collider2D);
        if (!GameConfig.useBlockTileAsObject && collider && ObjectGroup.BlockAll.indexOf(collider.group) >= 0) {
            return true;
        }
        return false;
    }

    private is_tile_unisolid(tile: TiledTile): boolean {
        return false;
    }

    private is_tile_solid_ex(tile: TiledTile, tile_bbox: Rect, position: Rect, movement: Vec2): boolean {
        cc_assert(false, "fatal error");
        return true;
    }

    private is_tile_slope(tile: TiledTile): boolean {
        return false;
    }

    private is_tile_collisionful(tile: TiledTile, tile_bbox: Rect, position: Rect, movement: Vec2): boolean {
        var collider = tile.node.getComponent(Collider2D);
        if (!GameConfig.useSpikeTileAsObject && collider && collider.group == ObjectGroup.Spike) {
            // 尖刺碰撞，减少尖刺边沿的接触范围，否则翻转时会触碰到尖刺
            switch (tile.grid) {
                case GameConfig.spikeDownTile:
                    tile_bbox.y += 14;
                    tile_bbox.width -= 10;
                    tile_bbox.height -= 12;
                    break;
                case GameConfig.spikeUpTile:
                    tile_bbox.height -= 10;
                    break;
                case GameConfig.spikeLeftTile:
                    tile_bbox.x += 30;
                    break;
                case GameConfig.spikeRightTile:
                    tile_bbox.width -= 4;
                    break;
                default:
                    cc_assert(false, "fatal error");
                    break;
            }
            if (tile_bbox.intersects(position)) {
                return true;
            }
        }
        return false;
    }

    private get_tile_bbox(tile: TiledTile): Rect {
        var tileSize = tile._layer.getMapTileSize();
        var pt1 = cc_v2(tile.node.position.x, tile.node.position.y);
        var pt2 = cc_v2(tile.node.position.x + tileSize.width, tile.node.position.y + tileSize.height);
        pt1.add2f(noxcc.aleft(tile.node.parent), noxcc.abottom(tile.node.parent));
        pt2.add2f(noxcc.aleft(tile.node.parent), noxcc.abottom(tile.node.parent));
        pt1 = noxcc.convertPosAR(pt1, tile.node.parent, this.m_map.node);
        pt2 = noxcc.convertPosAR(pt2, tile.node.parent, this.m_map.node);
        cc_assert(pt1.x < pt2.x && pt1.y < pt2.y, "fatal error");
        return cc_rect(pt1.x, pt1.y, pt2.x - pt1.x, pt2.y - pt1.y);
    }

    private get_tile_data(tile: TiledTile): number {
        return 0;
    }

    private get_tile_attributes(tile: TiledTile): number {
        var collider = tile.node.getComponent(Collider2D);
        cc_assert(collider);
        if (!GameConfig.useSpikeTileAsObject && collider.group == ObjectGroup.Spike) {
            return TileAttribute.HURTS;
        }
        return 0;
    }


    public collision_static_constrains_simple(object: CollisionObject) {
        var constraints = new Constraints();
        const movement = object.get_movement();
        var pressure = cc_v2(0, 0);

        var final_dest = object.get_dest().clone();
        var dest = object.get_bbox().clone();
        dest.y += movement.y;
        for (var i = 0; i < 2; ++i) {
            this.collision_static_simple(true, constraints, movement, dest, final_dest, object);

            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated horizontal constraints
            if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                const height = constraints.get_height();
                if (height < object.get_bbox().height) {
                    pressure.y += object.get_bbox().height - height;
                }
                else {
                    dest.height = object.get_bbox().height;
                    dest.y = constraints.get_position_bottom() + Collision.DELTA;
                }
            }
            else if (constraints.get_position_top() < Collision.POS_INFINITY) {
                dest.height = object.get_bbox().height;
                dest.y = constraints.get_position_top() - Collision.DELTA - dest.height;
            }

            final_dest.y = dest.y;
        }

        dest.x += movement.x;

        if (constraints.has_constraints()) {
            if (constraints.hit.bottom) {
                dest.x += constraints.ground_movement.x;
                dest.y += constraints.ground_movement.y;
            }

            if (constraints.hit.top || constraints.hit.bottom) {
                constraints.hit.left = false;
                constraints.hit.right = false;
                object.collision_solid(constraints.hit);
            }
        }

        var old_constraints = constraints;

        constraints = new Constraints();
        for (var i = 0; i < 2; ++i) {
            this.collision_static_simple(false, constraints, movement, dest, dest, object);
            if (!constraints.has_constraints()) {
                break;
            }

            // apply calculated vertical constraints
            const width = constraints.get_width();
            if (width < Collision.POS_INFINITY) {
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    // we're crushed, but ignore this for now, we'll get this again
                    // later if we're really crushed or things will solve itself when
                    // looking at the horizontal constraints
                    pressure.x += object.get_bbox().width - width;
                }
                else {
                    var xmid = constraints.get_x_midpoint();
                    dest.width = object.get_bbox().width;
                    dest.x = xmid - object.get_bbox().width / 2;
                }
            }
            else if (constraints.get_position_right() < Collision.POS_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_right() - Collision.DELTA - dest.width;
            }
            else if (constraints.get_position_left() > Collision.NEG_INFINITY) {
                dest.width = object.get_bbox().width;
                dest.x = constraints.get_position_left() + Collision.DELTA;
            }
        }

        constraints.position_top = old_constraints.position_top;
        constraints.speed_top = old_constraints.speed_top;
        constraints.position_bottom = old_constraints.position_bottom;
        constraints.speed_bottom = old_constraints.speed_bottom;
        constraints.hit.top = old_constraints.hit.top;
        constraints.hit.bottom = old_constraints.hit.bottom;

        if (constraints.has_constraints()) {
            if (constraints.hit.left || constraints.hit.right ||
                constraints.hit.top || constraints.hit.bottom ||
                constraints.hit.crush) {
                object.collision_solid(constraints.hit);
            }
        }

        // an extra pass to make sure we're not crushed vertically
        if (pressure.y > 0) {
            constraints = new Constraints();
            this.collision_static_simple(true, constraints, movement, dest, dest, object);
            if (constraints.get_position_bottom() > Collision.NEG_INFINITY) {
                const height = constraints.get_height();
                if (height + Collision.SHIFT_DELTA < object.get_bbox().height) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.crush = pressure.y > 16;
                    object.collision_solid(h);
                }
            }
        }

        // an extra pass to make sure we're not crushed horizontally
        if (pressure.x > 0) {
            constraints = new Constraints();
            this.collision_static_simple(false, constraints, movement, dest, dest, object);
            if (constraints.get_position_right() < Collision.POS_INFINITY) {
                var width = constraints.get_width();
                if (width + Collision.SHIFT_DELTA < object.get_bbox().width) {
                    var h = new CollisionHit();
                    h.top = true;
                    h.bottom = true;
                    h.left = true;
                    h.right = true;
                    h.crush = pressure.x > 16;
                    object.collision_solid(h);
                }
            }
        }

        object.set_dest(dest);
    }

    public collision_static_simple(is_vert: boolean, constraints: Collision.Constraints,
        movement: Readonly<Vec2>,
        dest: Readonly<Rect>,
        final_dest: Readonly<Rect>,
        object: CollisionObject): void {
        this.collision_tilemap_simple(is_vert, constraints, movement, dest, final_dest, object);

        for (var static_object of this.m_objects) {
            if (static_object.get_group() != CollisionGroup.COLGROUP_STATIC &&
                static_object.get_group() != CollisionGroup.COLGROUP_MOVING_STATIC)
                continue;
            if (!static_object.is_valid())
                continue;

            if (static_object != object) {
                this.check_collisions_simple(is_vert, constraints, dest, final_dest, static_object.get_bbox(),
                    object, static_object);
            }
        }
    }

    public collision_tilemap_simple(is_vert: boolean, constraints: Collision.Constraints, movement: Readonly<Vec2>, dest: Readonly<Rect>, final_dest: Readonly<Rect>, object: CollisionObject): void {
        // calculate rectangle where the object will move
        for (var solids of this.get_solid_tilemaps()) {
            // test with all tiles in this rectangle
            const test_tiles = this.get_tiles_overlapping(solids, dest);
            for (var x = test_tiles.xMin; x <= test_tiles.xMax; ++x) {
                for (var y = test_tiles.yMin; y <= test_tiles.yMax; ++y) {
                    const tile = this.get_tile(solids, x, y);

                    if (!tile) {
                        continue;
                    }

                    // skip non-solid tiles
                    if (!this.is_tile_solid(tile, object)) {
                        continue;
                    }

                    //var tile_bbox = this.get_tile_bbox(tile, ->get_tile_bbox(x, y);
                    var tile_bbox = this.get_tile_bbox(tile);

                    /* If the tile is a unisolid tile, the "is_solid()" function above
                     * didn't do a thorough check. Calculate the position and (relative)
                     * movement of the object and determine whether or not the tile is
                     * solid with regard to those parameters. */
                    if (this.is_tile_unisolid(tile)) {
                        var relative_movement = movement.clone().subtract(this.get_solids_movement(solids, true));

                        if (!this.is_tile_solid_ex(tile, tile_bbox, object.get_bbox(), relative_movement)) {
                            continue;
                        }
                    }

                    if (this.is_tile_slope(tile)) { // slope tile
                        var triangle = new AATriangle();
                        var slope_data = this.get_tile_data(tile);
                        if (this.get_solids_flip(solids) & TileFlip.VERTICAL_FLIP) {
                            slope_data = AATriangle.vertical_flip(slope_data);
                        }
                        triangle = new AATriangle(tile_bbox, slope_data);

                        Collision.rectangle_aatriangle(constraints, dest, triangle,
                            this.get_solids_movement(solids, false));
                    }
                    else { // normal rectangular tile
                        this.check_collisions_simple(is_vert, constraints, dest, final_dest, tile_bbox, null, null,
                            this.get_solids_movement(solids, false));
                    }
                }
            }
        }
    }

    private check_collisions_simple(is_vert: boolean, constraints: Collision.Constraints,
        obj_rect: Readonly<Rect>,
        obj_final_rect: Readonly<Rect>,
        other_rect: Readonly<Rect>,
        object?: CollisionObject,
        other?: CollisionObject,
        other_movement?: Readonly<Vec2>) {
        other_movement = other_movement || cc_v2(0, 0);

        if (!Collision.intersects(obj_rect, obj_final_rect))
            return;

        if (!Collision.intersects(obj_rect, other_rect))
            return;

        var dummy = new CollisionHit();

        if (other != null && object != null && !other.collides(object, dummy))
            return;
        if (object != null && other != null && !object.collides(other, dummy))
            return;

        const ileft = obj_rect.xMax - other_rect.xMin;
        const iright = other_rect.xMax - obj_rect.xMin;
        const ibottom = obj_rect.yMax - other_rect.yMin;
        const itop = other_rect.yMax - obj_rect.yMin;

        constraints.ground_movement.add(other_movement);
        if (other != null && object != null) {
            const response: HitResponse = other.collision(object, dummy);
            if (response == HitResponse.ABORT_MOVE)
                return;

            if (!other.get_movement().equals(cc_v2(0, 0))) {
                // TODO what todo when we collide with 2 moving objects?!?
                constraints.ground_movement.add(other.get_movement());
            }
        }

        if (is_vert) {
            if (ibottom < itop) {
                constraints.constrain_top(other_rect.yMin, other_movement.y);
                constraints.hit.top = true;
            }
            else {
                constraints.constrain_bottom(other_rect.yMax, other_movement.y);
                constraints.hit.bottom = true;
            }
        }
        else {
            if (ileft < iright) {
                constraints.constrain_right(other_rect.xMin, other_movement.x);
                constraints.hit.right = true;
            }
            else {
                constraints.constrain_left(other_rect.xMax, other_movement.x);
                constraints.hit.left = true;
            }
        }
    }
}
