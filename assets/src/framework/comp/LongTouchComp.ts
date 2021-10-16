import { _decorator, Component, Node, EventTouch } from 'cc';
const { ccclass, property } = _decorator;
import { noxcc } from '../core/noxcc';
import { noxTime } from '../core/noxTime';

@ccclass
export class LongTouchComp extends Component {
    @property({ displayName: "Duration" })
    private duration = 1;

    private mIsTouching: boolean = false;
    private mIsOutside: boolean = false;
    private mIsLongTouch: boolean = false;
    private mBeginTime: number = 0;

    public onLoad() {
    }

    public start() {
    }

    protected onEnable(): void {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchBegan, this, false);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, false);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, false);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, false);
    }

    protected onDisable(): void {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchBegan, this, false);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this, false);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this, false);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this, false);
        this.unschedule(this.onCallback);
    }

    public update(dt: number) {
    }

    private onTouchBegan(event: EventTouch): void {
        this.unschedule(this.onCallback);
        this.scheduleOnce(this.onCallback, this.duration);
        this.mBeginTime = noxTime.getTickCount() / 1000;
        this.mIsTouching = true;
        this.mIsLongTouch = false;
        this.mIsOutside = false;
    }

    private onTouchMove(event: EventTouch): void {
        if (this.mIsTouching && !this.mIsOutside) {
            let pos = noxcc.getLocationInNodeFromTouch(event, this.node);
            if (noxcc.arect(this.node).contains(pos)) {
                this.mIsOutside = true;
                if (this.mIsLongTouch) {
                    this.node.emit("long-touch-end", event);
                }
            }
        }
    }

    private onTouchEnd(event: EventTouch): void {
        this.unschedule(this.onCallback);
        if (this.mIsTouching && !this.mIsOutside) {
            if (this.mIsLongTouch) {
                this.node.emit("long-touch-end", event);
            }
        }
        this.mIsTouching = false;
    }

    private onClick(event: EventTouch) {
        event.propagationImmediateStopped = true;
    }

    protected onCallback(): void {
        if (this.mIsTouching && !this.mIsOutside) {
            this.mIsLongTouch = true;
            this.node.emit("long-touch-begin", event);
        }
    }

    public isLongTouch(): boolean {
        return this.mIsLongTouch;
    }
}
