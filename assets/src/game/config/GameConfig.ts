import { PhysicsSystem2D } from "cc";

export enum PhysicsEngineType {
    BOX2D = 1,
    TUX = 2,
}

export module GameConfig {
    export const useIwbtLevels: boolean = true;
    export const usePhysicsDraw: boolean = false;
    export const useRawTileMapAssets: boolean = false;   // 直接使用TiledMap资源，而不是使用预制作为关卡
    export const physicsEngineType: PhysicsEngineType = PhysicsSystem2D.PHYSICS_BOX2D ? PhysicsEngineType.BOX2D : PhysicsEngineType.TUX;
    export const applyVerticalForce = physicsEngineType == PhysicsEngineType.BOX2D && true;     // 是否应用垂直力
    export const applyHorizontalSpeed = physicsEngineType == PhysicsEngineType.BOX2D && true;   // 是否应用水平速度, 为true时可能会卡脚, 为false时出现跳跃挂墙上并且角落卡住更麻烦且暂无解决方案
    export const usePolygonColliderForPlayer = physicsEngineType == PhysicsEngineType.BOX2D && true;
    export const useBlockTileAsObject: boolean = false; // 块若能移动就不要设置为false, 为false性能好
    export const useSpikeTileAsObject: boolean = true;  // 块若能移动就不要设置为false, 为false性能好
    export const useSlowDown: boolean = false;  // 是否有减速过程
    export const useSpeedUp: boolean = false;   // 是否有加速过程
    export const enableUseJump2: boolean = true;

    export const tileWidth: number = 32;
    export const tileHeight: number = 32;

    export const rebornTile: number = 14;
    export const platformTile: number = 2;
    export const backgroundTile: number = 11;
    export const saveTile: number = 15;
    export const spikeDownTile: number = 17;
    export const spikeUpTile: number = 20;
    export const spikeLeftTile: number = 18;
    export const spikeRightTile: number = 19;
    export const vineDownTile: number = -1;
    export const vineUpTile: number = -1;
    export const vineLeftTile: number = -1;
    export const vineRightTile: number = -1;
    export const transferTile: number = 23;
    export const cherryTile: number = 24;

    export const speedFactor = physicsEngineType == PhysicsEngineType.BOX2D && applyHorizontalSpeed ? 1.5 : 50; // 速度因子
    export const gravity = -1000;                           // 重力值
    export const jumpGravityScale = 1.0;                    // 跳跃按键按住时的重力缩放
    export const riseGravityScale = 1.5;                    // 上升时的重力缩放
    export const fallGravityScale = 2.0;                    // 下落时的重力缩放
    export const jumpForceFactor = 85;                      // 跳跃时施加的力的因子
    export const slowDownDistance: number = 0.4 * 50 * 50;  // 每秒减速距离
    export const speedUpDistance: number = 0.4 * 50 * 50;   // 每秒加速距离
    export const roundedCornerWidth: number = 0.5;          // 碰撞圆角宽度, 值越小越好，太小会卡脚，太大角色会抖动
    export const roundedCornerHeight: number = 0.5;         // 碰撞圆角高度, 值越小越好，太小会卡脚，太大角色会抖动
    export const platformMovementFix: number = 0.9;         // 若无修正值，人物无法稳定站在一个移动的平台上，暂无更好的解决方案
    export const triggerCollisionSize: number = 0.5;        // 触发器有效范围

    export const spikeSpacing = useIwbtLevels ? 0 : 10;
    export const spikeIsRect = useIwbtLevels ? false : physicsEngineType == PhysicsEngineType.BOX2D;

    export const spikeGids = [GameConfig.spikeDownTile, GameConfig.spikeLeftTile, GameConfig.spikeUpTile, GameConfig.spikeRightTile];
}
