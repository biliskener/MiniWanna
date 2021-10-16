import { Layers, Node } from "cc";
import { cc_director, CC_EDITOR, cc_game, cc_macro } from "./nox";

export module noxScheduler {
    //---- 更新调度器 noxs
    export type UpdateID = {
        node: Node | null,
    }

    // 调度更新
    export function scheduleUpdate(callback: (dt: number) => any, priority: number): UpdateID {
        var node = new Node();
        node.layer = Layers.Enum.UI_2D;
        (node as any).update = callback;
        cc_game.addPersistRootNode(node);
        cc_director.getScheduler().scheduleUpdate(node, priority || 0, false);
        return { node: node };
    }

    // 取消调度更新
    export function unscheduleUpdate(scheduleId: UpdateID): void {
        if (scheduleId && scheduleId.node) {
            cc_director.getScheduler().unscheduleUpdate(scheduleId.node);
            cc_game.removePersistRootNode(scheduleId.node);
            scheduleId.node = null;
        }
    }

    //---- 定时器调度 noxs
    let _targetNode: Node = new Node();
    _targetNode.layer = Layers.Enum.UI_2D;
    if (!CC_EDITOR) {
        cc_game.addPersistRootNode(_targetNode);
    }

    export type TimerID = (dt: number) => void;
    export type ScheduleCB = (dt: number) => any;

    // 调度定时器, 不建议直接使用此接口, 太过底层
    export function schedule(callback: ScheduleCB, interval: number, repeat: number | boolean, delay?: number, paused?: boolean): TimerID {
        let scheduleId: TimerID = function (dt: number): void {
            callback(dt);
        };
        var repeatEx = cc_macro.REPEAT_FOREVER;
        if (repeat != null) {
            if (typeof (repeat) == 'number') {
                repeatEx = repeat;
            }
            else {
                repeatEx = repeat ? cc_macro.REPEAT_FOREVER : 0;
            }
        }
        cc_director.getScheduler().schedule(scheduleId, _targetNode,
            interval || 0,
            repeatEx,
            delay != null ? delay : interval,
            paused || false);
        return scheduleId;
    }

    // 取消调度定时器
    export function unschedule(scheduleId: TimerID): void {
        cc_director.getScheduler().unschedule(scheduleId, _targetNode);
    }

    // 调度定时器
    export function scheduleTimeout(callback: (dt: number) => any, delay: number): TimerID {
        return schedule(callback, delay, 0, delay, false);
    }

    export function scheduleOnce(callback: (dt: number) => any, delay: number): TimerID {
        return schedule(callback, delay, 0, delay, false);
    }

    // 调度定时器
    export function scheduleInterval(callback: (dt: number) => any, interval: number): TimerID {
        return schedule(callback, interval, cc_macro.REPEAT_FOREVER, interval, false);
    }

    // 取消调度定时器
    export function unscheduleTimeout(scheduleId: TimerID): void {
        return unschedule(scheduleId);
    }

    // 取消调度定时器
    export function unscheduleInterval(scheduleId: TimerID): void {
        return unschedule(scheduleId);
    }
}
