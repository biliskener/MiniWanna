import { Vec2 } from "cc";
import { cc_assert } from "../../../framework/core/nox";

export class CollisionHit {
    public left: boolean;
    public right: boolean;
    public top: boolean;
    public bottom: boolean;
    public crush: boolean;
    public slope_normal: Vec2;

    public constructor() {
        this.left = false;
        this.right = false;
        this.top = false;
        this.bottom = false;
        this.crush = false;
        this.slope_normal = new Vec2();
    }

    public swap(): void {
        var t = this.left;
        this.left = this.right;
        this.right = t;
        t = this.bottom;
        this.bottom = this.top;
        this.top = t;
    }

    public convert_by_angle(angle: number): CollisionHit {
        if (angle == 0) {
            return this;
        }
        else if (angle == 180) {
            var newHit = new CollisionHit();
            newHit.left = this.right;
            newHit.right = this.left;
            newHit.bottom = this.top;
            newHit.top = this.bottom;
            newHit.crush = this.crush;
            return newHit;
        }
        else if (angle == 90) {
            var newHit = new CollisionHit();
            newHit.right = this.top;
            newHit.bottom = this.right;
            newHit.left = this.bottom;
            newHit.top = this.left;
            newHit.crush = this.crush;
            return newHit;
        }
        else if (angle == 270) {
            var newHit = new CollisionHit();
            newHit.right = this.bottom;
            newHit.bottom = this.left;
            newHit.left = this.top;
            newHit.top = this.right;
            newHit.crush = this.crush;
            return newHit;
        }
        else {
            cc_assert(false, "fatal error");
        }
    }
}
