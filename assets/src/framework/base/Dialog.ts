import { Button, Label, RichText } from "cc";
import { UIConfig } from "../config/UIConfig";
import { StrId } from "../../db/StrId";
import { noxcc } from "../core/noxcc";
import { noxStr } from "../core/noxStr";
import { BaseForm } from "./BaseForm";
import { AllViewTypes } from "../../db/AllViewTypes";
import { RichTextUtil } from "../util/RichTextUtil";

export class Dialog extends BaseForm {
    private mMessage: string = "";
    private mOkHandler: (() => void) | null = null;
    private mCancelHandler: (() => void) | null = null;
    private mOpenCloseCancelHanlder: boolean = false;
    private mNoCancel: boolean = false;
    private mOKString: string = "";
    private mCancelString: string = "";

    private mCloseButton: Button = null as any as Button;
    private mOKButton: Button = null as any as Button;
    private mOKLabel: Label = null as any as Label;
    private mCancelButton: Button = null as any as Button;
    private mCancelLabel: Label = null as any as Label;
    private mMessageRichText: RichText = null as any as RichText;

    constructor() {
        super(AllViewTypes.Dialog);
    }

    public init(message: string, okHandler: () => void, noCancel?: boolean): void {
        this.mMessage = message;
        this.mOkHandler = okHandler;
        this.mNoCancel = noCancel || false;
        this.mOKString = noxStr(StrId.OK);
        this.mCancelString = noxStr(StrId.CANCEL);
    }

    public onLoad(): void {
        super.onLoad();
        this.mCloseButton = noxcc.findButton("Close", this.node);
        this.mOKButton = noxcc.findButton("Content/Buttons/OK", this.node);
        this.mOKLabel = this.mOKButton.getComponentInChildren(Label) as Label;
        this.mCancelButton = noxcc.findButton("Content/Buttons/Cancel", this.node);
        this.mCancelLabel = this.mCancelButton.getComponentInChildren(Label) as Label;
        this.mMessageRichText = noxcc.findRichText("Content/InputBg/Message", this.node);
        noxcc.addClick(this.mOKButton, this, this.onOKButton);
        noxcc.addClick(this.mCancelButton, this, this.onCancelButton);
        noxcc.addClick(this.mCloseButton, this, this.onCloseButton);

        if (this.mNoCancel) {
            this.mCancelButton.node.active = false;
        }
        this.mMessageRichText.string = RichTextUtil.createBoldBBCode(this.mMessage, UIConfig.RICHTEXT_PARAM_LIGHT_S1);
        this.setOKText(this.mOKString);
        this.setCancelText(this.mCancelString);
    }

    public onDestroy(): void {
        super.onDestroy();
    }

    private onOKButton(): void {
        this.close(true);
    }

    private onCancelButton(): void {
        this.close(false);
    }

    private onCloseButton(): void {
        this.close(false);
    }

    private setOKText(text: string): void {
        this.mOKString = text;
        if (this.mOKLabel) this.mOKLabel.string = text;
    }

    private setCancelText(text: string): void {
        this.mCancelString = text;
        if (this.mCancelLabel) this.mCancelLabel.string = text;
    }

    private setCancelHandler(handler: () => void): void {
        this.mCancelHandler = handler;
    }

    public hide(): void {
        super.hide();
        if (this.mCancelHandler && this.mOpenCloseCancelHanlder) {
            this.mCancelHandler();
        }
    }

    private close(isOK: boolean): void {
        if (this.mOKButton) {
            this.mOKButton.interactable = false;
        }
        if (this.mCancelButton) {
            this.mCancelButton.interactable = false;
        }
        this.hide();
        if (isOK) {
            if (this.mOkHandler) this.mOkHandler();
        }
        else {
            if (this.mCancelHandler) this.mCancelHandler();
        }
    }

    private static createEx(message: string, okHandler: () => void, noCancel?: boolean): Dialog {
        let dialog = new Dialog();
        dialog.init(message, okHandler, noCancel);
        return dialog;
    }

    public static showDialog(message: string, okHandler: () => any, noCancel?: boolean): Dialog {
        var dialog = this.createEx(message, okHandler, noCancel);
        dialog.show();
        return dialog;
    }

    // 关闭控制台对话框
    public static showIosDialog(): Dialog {
        var dlg = new Dialog();
        dlg.init(noxStr(70040), function () {
            window.location.reload();
        }, true);
        dlg.mCancelHandler = function () {
            window.location.reload();
        };
        //开启 hide 事件启动cancelhander!避免对其他的造成影响
        dlg.mOpenCloseCancelHanlder = true;
        dlg.show();
        return dlg;
    }
}
