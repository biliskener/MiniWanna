import { CollisionHit } from "./CollisionHit";
import { AATriangle } from "./AATriangle";
import { Intersection2D, Rect, Vec2 } from "cc";
import { cc_assert, CC_DEV, cc_log, cc_rect, cc_v2 } from "../../../framework/core/nox";
import { GameConfig } from "../../config/GameConfig";

export module Collision {
    // the engine will be run with a logical framerate of 64fps.
    // We chose 64fps here because it is a power of 2, so 1/64 gives an "even"
    // binary fraction...
    export const LOGICAL_FPS = 64.0;

    // SHIFT_DELTA is used for sliding over 1-tile gaps and collision detection
    export const SHIFT_DELTA = 7.0; //7.0; 太小会挂在墙上，太大会因穿透太被夹死 此值要尽可能小，完美值为刚好大于最大重力穿透

    // a small value... be careful as CD is very sensitive to it
    export const DELTA = .002;

    export const MAX_SPEED = 16.0;

    export const NEG_INFINITY = Number.NEGATIVE_INFINITY;
    export const POS_INFINITY = Number.POSITIVE_INFINITY;

    export class Constraints {
        public ground_movement: Vec2 = new Vec2();
        public hit: CollisionHit = new CollisionHit();

        public position_left: number = NEG_INFINITY;
        public position_right: number = POS_INFINITY;
        public position_bottom: number = NEG_INFINITY;
        public position_top: number = POS_INFINITY;

        public speed_left: number = NEG_INFINITY;
        public speed_right: number = POS_INFINITY;
        public speed_bottom: number = NEG_INFINITY;
        public speed_top: number = POS_INFINITY;

        public has_constraints(): boolean {
            return this.position_left > NEG_INFINITY
                || this.position_right < POS_INFINITY
                || this.position_bottom > NEG_INFINITY
                || this.position_top < POS_INFINITY;
        }

        public constrain_left(position: number, velocity: number): void {
            this.position_left = Math.max(this.position_left, position);
            this.speed_left = Math.max(this.speed_left, velocity);
        }

        public constrain_right(position: number, velocity: number): void {
            this.position_right = Math.min(this.position_right, position);
            this.speed_right = Math.min(this.speed_right, velocity);
        }

        public constrain_bottom(position: number, velocity: number) {
            this.position_bottom = Math.max(this.position_bottom, position);
            this.speed_bottom = Math.max(this.speed_bottom, velocity);
        }

        public constrain_top(position: number, velocity: number): void {
            this.position_top = Math.min(this.position_top, position);
            this.speed_top = Math.min(this.speed_top, velocity);
        }

        public get_position_left(): number {
            return this.position_left;
        }

        public get_position_right(): number {
            return this.position_right;
        }

        public get_position_bottom(): number {
            return this.position_bottom;
        }

        public get_position_top(): number {
            return this.position_top;
        }

        public get_width(): number {
            return this.position_right - this.position_left;
        }

        public get_height(): number {
            return this.position_top - this.position_bottom;
        }

        public get_x_midpoint(): number {
            return (0.5 * (this.position_left + this.position_right));
        }

        public get_y_midpoint(): number {
            return (0.5 * (this.position_bottom + this.position_top));
        }
    }

    export function intersects(r1: Readonly<Rect>, r2: Readonly<Rect>): boolean {
        if (GameConfig.useSimpleCollision) {
            const maxax = r1.x + r1.width;
            const maxay = r1.y + r1.height;
            const maxbx = r2.x + r2.width;
            const maxby = r2.y + r2.height;
            return !(maxax <= r2.x || maxbx <= r1.x || maxay <= r2.y || maxby <= r1.y);
        }
        else {
            return r1.intersects(r2);
        }
    }

    export function makePlane(p1: Readonly<Vec2>, p2: Readonly<Vec2>, out: { n: Vec2, c: number }): void {
        cc_assert(false, "未确定用途");
        out.n = new Vec2(p2.y - p1.y, p1.x - p2.x);
        out.c = -(p2.dot(out.n));
        var nval: number = out.n.length();
        out.n.divide2f(nval, nval);
        out.c /= nval;
    }

