import { Node, RichText, Tween, TweenSystem, UIOpacity } from "cc";
import { UIConfig } from "../config/UIConfig";
import { ZOrder } from "../const/ZOrder";
import { cc_assert, cc_tween, cc_v3, nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { RichTextUtil } from "../util/RichTextUtil";
import { BaseComponent } from "../base/BaseComponent";
import { BaseScene } from "../base/BaseScene";
import { StaticPrefabMgr } from "./StaticPrefabMgr";
import { RichTextParam } from "../core/T";

class MarqueePanel extends BaseComponent {
    private static MAX_MSG_COUNT = 150;
    private mMsgs: string[] = [];

    private _isFadingOut: boolean = false;
    private _msg: Node | null = null;

    private init(): void {
    }

    protected onCleanup(): void {
        super.onCleanup();
        this.mMsgs = [];
    }

    public attach(scene: BaseScene): void {
        this.node.active = true;
        noxcc.setZOrder(this.node, ZOrder.marquee);
        noxcc.setParent(this.node, scene.getSceneNode());
        noxcc.setNodeOpacity(this.node, this.mMsgs.length == 0 ? 0 : 255);
    }

    public detach(): void {
        noxcc.setParent(this.node, null);
    }

    public push(msg: string, skipShowPanel?: boolean): boolean {
        if (this.mMsgs.length > MarqueePanel.MAX_MSG_COUNT) {
            return false;
        }
        this.mMsgs.push(msg);
        this.showPanel();
        return true;
    }

    private removeMsg(): void {
        var self = this;
        if (this._msg) {
            noxcc.destroy(this._msg);
            this._msg = null;
            this.mMsgs.shift();
            if (this.mMsgs.length == 0) {
                if (!this._isFadingOut) {
                    this._isFadingOut = true;
                    cc_tween(noxcc.getOrAddComponent(this.node, UIOpacity)).to(0.5, { opacity: 0 }).call(() => {
                        self._isFadingOut = false;
                    }).start();
                }
            }
        }
    }

    public showPanel(): void {
        if (this.node.active) {
            this._isFadingOut = false;
            Tween.stopAllByTarget(this.node);
            Tween.stopAllByTarget(noxcc.getOrAddComponent(this.node, UIOpacity));
            cc_tween(noxcc.getOrAddComponent(this.node, UIOpacity)).to(0.5, { opacity: 255 }).start();
        }
    }

    protected update(dt: number): void {
        var self = this;

        var msgs = this.mMsgs;
        if (msgs.length == 0) {
            return;
        }

        if (this._msg == null) {
            var msg = msgs[0];
            var userName;

            // Check whethe the msg contains user name
            var pos1 = msg.indexOf("#");
            if (pos1 == 0) {
                var pos2 = msg.indexOf("#", pos1 + 1);
                userName = msg.substr(pos1 + 1, pos2 - pos1 - 1);
                msg = msg.substr(pos2 + 1);
            }

            var txtParam: RichTextParam = { size: UIConfig.FontSize.S2, color: UIConfig.COLOR_TEXT_LIGHT, boldColor: UIConfig.COLOR_TEXT_PURPLE };
            var text: RichText | null = null;
            if (userName) {
                text = RichTextUtil.createBoldRichText(userName, UIConfig.RICHTEXT_PARAM_LIGHT_S2);
                RichTextUtil.appendBoldRichText(text, msg, txtParam);
            }
            else {
                text = RichTextUtil.createBoldRichText(msg, txtParam);
            }

            var textNode = text.node;
            textNode.setPosition(noxcc.w(this.node) / 2 + noxcc.w(textNode) / 2, 0);
            this.node.addChild(textNode);
            cc_tween(textNode)
                .to(20, { position: cc_v3(-noxcc.w(this.node) / 2 - noxcc.w(textNode) / 2, 0, textNode.position.z) })
                .call(() => {
                    self.removeMsg();
                })
                .start();
            this._msg = textNode;
        }
    }

    public static create(): MarqueePanel {
        var node = noxcc.instantiate(StaticPrefabMgr.getMarqueePrefab());
        var panel = node.addComponent(MarqueePanel);
        panel.init();
        return panel;
    }
}

// 滚动消息层
export module MarqueeManager {
    let mPanel: MarqueePanel | null = null;

    export function init(): void {
        if (mPanel == null) {
            mPanel = MarqueePanel.create();
        }
    }

    export function shut(): void {
        unattach();
        release();
    }

    export function attach(scene: BaseScene): void {
        if (mPanel == null) {
            mPanel = MarqueePanel.create();
        }
        mPanel.attach(scene);
    }

    export function unattach(): void {
        if (mPanel) {
            mPanel.detach();
        }
    }

    export function stop(): void {
        if (mPanel) {
            mPanel.node.active = false;
        }
    }

    export function release(): void {
        if (mPanel) {
            mPanel.node.destroy();
            mPanel = null;
        }
    }

    export function push(msg: string, skipShowPanel?: boolean): boolean {
        if (mPanel) {
            return mPanel.push(msg, skipShowPanel);
        }
        else {
            return false;
        }
    }

    export function pushArray(msgs: string[]): void {
        if (mPanel) {
            for (var i = 0; i < msgs.length; ++i) {
                if (!mPanel.push(msgs[i], true)) {
                    break;
                }
            }
            mPanel.showPanel();
        }
        else {
            cc_assert(false);
        }
    }
}
