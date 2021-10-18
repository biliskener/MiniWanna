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
    export const enableUseJump2: boolean = useIwbtLevels ? true : false;

    export const tileWidth: number = useIwbtLevels ? 32 : 60;
    export const tileHeight: number = useIwbtLevels ? 32 : 60;

    export const rebornTile: number = useIwbtLevels ? 14 : 18;
    export const whiteTile: number = useIwbtLevels ? 0 : 1;
    export const blackTile: number = useIwbtLevels ? 0 : 3;
    export const blackWhiteTile: number = useIwbtLevels ? -1 : 5;
    export const platformTile: number = useIwbtLevels ? 2 : -1;
    export const backgroundTile: number = useIwbtLevels ? 11 : -1;
    export const saveTile: number = useIwbtLevels ? 15 : -1;
    export const gravityLeftTile: number = useIwbtLevels ? -1 : 17;
    export const gravityRightTile: number = useIwbtLevels ? -1 : 16;
    export const gravityUpTile: number = useIwbtLevels ? -1 : 15;
    export const gravityDownTile: number = useIwbtLevels ? -1 : 8;
    export const spikeDownTile: number = useIwbtLevels ? 17 : 10;
    export const spikeUpTile: number = useIwbtLevels ? 20 : 2;
    export const spikeLeftTile: number = useIwbtLevels ? 18 : 12;
    export const spikeRightTile: number = useIwbtLevels ? 19 : 13;
    export const vineDownTile: number = useIwbtLevels ? -1 : -1;
    export const vineUpTile: number = useIwbtLevels ? -1 : -1;
    export const vineLeftTile: number = useIwbtLevels ? 22 : -1;
    export const vineRightTile: number = useIwbtLevels ? 21 : -1;
    export const transferTile: number = useIwbtLevels ? 23 : -1;
    export const cherryTile: number = useIwbtLevels ? 24 : -1;
    export const blackGateDownTile: number = useIwbtLevels ? -1 : 6;
    export const whiteGateDownTile: number = useIwbtLevels ? -1 : 9;
    export const blackGateUpTile: number = useIwbtLevels ? -1 : 19;
    export const whiteGateUpTile: number = useIwbtLevels ? -1 : 20;
    export const blackGateLeftTile: number = useIwbtLevels ? -1 : 21;
    export const whiteGateLeftTile: number = useIwbtLevels ? -1 : 22;
    export const blackGateRightTile: number = useIwbtLevels ? -1 : 23;
    export const whiteGateRightTile: number = useIwbtLevels ? -1 : 24;
    export const teleportTile: number = useIwbtLevels ? -1 : 27;
    export const treasureTile: number = useIwbtLevels ? -1 : 25;
    export const propTile: number = useIwbtLevels ? -1 : 14;

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
