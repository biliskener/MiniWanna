import { EventTouch, Node, Sprite } from "cc";
import { SpriteUtil } from "../util/SpriteUtil";

export type TouchSprite_TapHandler = ((sender: TouchSprite) => void) | null;
export class TouchSprite extends Node {
    private _tapFunc: TouchSprite_TapHandler = null;
    private _sprite: Sprite = null as any as Sprite;

    private init(name: string, tapFunc: (sender: TouchSprite) => void, isShader: boolean): void {
        this._sprite = SpriteUtil.addSprite(this, name);
        this.on(Node.EventType.TOUCH_START, this.onTouchBegan, this, true);
        this.on(Node.EventType.TOUCH_END, this.onTouchEnd, this, true);
    }

    private onTouchBegan(event: EventTouch): void {
    }

    private onTouchEnd(event: EventTouch): void {
        if (this._tapFunc) {
            this._tapFunc(this);
        }
    }

    public setTouchEndCancelRange(v: number): void {

    }

    public static createTouchSpriteWithMask(name: string, tapFunc: (sender: TouchSprite) => void): TouchSprite {
        var sprite = new TouchSprite();
        sprite.init(name, tapFunc, false);
        return sprite;
    }

    public static createTouchSpriteWithShader(name: string, tapFunc: (sender: TouchSprite) => void): TouchSprite {
        var sprite = new TouchSprite();
        sprite.init(name, tapFunc, true);
        return sprite;
    }
}
