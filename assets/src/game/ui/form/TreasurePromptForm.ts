import { BaseForm } from "../../../framework/base/BaseForm";
import { noxcc } from "../../../framework/core/noxcc";
import { Player } from "../../map/object/Player";
import { AllViewTypes } from "../AllViewTypes";

export class TreasurePromptForm extends BaseForm {
    protected constructor() {
        super(AllViewTypes.TreasurePromptForm);
        this.setAnyClickClose(true);
    }

    onInitWidget() {
        super.onInitWidget();
        noxcc.addClick(noxcc.findButton("button", this.node), this, this.onButtonClick);
    }

    private init(): void {
    }

    private onButtonClick() {
        this.hide();
    }

    onEnter() {
        super.onEnter();
        Player.currenton().map.requestPause();
    }

    onExit() {
        Player.currenton().map.cancelPause();
        super.onExit();
    }

    public static create(): TreasurePromptForm {
        let panel = new TreasurePromptForm();
        panel.init();
        return panel;
    }
}
