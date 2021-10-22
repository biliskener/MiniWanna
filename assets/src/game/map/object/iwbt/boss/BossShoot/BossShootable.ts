import { _decorator } from "cc";

const { ccclass, property } = _decorator;

export interface BossShootable {
    startShoot(): void;
    stopShoot(): void;
}
