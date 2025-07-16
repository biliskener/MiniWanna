import { PHYSICS_2D_PTM_RATIO, PhysicsSystem2D } from "cc";

export enum PhysicsEngineType {
    BOX2D = 1,
    TUX = 2,
}

export enum PhysicsApplyType {
    FORCE,
    IMPULSE,    // 使用冲量时会在地面上抖动
    SPEED,      // 水平速度时可能会卡脚, 否则出现跳跃挂墙上并且角落卡住更麻烦且暂无解决方案
    POSITION,   // 暂时还有问题
}

export module GameConfig {
    export const invincibleMode: boolean = false;
    export const usePhysicsDraw: boolean = true;
    export const useRawTileMapAssets: boolean = false;   // 直接使用TiledMap资源，而不是使用预制作为关卡
    export const physicsEngineType: PhysicsEngineType = PhysicsSystem2D.PHYSICS_BOX2D ? PhysicsEngineType.BOX2D : PhysicsEngineType.TUX;
    export const physicsApplyType: PhysicsApplyType = physicsEngineType == PhysicsEngineType.BOX2D ? PhysicsApplyType.SPEED : PhysicsApplyType.POSITION;
    export const useSimpleCollision: boolean = true;
    export const usePolygonColliderForPlayer = physicsEngineType == PhysicsEngineType.BOX2D && true;
    export const useBlockTileAsObject: boolean = false; // 块若能移动就不要设置为false, 为false性能好
    export const useSpikeTileAsObject: boolean = true;  // 块若能移动就不要设置为false, 为false性能好
    export const useSlowDown: boolean = false;  // 是否有减速过程
    export const useSpeedUp: boolean = false;   // 是否有加速过程
    export const speedUpDuration: number = 0.01;
    export const slowDownDuration: number = 0.01;
    export const enableUseJump2: boolean = true;
    export const betterJumpSpeed: boolean = true;   // 为true时，起跳有保底值
    export const betterJump2Speed: boolean = true;  // 为true时，起跳有保底值

    export const tileWidth: number = 32;
    export const tileHeight: number = 32;

    export const emptyTile: number = 0;
    export const rebornTile: number = 14;
    export const platformTile: number = 2;
    export const blockTiles: number[] = [1, 3, 6, 7, 8, 9, 10, 12, 49, 50, 51, 52, 53, 54, 55, 56];
    export const backgroundTiles: number[] = [4, 5, 11, 13, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 65, 66, 67, 68, 69, 70];

    export const triangleTiles: { [key: number]: [number, number][] } = {
        39: [[0.5, 0], [1, 0], [1, 1]],
        40: [[0, 0], [0.5, 0], [0, 1]],

        41: [[0, 0], [1, 0], [1, 0.5]],
        42: [[0, 0.5], [0, 0], [1, 0], [1, 1]],
        43: [[0, 1], [0, 0], [1, 0], [1, 0.5]],
        44: [[0, 0], [1, 0], [0, 0.5]],
        45: [[0, 0], [1, 0], [1, 1]],
        46: [[0, 0], [1, 0], [0, 1]],
        47: [[0.5, 1], [0, 0], [1, 0], [1, 1]],
        48: [[0, 1], [0, 0], [1, 0], [0.5, 1]],

        57: [[0, 1], [1, 0.5], [1, 1]],
        58: [[0, 1], [0, 0.5], [1, 0], [1, 1]],
        59: [[0, 1], [0, 0], [1, 0.5], [1, 1]],
        60: [[0, 1], [0, 0.5], [1, 1]],
        61: [[0, 1], [1, 0], [1, 1]],
        62: [[0, 1], [0, 0], [1, 1]],
        63: [[0, 1], [0.5, 0], [1, 0], [1, 1]],
        64: [[0, 1], [0, 0], [0.5, 0], [1, 1]],

        71: [[0.5, 1], [1, 0], [1, 1]],
        72: [[0, 1], [0, 0], [0.5, 1]],
    };

    export const saveDoneTile: number = 15;
    export const saveTile: number = 16;
    export const spikeDownTile: number = 17;
    export const spikeUpTile: number = 20;
    export const spikeLeftTile: number = 18;
    export const spikeRightTile: number = 19;
    export const vineDownTile: number = -1;
    export const vineUpTile: number = -1;
    export const vineLeftTile: number = 22;
    export const vineRightTile: number = 21;
    export const transferTile: number = 23;
    export const cherryTile: number = 24;

    export const speedFactor = physicsEngineType == PhysicsEngineType.BOX2D ? 50 / PHYSICS_2D_PTM_RATIO : 50; // 速度因子
    export const gravity = -1000;                           // 重力值
    export const jumpGravityScale = 1.0;                    // 跳跃按键按住时的重力缩放
    export const riseGravityScale = 1.0;                    // 上升时的重力缩放
    export const fallGravityScale = 1.0;                    // 下落时的重力缩放
    export const jumpForceFactor = 20;                      // 跳跃时施加的力的因子, 如果对象面积小，则此值应该小
    export const crushCheckingOffsetX = 6;                  // 挤压检测X偏移
    export const crushCheckingOffsetY = 1;                  // 挤压检测Y偏移
    export const roundedCornerWidth: number = 1.9;          // 碰撞圆角宽度, 值越小越好，太小会卡脚，太大角色会抖动
    export const roundedCornerHeight: number = 1.9;         // 碰撞圆角高度, 值越小越好，太小会卡脚，太大角色会抖动
    export const platformMovementFix: number = 0.0;         // 若无修正值，人物无法稳定站在一个移动的平台上，暂无更好的解决方案
    export const triggerCollisionSize: number = 0.5;        // 触发器有效范围

    export const spikeSpacing = 1;
    export const spikeIsRect = false;

    export const spikeGids = [GameConfig.spikeDownTile, GameConfig.spikeLeftTile, GameConfig.spikeUpTile, GameConfig.spikeRightTile];
}
