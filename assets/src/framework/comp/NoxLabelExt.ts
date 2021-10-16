//!! TODO 如何不从资源中创建

import { Component, Enum, Label, _decorator, } from 'cc';
import { CC_EDITOR } from '../core/nox';
import { noxStr } from '../core/noxStr';
import { StaticPrefabMgr } from '../mgr/StaticPrefabMgr';
import { EnumFontSize, EnumFontSizeList } from './EnumFontSize';
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@executeInEditMode
@requireComponent(Label)
@executionOrder(1)
@disallowMultiple
export class NoxLabelExt extends Component {
    @property({
        visible: false,
        type: Enum(EnumFontSize)
    })
    private _fontSize: EnumFontSize = EnumFontSize.NULL;

    @property({
        visible: false
    })
    private _extraLineHeight: number = 0;

    @property({ visible: false })
    private _ignoreLocaleFont: boolean = false;

    @property({ visible: false })
    private _strID: number = 0;

    @property({
        type: Enum(EnumFontSize),
        displayName: "Enum font size",
        tooltip: "Enum font size for label",
    })
    get fontSize(): EnumFontSize {
        return this._fontSize || 0;
    }
    set fontSize(value: EnumFontSize) {
        if (this._fontSize != value) {
            this._fontSize = value;
            this._applyChange();
        }
    }

    @property({
        displayName: "Extra Line Height",
        tooltip: "Extra Line Height for label",
    })
    get extraLineHeight(): number {
        return this._extraLineHeight || 0;
    }
    set extraLineHeight(value: number) {
        if (this._extraLineHeight != value) {
            this._extraLineHeight = value;
            this._applyChange();
        }
    }

    @property({
        displayName: "Ignore Locale Font",
        tooltip: "Ignore Locale Font for label",
    })
    get ignoreLocaleFont(): boolean {
        return this._ignoreLocaleFont || false;
    }
    set ignoreLocaleFont(value: boolean) {
        if (this._ignoreLocaleFont != value) {
            this._ignoreLocaleFont = value;
            this._applyChange();
        }
    }

    @property({
        displayName: "String ID",
        tooltip: "String ID for label",
    })
    get strID(): number {
        return this._strID || 0;
    }
    set strID(value: number) {
        if (this._strID != value) {
            this._strID = value;
            this._applyChange();
        }
    }

    protected onLoad(): void {
        this._applyChange();
    }

    _applyChange() {
        let label = this.node.getComponent(Label);
        if (label) {
            var fontSize = this.fontSize;
            if (fontSize && fontSize > 0) {
                var finalFontSize = EnumFontSizeList[fontSize - 1];
                label.fontSize = finalFontSize;
                var extraLineHeight = this.extraLineHeight;
                if (extraLineHeight >= 0) {
                    label.lineHeight = finalFontSize + extraLineHeight;
                }
            }

            if (!this._ignoreLocaleFont) {
                StaticPrefabMgr.configDefaultTTFFont(label);
            }

            var strID = this.strID;
            if (strID && strID > 0) {
                label.string = noxStr(strID);
                if (CC_EDITOR) {
                    //!! TODO 此接口还是否需要调用
                    (label as any)._updateRenderData ? (label as any)._updateRenderData(true) : (label as any)._forceUpdateRenderData();
                }
            }
        }
    }
}
