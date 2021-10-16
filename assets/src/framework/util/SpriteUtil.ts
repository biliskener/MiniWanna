import { Color, Node, Rect, RenderComponent, Size, Sprite, UIOpacity, UITransform, UITransformComponent, Vec2 } from "cc";
import { cc_color, cc_size } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { AllImageSize } from "../../db/AllImageSize";
import { AllSpriteFrames } from "../../db/AllSpriteFrames";
import { StaticPrefabMgr } from "../mgr/StaticPrefabMgr";

export type SpriteCreateInfo = { _crect?: Rect, _size?: Size, _name?: string };

export module SpriteUtil {
    // 获得精灵帧的路径
    export function getSpriteFramePath(name: string): string {
        //return NoxResMgr.getReviewingImageName(AllSpriteFrames[name]);
        return AllSpriteFrames[name];
    }

    // 是否有此图片
    export function hasSpriteFrame(name: string): boolean {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        return AllImageSize[name] ? true : false;
    }

    // 获得帧信息
    export function getSpriteFrame(name: string): number[] {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        return AllImageSize[name];
    }

    // 获得图片去白边的大小
    export function frameTrimmedSize(name: string): Size {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        var sizeInfo = AllImageSize[name];
        return sizeInfo ? cc_size(sizeInfo[0], sizeInfo[1]) : cc_size(100, 100);
    }

    // 获得图片完整宽度
    export function frameTrimmedWidth(name: string): number {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        var sizeInfo = AllImageSize[name];
        return sizeInfo ? sizeInfo[0] : 100;
    }

    // 获得图片完整高度
    export function frameTrimmedHeight(name: string): number {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        var sizeInfo = AllImageSize[name];
        return sizeInfo ? sizeInfo[1] : 100;
    }

    // 获得图片完整大小
    export function frameFullSize(name: string): Size {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        var sizeInfo = AllImageSize[name];
        return sizeInfo ? cc_size(sizeInfo[2], sizeInfo[3]) : cc_size(100, 100);
    }

    // 获得图片完整宽度
    export function frameFullWidth(name: string): number {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        var sizeInfo = AllImageSize[name];
        return sizeInfo ? sizeInfo[2] : 100;
    }

    // 获得图片完整高度
    export function frameFullHeight(name: string): number {
        name = AllSpriteFrames[name] || name;
        //name = NoxResMgr.getReviewingImageName(name);
        var sizeInfo = AllImageSize[name];
        return sizeInfo ? sizeInfo[3] : 100;
    }

    // 添加一个精灵(不再推荐用这个函数)
    export function addSprite(node: Node, nameOrInfo: string | SpriteCreateInfo, pos?: Vec2, anchorPos?: Vec2): Sprite {
        var path: string = "";
        if (typeof (nameOrInfo) == "object") {
            var crect = nameOrInfo._crect;
            var size = nameOrInfo._size;
            path = nameOrInfo._name ?? "";

            if (size) noxcc.getOrAddComponent(node, UITransformComponent).setContentSize(size);
        }
        else {
            path = nameOrInfo;
        }

        var sprite = node.addComponent(Sprite);

        StaticPrefabMgr.loadAndSetSpriteFrame(sprite, path);
        if (crect) {
            sprite.type = Sprite.Type.SLICED;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
            setCapInsets(sprite, crect);
        }

        if (pos) node.setPosition(pos.x, pos.y);
        if (anchorPos) noxcc.getOrAddComponent(node, UITransform).setAnchorPoint(anchorPos);

        return sprite;
    }

    export function setSprite(target: Node | Sprite, path: string): void {
        var sprite: Sprite | null = target instanceof Node ? target.getComponent(Sprite) : target;
        StaticPrefabMgr.loadAndSetSpriteFrame(sprite as Sprite, path);
    }

    export function addSimpleSprite(node: Node, path: string, trim: boolean, size: boolean | Size): Sprite {
        var sprite = node.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        if (trim) {
            sprite.sizeMode = Sprite.SizeMode.TRIMMED;
            sprite.trim = true;
            if (size) {
                if (typeof (size) == "boolean") {
                    noxcc.getOrAddComponent(node, UITransform).setContentSize(frameTrimmedSize(path));
                }
                else {
                    noxcc.getOrAddComponent(node, UITransform).setContentSize(size);
                }
            }
        }
        else {
            sprite.sizeMode = Sprite.SizeMode.RAW;
            sprite.trim = false;
            if (size) {
                if (typeof (size) == "boolean") {
                    noxcc.getOrAddComponent(node, UITransform).setContentSize(frameFullSize(path));
                }
                else {
                    noxcc.getOrAddComponent(node, UITransform).setContentSize(size);
                }
            }
        }
        StaticPrefabMgr.loadAndSetSpriteFrame(sprite, path);
        return sprite;
    }

