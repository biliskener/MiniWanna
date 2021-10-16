export enum CollisionGroup {
    /** Objects in DISABLED group are not tested for collisions */
    COLGROUP_DISABLED = 0,

    /** Tested against:
     - tiles + attributes
     - static obstacles
     - touchables
     - other moving objects
     and it counts as an obstacle during static collision phase.

     Use for kinematic moving objects like platforms and rocks. */
    COLGROUP_MOVING_STATIC = 1,

    /** Tested against:
     - tiles + attributes
     - static obstacles
     - touchables
     - other moving objects

     Use for ordinary objects. */
    COLGROUP_MOVING = 2,

    /** Tested against:
     - tiles + attributes
     - static obstacles

     Use for interactive particles and decoration. */
    COLGROUP_MOVING_ONLY_STATIC = 3,

    /** Tested against:
     - moving objects
     and it counts as an obstacle during static collision phase.

     Use for static obstacles that Tux walks on. */
    COLGROUP_STATIC = 4,

    /** Tested against:
     - moving objects

     Use for triggers like spikes/areas or collectibles like coins. */
    COLGROUP_TOUCHABLE = 5
}

