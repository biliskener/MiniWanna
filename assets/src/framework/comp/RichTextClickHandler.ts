import { Component, Event, RichText, _decorator } from 'cc';
import { noxSys } from '../core/noxSys';
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@executeInEditMode
@requireComponent(RichText)
@executionOrder(1)
@disallowMultiple

export class RichTextClickHandler extends Component {
    public onClick(event: Event, param: string): void {
        if (param.match(/^http?:/)) {
            noxSys.openUrl(param);
        }
    }
}