    // 添加去白边的图片
    export function addTrimmedSprite(node: Node, path: string, size?: boolean | Size): Sprite {
        return addSimpleSprite(node, path, true, size || false);
    }

    // 添加未去白边的图片(优先使用这个, 完整大小)
    export function addRawSprite(node: Node, path: string, size?: boolean | Size): Sprite {
        return addSimpleSprite(node, path, false, size || false);
    }

    // 添加一个九宫格精灵
    export function addScale9Sprite(node: Node, path: string, crect?: Rect): Sprite {
        var sprite = noxcc.getOrAddComponent(node, Sprite);
        StaticPrefabMgr.loadAndSetSpriteFrame(sprite, path);
        sprite.type = Sprite.Type.SLICED;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        if (crect) {
            setCapInsets(sprite, crect);
        }
        return sprite;
    }

    // 创建一个精灵节点(以后不再建议使用)
    export function createSprite(nameOrInfo: string | SpriteCreateInfo, pos?: Vec2, anchorPos?: Vec2): Sprite {
        var name = typeof (nameOrInfo) == "string" ? nameOrInfo : nameOrInfo._name;
        var sprite = addSprite(noxcc.newNode(), nameOrInfo, pos, anchorPos);
        var size = typeof (nameOrInfo) == "string" ? null : nameOrInfo._size;
        if (size) {
            noxcc.getOrAddComponent(sprite.node, UITransform).setContentSize(size);
        }
        else {
            var spriteFrameSize = frameFullSize(name as string);
            //sprite.trim = false;
            if (spriteFrameSize) {
                noxcc.getOrAddComponent(sprite.node, UITransform).setContentSize(spriteFrameSize);
            }
        }
        return sprite;
    }

    // 创建一个简单的图片
    export function createSimpleSprite(path: string, trim?: boolean): Sprite {
        var sprite = addSimpleSprite(noxcc.newNode(), path, trim || false, true);
        return sprite;
    }

    // 创建一个去白边的图片
    export function createTrimmedSprite(path: string): Sprite {
        return createSimpleSprite(path, true);
    }

    // 创建一个未去白边的图片(优先使用这个)
    export function createRawSprite(path: string): Sprite {
        return createSimpleSprite(path, false);
    }

    // 创建一个九宫格精灵
    export function createScale9Sprite(path: string, crect?: Rect): Sprite {
        var sprite = addScale9Sprite(noxcc.newNode(), path, crect);
        return sprite;
    }

    // 创建一个精灵
    export function createWithSpriteFrameName(name: string, crect?: Rect): Sprite {
        if (crect == null) {
            return createSprite(name);
        }
        else {
            return createScale9Sprite(name, crect);
        }
    }

    // 创建一个精灵
    export function createSpriteWithMask(name: string, pos: Vec2, anchorPos: Vec2): Sprite {
        name = name.replace(/\.jpg$/i, ".png");
        return createSprite(name, pos, anchorPos);
    }

    // 设置九宫格模式
    export function setScale9Enabled(sprite: Sprite, enabled: boolean): void {
        if (enabled) {
            sprite.type = Sprite.Type.SLICED;
            sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        }
        else {
            sprite.type = Sprite.Type.SIMPLE;
        }
    }

    // 设置九宫格信息
    export function setCapInsets(sprite: Sprite, rect: Rect): void {
        // 暂时就用编辑器里面的信息
    }

    // 创建带颜色的层
    export function createLayerColor(color: Color, width: number, height: number) {
        var node = noxcc.instantiate(StaticPrefabMgr.getColorSprite());
        var render = node.getComponent(RenderComponent);
        render.color = cc_color(color.r, color.g, color.b, color.a);
        node.setPosition(0, 0);
        noxcc.getOrAddComponent(node, UITransform).setContentSize(width, height);
        return node;
    }

    // 创建一个图片视图
    export function createImageView(name: string | SpriteCreateInfo, pos?: Vec2, anchorPos?: Vec2): Node {
        var node = createSprite(name, pos, anchorPos).node;
        return node;
    }
}
