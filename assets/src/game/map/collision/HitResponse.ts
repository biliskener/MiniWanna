export enum HitResponse {
    // Dynamic collision responses

    /// Call collision() but do no collision handling
    ABORT_MOVE = 0,
    /// move object out of collision and check for collisions again
    /// if this happens too often then the move will just be aborted
    /// (normal physics)
    CONTINUE,   // 碰撞后反弹
    /// Treat object as kinematic, with infinite inertia/mass
    /// pushing other (CONTINUE) objects out of the way
    FORCE_MOVE,  // 碰撞后不反弹，继续向前
}

