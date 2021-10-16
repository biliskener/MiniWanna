import { Component, Widget, _decorator } from 'cc';
import { noxcc } from '../core/noxcc';
const { ccclass, property, executeInEditMode, requireComponent, executionOrder, disallowMultiple } = _decorator;

@ccclass
@executeInEditMode
@requireComponent(Widget)
@executionOrder(1)
@disallowMultiple
export class SafeAreaWidget extends Component {
    static edgePercent: number = noxcc.safeEdgePercent;
}

(cc as any).SafeAreaWidget = SafeAreaWidget;
