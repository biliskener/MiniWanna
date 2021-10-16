import { _decorator, Component, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass
export class ImageList extends Component {
    @property({
        type: [SpriteFrame],
        displayName: "Images"
    })
    images = [];

    public onLoad() {
    }

    public start() {
    }
}
