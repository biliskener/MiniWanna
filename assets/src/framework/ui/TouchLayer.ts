import { EventTouch, Node, Widget } from "cc";
import { noxcc } from "../core/noxcc";
import { BaseComponent } from "../base/BaseComponent";

export type TouchHandler = ((event: EventTouch) => boolean) | null;

// 触摸层, 事件拦截在捕获阶段
export class TouchLayer extends BaseComponent {
    protected _touchHandler: TouchHandler = null;
    protected _touchEnabled: boolean = false;

    public enableFullScreen(): void {
        var widget = noxcc.getOrAddComponent(this.node, Widget);
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignBottom = true;
        widget.isAlignTop = true;
        widget.left = 0;
        widget.right = 0;
        widget.bottom = 0;
        widget.top = 0;
    }

    public setTouchHandler(handler: TouchHandler): void {
        this._touchHandler = handler;
    }

    private onTouchStartEx(event: EventTouch): void {
        if (event.currentTarget == this.node) {
            if (this.onTouchStart(event)) {
                event.propagationStopped = true;
                event.propagationImmediateStopped = true;
            }
        }
    }

    private onTouchMoveEx(event: EventTouch): void {
        if (event.currentTarget == this.node) {
            this.onTouchMove(event);
        }
    }

    private onTouchEndEx(event: EventTouch): void {
        if (event.currentTarget == this.node) {
            this.onTouchEnd(event);
        }
    }

    private onTouchCancelEx(event: EventTouch): void {
        if (event.currentTarget == this.node) {
            this.onTouchCancel(event);
        }
    }

    protected onTouchStart(event: EventTouch): boolean {
        if (this._touchHandler) {
            return this._touchHandler(event);
        }
        else {
            return true;
        }
    }

    protected onTouchMove(event: EventTouch): void {
    }

    protected onTouchEnd(event: EventTouch): void {
    }

    protected onTouchCancel(event: EventTouch): void {
    }

    public setTouchEnabled(enabled: boolean): void {
        enabled = !!enabled;
        if (this._touchEnabled != enabled) {
            this._touchEnabled = enabled;
            if (this._touchEnabled) {
                this.node.on(Node.EventType.TOUCH_START, this.onTouchStartEx, this, true);
                this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMoveEx, this, true);
                this.node.on(Node.EventType.TOUCH_END, this.onTouchEndEx, this, true);
                this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancelEx, this, true);
                (this.node.eventProcessor.touchListener).setSwallowTouches(false);
            }
            else {
                this.node.off(Node.EventType.TOUCH_START, this.onTouchStartEx, this, true);
                this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMoveEx, this, true);
                this.node.off(Node.EventType.TOUCH_END, this.onTouchEndEx, this, true);
                this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancelEx, this, true);
            }
        }
    }
}

// 阻断输入往下层传播
export class BlockTouchLayer extends TouchLayer {
    public static _blockTouchLayer: BlockTouchLayer;

    public constructor() {
        super();
    }

    public enableBlock(v: boolean): void {
        this.setTouchEnabled(v);
    }

    public static blockTouch(parent: Node): void {
        var layer = BlockTouchLayer._blockTouchLayer;
        if (layer == null) {
            layer = noxcc.newNode().addComponent(BlockTouchLayer);
            BlockTouchLayer._blockTouchLayer = layer;
        }
        layer.enableBlock(true);
        noxcc.setParent(layer.node, parent);
    }
}
