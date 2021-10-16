/** bitset for tile attributes */
export enum TileAttribute {
    /** solid tile that is indestructible by Tux */
    SOLID     = 0x0001,
    /** uni-directional solid tile */
    UNISOLID  = 0x0002,
    /** a brick that can be destroyed by jumping under it */
    BRICK     = 0x0004, //Marked for removal, DO NOT USE!
    /** the level should be finished when touching a goaltile.
     * if data is 0 then the endsequence should be triggered, if data is 1
     * then we can finish the level instantly.
     */
    GOAL      = 0x0008, //Marked for removal, DO NOT USE!
    /** slope tile */
    SLOPE     = 0x0010,
    /** Bonusbox, content is stored in \a data */
    FULLBOX   = 0x0020, //Marked for removal, DO NOT USE!
    /** Tile is a coin */
    COIN      = 0x0040, //Marked for removal, DO NOT USE!

    /* interesting flags (the following are passed to gameobjects) */
    FIRST_INTERESTING_FLAG = 0x0100,

    /** an ice brick that makes tux sliding more than usual */
    ICE       = 0x0100,
    /** a water tile in which tux starts to swim */
    WATER     = 0x0200,
    /** a tile that hurts Tux if he touches it */
    HURTS     = 0x0400,
    /** for lava: WATER, HURTS, FIRE */
    FIRE      = 0x0800
}

