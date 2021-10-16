import { Rect } from "cc";

export class AATriangle {
    public bbox: Rect;
    public dir: AATriangle.Direction;

    public constructor(newbox?: Readonly<Rect>, newdir?: AATriangle.Direction) {
        this.bbox = newbox ? newbox.clone() : new Rect();
        this.dir = newdir != null ? newdir : AATriangle.Direction.SOUTHWEST;
    }

    public static vertical_flip(dir: AATriangle.Direction): number {
        var direction = dir & AATriangle.Direction.DIRECTION_MASK;
        direction = 3 - direction;
        var deform = dir & AATriangle.Direction.DEFORM_MASK;
        switch (deform) {
            case AATriangle.Direction.DEFORM_BOTTOM:
                deform = AATriangle.Direction.DEFORM_TOP;
                break;
            case AATriangle.Direction.DEFORM_TOP:
                deform = AATriangle.Direction.DEFORM_BOTTOM;
                break;
            default:
                // unchanged
                break;
        }
        return (direction | deform);
    }
}

export module AATriangle {
    export enum Direction {
        SOUTHWEST = 0,
        NORTHEAST = 1,
        SOUTHEAST = 2,
        NORTHWEST = 3,
        DIRECTION_MASK = 0x0003,
        DEFORM_BOTTOM = 0x0010,
        DEFORM_TOP = 0x0020,
        DEFORM_LEFT = 0x0030,
        DEFORM_RIGHT = 0x0040,
        DEFORM_MASK = 0x0070
    }
}