    export function rectangle_aatriangle(constraints: Constraints, rect: Rect, triangle: AATriangle, addl_ground_movement?: Vec2): boolean {
        addl_ground_movement = addl_ground_movement || cc_v2(0, 0);

        if (!intersects(rect, triangle.bbox))
            return false;

        //var normal = new cc.Vec2();
        //var c: number = 0.0;
        var p1 = new Vec2();
        var area: Rect;
        switch (triangle.dir & AATriangle.Direction.DEFORM_MASK) {
            case 0:
                area = triangle.bbox.clone();
                break;
            case AATriangle.Direction.DEFORM_BOTTOM:
                area = cc_rect(
                    triangle.bbox.x, triangle.bbox.y,
                    triangle.bbox.width, triangle.bbox.height / 2);
                break;
            case AATriangle.Direction.DEFORM_TOP:
                area = cc_rect(triangle.bbox.x, triangle.bbox.y + triangle.bbox.height / 2,
                    triangle.bbox.width, triangle.bbox.height / 2);
                break;
            case AATriangle.Direction.DEFORM_LEFT:
                area = cc_rect(
                    triangle.bbox.x, triangle.bbox.y,
                    triangle.bbox.width / 2, triangle.bbox.height
                );
                break;
            case AATriangle.Direction.DEFORM_RIGHT:
                area = cc_rect(
                    triangle.bbox.x + triangle.bbox.width / 2, triangle.bbox.y,
                    triangle.bbox.width / 2, triangle.bbox.height
                );
                break;
            default:
                cc_assert(false);
        }

        var out: { n: Vec2, c: number } = { n: null, c: 0 };

        switch (triangle.dir & AATriangle.Direction.DIRECTION_MASK) {
            case AATriangle.Direction.SOUTHWEST:
                p1 = cc_v2(rect.xMin, rect.yMin);
                makePlane(cc_v2(area.xMin, area.yMax), cc_v2(area.xMax, area.yMin), out);
                break;
            case AATriangle.Direction.NORTHEAST:
                p1 = cc_v2(rect.xMax, rect.yMax);
                makePlane(cc_v2(area.xMax, area.yMin), cc_v2(area.xMin, area.yMax), out);
                break;
            case AATriangle.Direction.SOUTHEAST:
                p1 = cc_v2(rect.xMax, rect.yMin);
                makePlane(cc_v2(area.xMin, area.yMin), cc_v2(area.xMax, area.yMax), out);
                break;
            case AATriangle.Direction.NORTHWEST:
                p1 = cc_v2(rect.xMin, rect.yMax);
                makePlane(cc_v2(area.xMax, area.yMax), cc_v2(area.xMin, area.yMin), out);
                break;
            default:
                cc_assert(false);
        }

        var n_p1: number = -out.n.dot(p1);
        var depth: number = n_p1 - out.c;
        if (depth < 0)
            return false;

        if (CC_DEV) {
            cc_log("R: " + JSON.stringify(rect) + " Tri: " + JSON.stringify(triangle));
            cc_log("Norm: " + JSON.stringify(out.n) + " Depth: " + depth);
        }

        var outvec = out.n.clone().multiplyScalar(depth + 0.2);

        const RDELTA = 3;
        if (p1.x < area.xMin - RDELTA || p1.x > area.xMax + RDELTA ||
            p1.y < area.yMin - RDELTA || p1.y > area.yMax + RDELTA) {
            set_rectangle_rectangle_constraints(constraints, rect, area);
        }
        else {
            if (outvec.x < 0) {
                constraints.constrain_right(rect.xMax + outvec.x, addl_ground_movement.x);
                constraints.hit.right = true;
            }
            else {
                constraints.constrain_left(rect.xMin + outvec.x, addl_ground_movement.x);
                constraints.hit.left = true;
            }

            if (outvec.y < 0) {
                constraints.constrain_top(rect.yMax + outvec.y, addl_ground_movement.y);
                constraints.hit.top = true;
            }
            else {
                constraints.constrain_bottom(rect.yMin + outvec.y, addl_ground_movement.y);
                constraints.hit.bottom = true;
                constraints.ground_movement.add(addl_ground_movement);
            }
            constraints.hit.slope_normal = out.n.clone();
        }

        return true;
    }

    export function set_rectangle_rectangle_constraints(constraints: Constraints,
        r1: Rect, r2: Rect,
        addl_ground_movement?: Vec2) {
        addl_ground_movement = addl_ground_movement || cc_v2(0, 0);
        var ileft = r1.xMax - r2.xMin;
        var iright = r2.xMax - r1.xMin;
        var ibottom = r1.yMax - r2.yMin;
        var itop = r2.yMax - r1.yMin;

        var vert_penetration = Math.min(itop, ibottom);
        var horiz_penetration = Math.min(ileft, iright);
        if (vert_penetration < horiz_penetration) {
            if (ibottom < itop) {
                constraints.constrain_bottom(r2.yMin, addl_ground_movement.y);
                constraints.hit.bottom = true;
                constraints.ground_movement.add(addl_ground_movement);
            }
            else {
                constraints.constrain_top(r2.yMax, addl_ground_movement.y);
                constraints.hit.top = true;
            }
        }
        else {
            if (ileft < iright) {
                constraints.constrain_right(r2.xMin, addl_ground_movement.x);
                constraints.hit.right = true;
            }
            else {
                constraints.constrain_left(r2.xMax, addl_ground_movement.x);
                constraints.hit.left = true;
            }
        }
    }

    export function line_intersects_line(line1_start: Vec2, line1_end: Vec2, line2_start: Vec2, line2_end: Vec2): boolean {
        return Intersection2D.lineLine(line1_start, line1_end, line2_start, line2_end);
    }

    export function intersects_line(r: Rect, line_start: Vec2, line_end: Vec2): boolean {
        return Intersection2D.lineRect(line_start, line_end, r);
    }
}
