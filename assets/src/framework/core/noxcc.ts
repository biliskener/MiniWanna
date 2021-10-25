import { AnimationClip, Animation, AudioClip, Button, Camera, Canvas, Color, Component, EditBox, EventTouch, JsonAsset, Label, Layout, Mask, Node, ParticleAsset, Prefab, Rect, RenderComponent, RichText, Scene, ScrollView, Size, Slider, sp, Sprite, SpriteFrame, TiledMapAsset, Toggle, ToggleContainer, TTFFont, UIOpacity, UITransform, Vec2, Vec3, VideoClip, Widget, ProgressBar, ParticleSystem2D, Asset, Layers, __private, BaseNode, CCObject, Constructor, TiledMap } from "cc";
import { LongTouchComp } from "../comp/LongTouchComp";
import { cc_assert, cc_assetManager, cc_color, CC_DEV, cc_director, CC_EDITOR, cc_errorID, cc_find, cc_game, cc_getError, cc_instantiate, cc_js, cc_log, CC_PREVIEW, cc_rect, cc_resources, cc_size, cc_v2, cc_v3, cc_view, nox } from "./nox";
export module noxcc {
    //---- 颜色帮助函数 noxc
    export function c3b(_r: number, _g: number, _b: number): Color {
        return cc_color(_r, _g, _b);
    }

    export function c3f(_r: number, _g: number, _b: number): Color {
        return cc_color(_r * 255, _g * 255, _b * 255);
    }

    export function c4b(_r: number, _g: number, _b: number, _a: number): Color {
        return cc_color(_r, _g, _b, _a);
    }

    export function c4f(_r: number, _g: number, _b: number, _a: number): Color {
        return cc_color(_r * 255, _g * 255, _b * 255, _a * 255);
    }

    //---- 颜色相关
    export const COLOR = {
        white: c3b(255, 255, 255),
        yellow: c3b(255, 255, 0),
        green: c3b(0, 255, 0),
        blue: c3b(0, 0, 255),
        red: c3b(255, 0, 0),
        magenta: c3b(255, 0, 255),
        black: c3b(0, 0, 0),
        orange: c3b(255, 127, 0),
        gray: c3b(166, 166, 166),
        dark_gray: c3b(50, 50, 50),
        purple: c3b(139, 0, 255),
        light_blue: c3b(80, 80, 192),
        cyan: c3b(0, 255, 255),
        gold: c3b(255, 215, 0),
    };

    export function destroy(node: Node) {
        node.destroy();
    }

    export function newNode(name?: string) {
        var node = new Node();
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform);
        if (name != null) {
            node.name = name;
        }
        return node;
    }

    // 实例化一个节点
    export function instantiate(prefabOrNode: Prefab | Node): Node {
        var node = cc_instantiate(prefabOrNode);
        //noxcc.searchComponentsWithAsset(node);
        return node as any as Node;
    }

    export function addFullSizeWidget(node: Node, alignTarget?: Node): Widget {
        var widget = node.getComponent(Widget) || node.addComponent(Widget);
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignBottom = true;
        widget.isAlignTop = true;
        widget.left = 0;
        widget.right = 0;
        widget.bottom = 0;
        widget.top = 0;
        if (alignTarget) {
            widget.target = alignTarget;
            let targetTf = alignTarget.getComponent(UITransform);
            let tf = node.getComponent(UITransform);
            if (tf && targetTf) {
                tf.setContentSize(targetTf.contentSize);
            }
        }
        return widget;
    }

    export function createNode(size?: Size | null, pos?: Vec2 | null, anchorPos?: Vec2 | null): Node {
        var node = new Node();
        node.layer = Layers.Enum.UI_2D;
        let tf = node.addComponent(UITransform);
        node.name = "";
        if (size) {
            tf.setContentSize(size);
        }
        if (pos) {
            node.setPosition(pos.x, pos.y);
        }
        if (anchorPos) {
            tf.setAnchorPoint(anchorPos);
        }
        return node;
    }

    export function createNodeAndFullSize(): Node {
        var node = new Node();
        node.layer = Layers.Enum.UI_2D;
        let tf = node.addComponent(UITransform);
        node.name = "";
        addFullSizeWidget(node);
        return node;
    }

    export function addComponentInstance(node: Node, component: Component) {
        component.node = (node as unknown as Node);
        (node as any)._components.push(component);
        if (node.activeInHierarchy) {
            cc_director._nodeActivator.activateComp(component);
        }
        return component;
    }

    export function createComponent<T extends Component>(type: { new(): T }, size?: Size | null, pos?: Vec2 | null, anchor?: Vec2 | null): T {
        var node = createNode(size, pos, anchor);
        return node.addComponent(type);
    }

    export function createComponentAndFullScreen<T extends Component>(type: { new(): T }): T {
        var node = createNodeAndFullSize();
        return node.addComponent(type);
    }

    export function addRectMask(node: Node): Mask {
        var mask = node.getComponent(Mask) || node.addComponent(Mask);
        cc_assert(mask.type == Mask.Type.RECT, "fatal error");
        //mask.type = cc.Mask.Type.RECT;
        return mask;
    }

    export function createMaskLayer(opacity: number, color?: Color, size?: Size): Node {
        let layer = newNode();
        layer.addComponent(UITransform);
        initMaskLayer(layer, opacity, color, size);
        return layer;
    }

    export function initMaskLayer(layer: Node, opacity: number, color?: Color, size?: Size): void {
        let tf = layer.getComponent(UITransform) || layer.addComponent(UITransform);
        tf.setContentSize(size || cc_view.getVisibleSize());
        //layer.on(Node.EventType.TOUCH_START, function (event: Event.EventTouch) {
        //}, true);
        //layer.setTouchEnabled(true);
        //layer.setBackGroundColorType(ccui.LayoutBackGroundColorType.solid);
        setNodeColor(layer, nox.D(color, COLOR.black));
        setNodeOpacity(layer, nox.D(opacity, 200));
    }

    export function createTiledMap(tmxAsset: TiledMapAsset, anchorPoint?: Vec2, layer?: number): TiledMap {
        layer ??= Layers.Enum.UI_2D;
        anchorPoint ||= new Vec2(0, 0);
        var node = noxcc.newNode();
        node.layer = layer;
        node.getComponent(UITransform).setAnchorPoint(anchorPoint);
        var tiledMap = addTiledMap(node, tmxAsset, layer);
        return tiledMap;
    }

    export function addTiledMap(node: Node, tmxAsset: TiledMapAsset, layer?: number): TiledMap {
        layer = layer ??= node.layer;
        var tiledMap = node.addComponent(TiledMap);
        tiledMap.enableCulling = false;
        tiledMap.tmxAsset = tmxAsset;
        tiledMap.__preload();
        for (var tiledGroup of tiledMap.getObjectGroups()) {
            for (var child of tiledGroup.node.children) {
                child.layer = layer;
            }
        }
        return tiledMap;
    }

    export function setNodeColor(node: Node, color: Color) {
        let renderComponent = node.getComponent(RenderComponent);
        if (renderComponent) {
            renderComponent.color = color;
        }
        else {
            cc_assert(false);
        }
    }

    export function setNodeOpacity(node: Node, opacity: number) {
        let opacityComp = node.getComponent(UIOpacity) || node.addComponent(UIOpacity);
        opacityComp.opacity = opacity;
    }

    export function getNodeOpacity(node: Node) {
        let opacityComp = node.getComponent(UIOpacity);
        if (opacityComp) {
            return opacityComp.opacity;
        }
        else {
            return 255;
        }
    }

    export function playAnim(anim: Animation, name: string, wrapMode?: __private.cocos_core_animation_types_WrapMode) {
        anim.play(name);
        if (wrapMode != null) {
            anim.getState(name).wrapMode = wrapMode;
        }
    }

    export function getOrAddComponent<T extends Component>(node: Node, type: { new(): T }): T {
        return node.getComponent(type) || node.addComponent(type);
    }

    export const findNode = cc_find as (path: string, referenceNode?: Node) => Node;

    export function findComponent<T extends Component>(type: { new(): T }, path: string, node: Node): T {
        let target = cc_find(path, node);
        return (target ? target.getComponent(type) : null) as any as T;
    }

    //---- Label组件 ----
    export function getLabel(node: Node): Label {
        return node.getComponent(Label) as any as Label;
    }

    export function findLabel(path: string, node: Node): Label {
        return cc_find(path, node)?.getComponent(Label) as any as Label;
    }

    // 获得RichText组件
    export function getRichText(node: Node): RichText {
        return node.getComponent(RichText) as any as RichText;
    }

    // 获得RichText组件
    export function findRichText(path: string, node: Node): RichText {
        return cc_find(path, node)?.getComponent(RichText) as any as RichText;
    }

    //---- EditBox组件 ----
    export function getEditBox(node: Node): EditBox {
        return node.getComponent(EditBox) as any as EditBox;
    }

    export function findEditBox(path: string, node: Node): EditBox {
        return cc_find(path, node)?.getComponent(EditBox) as any as EditBox;
    }

    //---- Sprite组件 ----
    export function getSprite(node: Node): Sprite {
        return node.getComponent(Sprite) as any as Sprite;
    }

    export function findSprite(path: string, node: Node): Sprite {
        return cc_find(path, node)?.getComponent(Sprite) as any as Sprite;
    }

    //---- Button组件 ----
    export function getButton(node: Node): Button {
        return node.getComponent(Button) as any as Button;
    }

    export function findButton(path: string, node: Node): Button {
        return cc_find(path, node)?.getComponent(Button) as any as Button;
    }

    //---- Toggle组件
    export function getToggle(node: Node): Toggle {
        return node.getComponent(Toggle) as any as Toggle;
    }

    export function findToggle(path: string, node: Node): Toggle {
        return cc_find(path, node)?.getComponent(Toggle) as any as Toggle;
    }

    //---- ToggleContainer组件
    export function getToggleContainer(node: Node): ToggleContainer {
        return node.getComponent(ToggleContainer) as any as ToggleContainer;
    }

    export function findToggleGroup(path: string, node: Node): ToggleContainer {
        return cc_find(path, node)?.getComponent(ToggleContainer) as any as ToggleContainer;
    }

    export function getLayout(node: Node): Layout {
        return node.getComponent(Layout) as any as Layout;
    }

    //---- Animation组件
    export function getAnimation(node: Node): Animation {
        return node.getComponent(Animation) as any as Animation;
    }

    export function findAnimation(path: string, node: Node): Animation {
        return cc_find(path, node)?.getComponent(Animation) as any as Animation;
    }

    //---- Skeleton组件
    export function getSkeleton(node: Node): sp.Skeleton {
        return node.getComponent(sp.Skeleton) as any as sp.Skeleton;
    }

    export function findSkeleton(path: string, node: Node): sp.Skeleton {
        return cc_find(path, node)?.getComponent(sp.Skeleton) as any as sp.Skeleton;
    }

    //---- ProgressBar组件
    export function getProgressBar(node: Node): ProgressBar {
        return node.getComponent(ProgressBar) as any as ProgressBar;
    }

    export function findProgressBar(path: string, node: Node): ProgressBar {
        return cc_find(path, node)?.getComponent(ProgressBar) as any as ProgressBar;
    }

    // Widget组件
    export function getWidget(node: Node): Widget {
        return node.getComponent(Widget) as any as Widget;
    }

    export function findWidget(path: string, node: Node): Widget {
        return cc_find(path, node)?.getComponent(Widget) as any as Widget;
    }

    //-----scroll组件
    export function getScrollView(node: Node): ScrollView {
        return node.getComponent(ScrollView) as any as ScrollView;
    }

    export function findScrollView(path: string, node: Node): ScrollView {
        return cc_find(path, node)?.getComponent(ScrollView) as any as ScrollView;
    }

    //---- Slider组件
    export function getSlider(node: Node): Slider {
        return node.getComponent(Slider) as any as Slider;
    }

    export function findSlider(path: string, node: Node): Slider {
        return cc_find(path, node)?.getComponent(Slider) as any as Slider;
    }

    //---- ParticleSystem组件
    export function getParticleSystem2D(node: Node): ParticleSystem2D {
        return node.getComponent(ParticleSystem2D) as any as ParticleSystem2D;
    }

    export function findParticleSystem(path: string, node: Node): ParticleSystem2D {
        return cc_find(path, node)?.getComponent(ParticleSystem2D) as any as ParticleSystem2D;
    }

    //---- 事件关注代码
    export function addLongTouchBegin(nodeOrComponent: Node | LongTouchComp, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on("long-touch-begin", function (event: EventTouch) {
            if (obj) {
                callback.call(obj, event, node, ..._args);
            }
            else {
                callback(event, node, ..._args);
            }
        });
    }

    export function addLongTouchEnd(nodeOrComponent: Node | LongTouchComp, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on("long-touch-end", function (event: EventTouch) {
            if (obj) {
                callback.call(obj, event, node, ..._args);
            }
            else {
                callback(event, node, ..._args);
            }
        });
    }

    export function removeClick(nodeOrComponent: Node | Button): void {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.off(Button.EventType.CLICK);
    }

    // 如果需要引导监听，用noxfun.Utils下面的addClick
    export function addClick(nodeOrComponent: Node | Button, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(Button.EventType.CLICK, function () {
            var longTouchComp = node.getComponent(LongTouchComp);
            if (longTouchComp && longTouchComp.isLongTouch()) {
            }
            else {
                if (obj) {
                    //node.targetOff(obj);
                    callback.call(obj, node, ..._args);
                }
                else {
                    callback(node, ..._args);
                }
            }
        });
    }

    // 如果需要引导监听，用noxfun.Utils下面的addToggleClick
    export function addToggleClick(nodeOrComponent: Node | Toggle, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(Toggle.EventType.CLICK, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addToggleValueChanged(nodeOrComponent: Node | Toggle, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(Toggle.EventType.TOGGLE, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addSliderClick(nodeOrComponent: Node | Slider, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on("slide", function () {
            var longTouchComp = node.getComponent(LongTouchComp);
            if (longTouchComp && longTouchComp.isLongTouch()) {
            }
            else {
                if (obj) {
                    callback.call(obj, node, ..._args);
                }
                else {
                    callback(node, ..._args);
                }
            }
        });
    }

    export function addEditBoxTextChanged(nodeOrComponent: Node | EditBox, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(EditBox.EventType.TEXT_CHANGED, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addEditBoxEditingDidBegan(nodeOrComponent: Node | EditBox, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(EditBox.EventType.EDITING_DID_BEGAN, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addEditBoxEditingDidEnded(nodeOrComponent: Node | EditBox, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(EditBox.EventType.EDITING_DID_ENDED, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addEditBoxEditingReturn(nodeOrComponent: Node | EditBox, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(EditBox.EventType.EDITING_RETURN, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addScrollBegan(nodeOrComponent: Node | ScrollView, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(ScrollView.EventType.SCROLL_BEGAN, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addScrolling(nodeOrComponent: Node | ScrollView, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(ScrollView.EventType.SCROLLING, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addScrollEnded(nodeOrComponent: Node | ScrollView, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(ScrollView.EventType.SCROLL_ENDED, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    export function addScrollTouchUp(nodeOrComponent: Node | ScrollView, obj: object | null, callback: Function, ..._args: any[]) {
        let node = nodeOrComponent instanceof Component ? nodeOrComponent.node : nodeOrComponent;
        node.on(ScrollView.EventType.TOUCH_UP, function () {
            if (obj) {
                callback.call(obj, node, ..._args);
            }
            else {
                callback(node, ..._args);
            }
        });
    }

    // 是否正在装载资源
    let _isLoadingRes = 0;
    let _isLoadingAudio = 0;
    let _isLoadingVideo = 0;

    export function isLoadingRes(): boolean {
        return _isLoadingRes > 0;
    }

    export function isLoadingAudio(): boolean {
        return _isLoadingAudio > 0;
    }

    export function isLoadingVideo(): boolean {
        return _isLoadingVideo > 0;
    }

    export function loadJson(url: string, callback?: (err: Error | null, obj: JsonAsset) => any): void {
        ++_isLoadingRes;
        cc_resources.load(url.replace(/\.json$/, ""), JsonAsset, function (err: Error | null, obj: JsonAsset) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadTtfFont(url: string, callback?: (err: Error | null, obj: TTFFont) => any) {
        ++_isLoadingRes;
        cc_resources.load(url.replace(/\.ttf$/, ""), TTFFont, function (err: Error | null, obj: TTFFont) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadPrefab(url: string, callback?: (err: Error | null, obj: Prefab) => any, progressCallback?: (completedCount: number, totalCount: number, item: any) => any) {
        ++_isLoadingRes;
        if (progressCallback != null) {
            cc_resources.load(url.replace(/\.prefab$/, ""), Prefab, progressCallback, function (err: Error | null, obj: Prefab) {
                --_isLoadingRes;
                callback && callback(err, obj);
            });
        }
        else {
            cc_resources.load(url.replace(/\.prefab$/, ""), Prefab, function (err: Error | null, obj: Prefab) {
                --_isLoadingRes;
                callback && callback(err, obj);
            });
        }
    }

    export function loadSpriteFrame(url: string, callback: (err: Error | null, obj: SpriteFrame) => any): void {
        ++_isLoadingRes;
        url = url.replace(/(\.png|\.jpe?g)$/, "");
        url = url + "/spriteFrame";
        cc_resources.load(url, SpriteFrame, function (err: Error | null, obj: SpriteFrame) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadParticleAsset(url: string, callback: (err: Error | null, obj: ParticleAsset) => any): void {
        ++_isLoadingRes;
        cc_resources.load(url.replace(/\.plist$/, ""), ParticleAsset, function (err: Error | null, obj: ParticleAsset) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadSkeletonData(url: string, callback: (err: Error | null, obj: sp.SkeletonData) => any): void {
        ++_isLoadingRes;
        cc_resources.load(url, sp.SkeletonData, function (err: Error | null, obj: sp.SkeletonData) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadAnimationClip(url: string, callback: (err: Error | null, obj: AnimationClip) => any): void {
        ++_isLoadingRes;
        cc_resources.load(url.replace(/\.json$/, ""), AnimationClip, function (err: Error | null, obj: AnimationClip) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadAudioClip(url: string, callback: (err: Error | null, obj: AudioClip) => any): void {
        ++_isLoadingAudio;
        cc_resources.load(url.replace(/(\.mp3|\.wav)$/, ""), AudioClip, function (err: Error | null, obj: AudioClip) {
            --_isLoadingAudio;
            callback && callback(err, obj);
        });
    }

    export function loadVideoClip(url: string, callback: (err: Error | null, obj: VideoClip) => any): void {
        ++_isLoadingVideo;
        cc_resources.load(url, VideoClip, function (err: Error | null, obj: VideoClip) {
            --_isLoadingVideo;
            callback && callback(err, obj);
        });
    }

    export function loadTmxAsset(url: string, callback: (err: Error | null, obj: TiledMapAsset) => any): void {
        ++_isLoadingRes;
        cc_resources.load(url.replace(/(\.tmx)$/, ''), TiledMapAsset, function (err: Error | null, obj: TiledMapAsset) {
            --_isLoadingRes;
            callback && callback(err, obj);
        });
    }

    export function loadScene(name: string, callback: (err: Error | null, obj: Scene | null) => any) {
        ++_isLoadingRes;
        cc_director.loadScene(name, function (err: null | Error, scene?: Scene) {
            --_isLoadingRes;
            callback && callback(err, scene || null);
        });
    }

    export function releaseAsset(asset: Asset) {
        cc_assetManager.releaseAsset(asset);
    }

    /*
    //---- action相关
    export const moveTo = cc_moveTo;
     
    export const moveBy = cc_moveBy;
     
    export const scaleTo = cc_scaleTo;
     
    export const scaleBy = cc_scaleBy;
     
    export const rotateTo = cc_rotateTo;
     
    export const rotateBy = cc_rotateBy;
     
    export const tintTo = cc_tintTo;
     
    export const tintBy = cc_tintBy;
     
    export const fadeIn = cc_fadeIn;
     
    export const fadeOut = cc_fadeOut;
     
    export const fadeTo = cc_fadeTo;
     
    export const delayTime = cc_delayTime;
     
    export const show = cc_show;
     
    export const hide = cc_hide;
     
    export const removeSelf = cc_removeSelf;
     
    export const place = cc_place;
     
    export const callFunc = cc_callFunc;
     
    export const repeat = cc_repeat;
     
    export const repeatForever = cc_repeatForever;
     
    export function ease(action: ActionInterval, easeName: string, param?: number): ActionInterval {
        var easeDefs = {
            I: [cc_easeIn, 2, 1],
            O: [cc_easeOut, 2, 1],
            IO: [cc_easeIn, 2, 1],
            BackI: [cc_easeBackIn, 1],
            BackO: [cc_easeBackOut, 1],
            BackIO: [cc_easeBackInOut, 1],
            BounceI: [cc_easeBounceIn, 1],
            BounceO: [cc_easeBounceOut, 1],
            BounceIO: [cc_easeBounceInOut, 1],
            ElasticI: [cc_easeElasticIn, 2, 0.3],
            ElasticO: [cc_easeElasticOut, 2, 0.3],
            ElasticIO: [cc_easeElasticInOut, 2, 0.3],
            SineI: [cc_easeSineIn, 1],
            SineO: [cc_easeSineOut, 1],
            SineIO: [cc_easeSineInOut, 1]
        };
     
        var easing;
        if (easeDefs[easeName]) {
            var func = easeDefs[easeName][0];
            var count = easeDefs[easeName][1];
            var def = easeDefs[easeName][2];
            if (count == 2) {
                easing = func(action, lc.D(param, def));
            }
            else {
                easing = func(action);
            }
        }
        else {
            cc_assert(false, `unknown easeName: $(easeName)`);
        }
     
        return action.easing(easing);
    }
     
    export function sequence(...args: any[]) {
        var actions = [];
        for (var i = 0; i < arguments.length; ++i) {
            var action = arguments[i];
            if (nox.isFunction(action)) {
                action = callFunc(action);
            }
            else if (nox.isNumber(action)) {
                action = delayTime(action);
            }
            else if (nox.isArray(action)) {
                action = spawn.apply(null, action);
            }
            else {
                CC_DEBUG && cc_assert(action instanceof Action, "need Action type");
            }
            actions.push(action);
        }
        return cc_sequence(actions);
    }
     
    export function spawn(...args: any[]): ActionInterval {
        var actions = [];
        if (arguments.length == 1) {
            cc_assert(false, "the actions must have two or more");
        }
        for (var i = 0; i < arguments.length; ++i) {
            var action = arguments[i];
            if (nox.isFunction(action)) {
                action = lc.callFunc(action);
            }
            else if (nox.isNumber(action)) {
                action = lc.delayTime(action);
            }
            else if (nox.isArray(action)) {
                action = lc.sequence.apply(null, action);
            }
            else {
                CC_DEBUG && cc_assert(action instanceof Action, "need Action type");
            }
            actions.push(action);
        }
        return cc_spawn(actions);
    }
    */


    //---- 节点帮助函数 noxn

    // 视图大小
    export function winSize(): Size {
        return cc_view.getVisibleSize();
    }

    export function setTag(node: Node, tag: string) {
        return (node as any).__tagId = tag;
    }

    export function getTag(node: Node): string {
        return (node as any).__tagId ?? "";
    }

    export function sx(node: Node) {
        return node.scale.x;
    }

    export function sy(node: Node) {
        return node.scale.y;
    }

    export function setScaleX(node: Node, sx: number) {
        node.setScale(sx, node.scale.y, node.scale.z);
    }

    export function setScaleY(node: Node, sy: number) {
        node.setScale(node.scale.x, sy, node.scale.z);
    }

    export function setScaleXY(node: Node, sx: number, sy: number) {
        node.setScale(sx, sy, node.scale.z);
    }

    export function setWidth(node: Node, v: number): void {
        let tf = getOrAddComponent(node, UITransform);
        tf.width = v;
    }

    export function setHeight(node: Node, v: number): void {
        let tf = getOrAddComponent(node, UITransform);
        tf.width = v;
    }

    export function setSize(node: Node, size: Size): void;

    export function setSize(node: Node, width: number, height: number): void;

    export function setSize(node: Node, size: Size | number, height?: number): void {
        let tf = getOrAddComponent(node, UITransform);
        tf.setContentSize(size as any, height as any);
    }

    export function setAnchorX(node: Node, v: number): void {
        let tf = getOrAddComponent(node, UITransform);
        tf.anchorX = v;
    }

    export function setAnchorY(node: Node, v: number): void {
        let tf = getOrAddComponent(node, UITransform);
        tf.anchorY = v;
    }

    export function setAnchor(node: Node, x: number, y: number): void;

    export function setAnchor(node: Node, anchor: Vec2): void;

    export function setAnchor(node: Node, xOrAnchor: Vec2 | number, y?: number): void {
        let tf = getOrAddComponent(node, UITransform);
        tf.setAnchorPoint(xOrAnchor, y);
    }

    export function setX(node: Node, x: number) {
        node.setPosition(x, node.position.y, node.position.z);
    }

    export function setY(node: Node, y: number) {
        node.setPosition(node.position.x, y, node.position.z);
    }

    export function setZ(node: Node, z: number) {
        node.setPosition(node.position.x, node.position.y, z);
    }

    // 宽度
    export function w(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.width : 0;
    }

    // 高度
    export function h(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.height : 0;
    }

    export function size(node: Node): Size {
        let tf = node.getComponent(UITransform);
        return tf ? tf.contentSize : Size.ZERO;
    }

    export function pos(node: Node): Vec2 {
        return cc_v2(node.position.x, node.position.y);
    }

    // 相对于父的位置
    export function x(node: Node): number {
        return node.position.x;
    }

    // 相对于父的位置
    export function y(node: Node): number {
        return node.position.y;
    }

    // 获得锚点
    export function anchor(node: Node): Vec2 {
        let tf = node.getComponent(UITransform);
        return tf ? new Vec2(tf.anchorX, tf.anchorY) : new Vec2(0.5, 0.5);
    }

    // 获得锚点x // 不建议再使用, 易混淆
    export function ax(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.anchorX : 0.5;
    }

    // 获得锚点y // 不建议再使用, 易混淆
    export function ay(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.anchorY : 0.5;
    }

    // 锚点宽度
    export function aw(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.width * tf.anchorX : 0;
    }

    // 锚点左边宽度(可改为ar)
    export function awr(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.width * (1 - tf.anchorX) : 0;
    }

    // 锚点高度
    export function ah(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.height * tf.anchorY : 0;
    }

    // 锚点上边高度
    export function aht(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.height * (1 - tf.anchorY) : 0;
    }

    // 缩放后的锚点宽度
    export function asw(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.x >= 0 ? tf.width * tf.anchorX * node.scale.x : tf.width * (1 - tf.anchorX) * node.scale.x;
        }
        else {
            return 0;
        }
    }

    // 缩放后的锚点右宽度
    export function aswr(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.x >= 0 ? tf.width * (1 - tf.anchorX) * node.scale.x : tf.width * tf.anchorX * node.scale.x;
        }
        else {
            return 0;
        }
    }

    // 缩放后的锚点高度
    export function ash(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.y >= 0 ? tf.height * tf.anchorY * node.scale.y : tf.height * (1 - tf.anchorY) * node.scale.y;
        }
        else {
            return 0;
        }
    }

    // 缩放后的锚点上边高度
    export function asht(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.y >= 0 ? tf.height * (1 - tf.anchorY) * node.scale.y : tf.height * tf.anchorY * node.scale.y;
        }
        else {
            return 0;
        }
    }

    // 缩放后的宽度
    export function sw(node: Node, isRecurisive?: boolean): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            let scale = node.scale.x;
            if (isRecurisive) {
                let parent = node.parent;
                while (parent) {
                    scale = scale * parent.scale.x;
                    parent = parent.parent;
                }
            }
            return tf.width * Math.abs(scale);
        }
        else {
            return 0;
        }
    }

    // 缩放后的高度
    export function sh(node: Node, isRecurisive?: boolean) {
        let tf = node.getComponent(UITransform);
        if (tf) {
            let scale = node.scale.y;
            if (isRecurisive) {
                let parent = node.parent;
                while (parent) {
                    scale = scale * parent.scale.y;
                    parent = parent.parent;
                }
            }
            return tf.height * Math.abs(scale);
        }
        else {
            return 0;
        }
    }

    // 半宽
    export function cw(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.width / 2 : 0;
    }

    // 半高
    export function ch(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.height / 2 : 0;
    }

    // 中心x位置(相对于自己的锚点)
    export function cx(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.width * (0.5 - tf.anchorX) : 0;
    }

    // 中心y位置(相对于自己的锚点)
    export function cy(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.height * (0.5 - tf.anchorY) : 0;
    }

    // 中心位置(相对于自己的锚点)
    export function cpos(node: Node): Vec2 {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return cc_v2(tf.width * (0.5 - tf.anchorX), tf.height * (0.5 - tf.anchorY));
        }
        else {
            return cc_v2(0, 0);
        }
    }

    // 自己的左边位置(相对于父的锚点)
    export function left(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.x >= 0 ? node.position.x - tf.width * node.scale.x * tf.anchorX : node.position.x + tf.width * node.scale.x * (1 - tf.anchorX);
        }
        else {
            return node.position.x;
        }
    }

    // 自己的右边位置(相对于父的锚点)
    export function right(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.x >= 0 ? node.position.x + tf.width * node.scale.x * (1 - tf.anchorX) : node.position.x - tf.width * node.scale.x * tf.anchorX;
        }
        else {
            return node.position.x;
        }
    }

    // 自己的下边位置(相对于父的锚点)
    export function bottom(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.y >= 0 ? node.position.y - tf.height * node.scale.y * tf.anchorY : node.position.y + tf.height * node.scale.y * (1 - tf.anchorY);
        }
        else {
            return node.position.y;
        }
    }

    // 相对于父的上边位置
    export function top(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.y >= 0 ? node.position.y + tf.height * node.scale.y * (1 - tf.anchorY) : node.position.y - tf.height * node.scale.y * tf.anchorY;
        }
        else {
            return node.position.y;
        }
    }

    // 自己的区域，相对于父
    export function boundRect(node: Node): Rect {
        return cc_rect(left(node), bottom(node), sw(node), sh(node));
    }

    // 相对于自己的锚点的左边位置
    export function aleft(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? -tf.width * tf.anchorX : 0;
    }

    export function asleft(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.x >= 0 ? -tf.width * tf.anchorX * node.scale.x : tf.width * (1 - tf.anchorX) * node.scale.x;
        }
        else {
            return 0;
        }
    }

    // 相对于自己的锚点的右边位置
    export function aright(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.width * (1 - tf.anchorX) : 0;
    }

    export function asright(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.x >= 0 ? tf.width * (1 - tf.anchorX) * node.scale.x : -tf.width * tf.anchorX * node.scale.x;
        }
        else {
            return 0;
        }
    }

    // 相对于自己的锚点的下边位置
    export function abottom(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? -tf.height * tf.anchorY : 0;
    }

    export function asbottom(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.y >= 0 ? -tf.height * tf.anchorY * node.scale.y : tf.height * (1 - tf.anchorY) * node.scale.y;
        }
        else {
            return 0;
        }
    }

    // 相对于自己的锚点的上边位置
    export function atop(node: Node): number {
        let tf = node.getComponent(UITransform);
        return tf ? tf.height * (1 - tf.anchorY) : 0;
    }

    export function astop(node: Node): number {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return node.scale.y >= 0 ? tf.height * (1 - tf.anchorY) * node.scale.y : -tf.height * tf.anchorY * node.scale.y;
        }
        else {
            return 0;
        }
    }

    // 相对于自己的锚点的矩形区域
    export function arect(node: Node): Rect {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return cc_rect(-tf.width * tf.anchorX, -tf.height * tf.anchorY, tf.width, tf.height);
        }
        else {
            return cc_rect(0, 0, 0, 0);
        }
    }

    export function asrect(node: Node): Rect {
        return cc_rect(asleft(node), astop(node), sw(node), sh(node));
    }

    // 移动节点位置
    export function addX(node: Node, offX: number): void {
        node.setPosition(node.position.x + offX, node.position.y);
    }

    export function addY(node: Node, offY: number): void {
        node.setPosition(node.position.x, node.position.y + offY);
    }

    export function decX(node: Node, offX: number): void {
        node.setPosition(node.position.x - offX, node.position.y);
    }

    export function decY(node: Node, offY: number): void {
        node.setPosition(node.position.x, node.position.y - offY);
    }

    export function addXY(node: Node, offX: number = 0, offY: number = 0): void {
        let pos = node.position;
        node.setPosition(pos.x + offX, pos.y + offY);
    }

    export function decXY(node: Node, offX: number = 0, offY: number = 0): void {
        let pos = node.position;
        node.setPosition(pos.x - offX, pos.y - offY);
    }

    // 是否包含位置(相对于AR)
    export function containsLocalPosAR(node: Node, localPos: Vec2): boolean {
        let tf = node.getComponent(UITransform);
        if (tf) {
            let rect = cc_rect(0, 0, tf.width, tf.height);
            localPos = cc_v2(localPos.x + tf.anchorX * tf.width, localPos.y + tf.anchorY * tf.height);
            return rect.contains(localPos);
        }
        else {
            return false;
        }
    }

    // 是否包含本地位置(相对于左下角)
    export function containsLocalPosLB(node: Node, localPos: Vec2): boolean {
        let tf = node.getComponent(UITransform);
        if (tf) {
            let rect = cc_rect(-tf.width * tf.anchorX, -tf.height * tf.anchorY, tf.width, tf.height);
            return rect.contains(localPos);
        }
        else {
            return false;
        }
    }

    // 是否包含世界位置
    export function containsWorldPosLB(node: Node, worldPos: Vec2): boolean {
        let tf = node.getComponent(UITransform);
        if (tf) {
            let localPos = tf.convertToNodeSpaceAR(cc_v3(worldPos.x, worldPos.y, 0));
            let rect = cc_rect(-tf.width * tf.anchorX, -tf.height * tf.anchorY, tf.width, tf.height);
            return rect.contains(cc_v2(localPos.x, localPos.y));
        }
        else {
            return false;
        }
    }

    // 转换节点位置(都相对于AR)
    export function convertPosAR(pos: Vec2 | Vec3, fromNode: Node, toNode?: Node): Vec2 {
        if (!toNode || fromNode.parent != toNode.parent) {
            let fromTf = fromNode.getComponent(UITransform);
            if (fromTf) {
                let globalPos = fromTf.convertToWorldSpaceAR(cc_v3(pos.x, pos.y, 0));
                if (toNode) {
                    let toTf = toNode?.getComponent(UITransform);
                    if (toTf) {
                        let newPos = toTf.convertToNodeSpaceAR(globalPos);
                        return cc_v2(newPos.x, newPos.y);
                    }
                    else {
                        cc_assert(false);
                        return cc_v2(0, 0);
                    }
                }
                else {
                    return cc_v2(globalPos.x, globalPos.y);
                }
            }
            else {
                cc_assert(false);
                return cc_v2(0, 0);
            }
        }
        else {
            return cc_v2(pos.x, pos.y);
        }
    }

    // 转换矩形区域
    export function convertRectAR(rect: Rect, fromNode: Node, toNode?: Node): Rect {
        var pt1 = new Vec2(rect.xMin, rect.yMin);
        var pt2 = new Vec2(rect.xMax, rect.yMax);
        pt1 = noxcc.convertPosAR(pt1, fromNode, toNode);
        pt2 = noxcc.convertPosAR(pt2, fromNode, toNode);
        return new Rect(Math.min(pt1.x, pt2.x), Math.min(pt1.y, pt2.y), Math.abs(pt2.x - pt1.x), Math.abs(pt2.y - pt1.y));
    }

    // 转换相对AR的坐标到相对LB的坐标
    export function toPosLB(pos: Vec2, node: Node): Vec2 {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return cc_v2(pos.x + tf.width * tf.anchorX, pos.y + tf.height * tf.anchorY);
        }
        else {
            return pos;
        }
    }

    // 转换相对LB的坐标到相对AR的坐标
    export function toPosAR(pos: Vec2, node: Node): Vec2 {
        let tf = node.getComponent(UITransform);
        if (tf) {
            return cc_v2(pos.x - tf.width * tf.anchorX, pos.y - tf.height * tf.anchorY);
        }
        else {
            return pos;
        }
    }

    // 设置相对于锚点的位置
    export function setPosAR(node: Node, posOrX: Vec2 | number, y?: number): void {
        let pos = node.getPosition();
        if (typeof (posOrX) == "number") {
            pos.x = posOrX;
            if (typeof (y) == "number") {
                pos.y = y;
            }
        }
        else {
            pos.x = posOrX.x;
            pos.y = posOrX.y;
        }
        node.setPosition(pos.x, pos.y);
    }

    // 设置相对于左下角的位置
    export function setPosLB(node: Node, posOrX: Vec2 | number, y?: number): void {
        let parent = node.parent;
        if (parent) {
            let pos = node.getPosition();
            if (typeof (posOrX) == "number") {
                pos.x = posOrX;
                if (typeof (y) == "number") {
                    pos.y = y;
                }
            }
            else {
                pos.x = posOrX.x;
                pos.y = posOrX.y;
            }
            let pos2 = toPosAR(cc_v2(pos.x, pos.y), parent);
            node.setPosition(pos2.x, pos2.y);
        }
        else {
            cc_assert(false, "need parent");
        }
    }

    export function calcSiblingIndex(node: Node, parent: Node, order: number): number {
        let children = parent.children;
        if (children.length == 0 || getZOrder(children[children.length - 1]) <= order) {
            if (node.parent == parent) {
                return children.length - 1;
            }
            else {
                return children.length;
            }
        }
        else {
            let oldIndex = -1;
            let newIndex = parent.children.length;
            for (let i = 0; i < parent.children.length; ++i) {
                let child = parent.children[i];
                if (child == node) {
                    oldIndex = i;
                }
                else if (getZOrder(child) > order) {
                    newIndex = i;
                    break;
                }
            }
            if (oldIndex >= 0 && oldIndex < newIndex) {
                newIndex--;
            }
            return newIndex;
        }
    }

    export function getZOrder(node: Node): number {
        return (node as any).__localZOrder || 0;
    }

    export function setZOrder(node: Node, order: number) {
        //cc_assert(order >= 0, "zOrder should be greater than 0");
        let oldZOrder = getZOrder(node);
        if (oldZOrder != order) {
            if (node.parent) {
                let newIndex = calcSiblingIndex(node, node.parent, order);
                node.setSiblingIndex(newIndex);
            }
            (node as any).__localZOrder = order;
        }
    }

    // 设置父节点
    export function setParent(node: Node, parent: Node | null) {
        if (node.parent != parent) {
            node.parent = null;
            if (parent) {
                addChild(parent, node);
            }
        }
    }

    // 获得父节点
    export function getParent(node: Node): Node | null {
        return node.parent;
    }

    export function addChild(parent: Node, child: Node, zOrder?: number) {
        if (zOrder != null) {
            setZOrder(child, zOrder);
        }
        let newIndex = calcSiblingIndex(child, parent, getZOrder(child));
        parent.insertChild(child, newIndex);
    }

    // 将节点添加到中心
    export function addChildToCenter(parent: Node, child: Node): Node {
        let parentTf = parent.getComponent(UITransform);
        let childTf = child.getComponent(UITransform);
        if (parentTf && childTf) {
            let ax = childTf.anchorX;
            let ay = childTf.anchorY;
            let sx = child.scale.x;
            let sy = child.scale.y;
            let w = childTf.width;
            let h = childTf.height;
            let pw = parentTf.width;
            let ph = parentTf.height;
            let x = pw * (0.5 - parentTf.anchorX); // 父的中心相对于父的锚点的位置
            let y = ph * (0.5 - parentTf.anchorY);
            x += (ax - 0.5) * w * sx; // 子的锚点相对于子的中心的位置(因为子的中心和父的中心重叠)
            y += (ay - 0.5) * h * sy;
            let position = cc_v2(x, y);
            return addChildToPosAR(parent, child, position);
        }
        else {
            cc_assert(false);
            return child;
        }
    }

    // 将节点添加到父的特定位置(相对于父的AR)
    export function addChildToPosAR(parent: Node, child: Node, position?: Vec2) {
        if (position) {
            setPosAR(child, position);
        }
        addChild(parent, child);
        return child;
    }

    export function addChildToPosLB(parent: Node, child: Node, position: Vec2) {
        if (position) {
            setPosAR(child, toPosAR(position, parent));
        }
        addChild(parent, child);
        return child;
    }

    export function aligned_x(child: Node, x: [number, number?, number?], parent?: Node): number {
        let p = parent || child.parent;

        if (p == null) {
            cc_assert(false);
            return 0;
        }

        let tx = child.position.x;
        if (x != null) {
            tx = x[0];
            let align = x[1];
            if (align != null) {
                let pTf = p.getComponent(UITransform);
                if (pTf == null) {
                    cc_assert(false);
                    return 0;
                }
                tx += (align - pTf.anchorX) * pTf.width;
            }
            var pivot = x.length > 2 ? x[2] : align;
            if (pivot != null) {
                let cTf = child.getComponent(UITransform);
                if (cTf == null) {
                    cc_assert(false);
                    return 0;
                }
                tx += (cTf.anchorX - pivot) * cTf.width * child.scale.x;
            }
        }
        return tx;
    }

    export function aligned_y(child: Node, y: [number, number?, number?], parent?: Node): number {
        let p = parent || child.parent;

        if (p == null) {
            cc_assert(false);
            return 0;
        }

        var ty = child.position.y;
        if (y != null) {
            ty = y[0];
            var align = y[1];
            if (align != null) {
                let pTf = p.getComponent(UITransform);
                if (pTf == null) {
                    cc_assert(false);
                    return 0;
                }
                ty += (align - pTf.anchorY) * pTf.height;
            }
            var pivot = y.length > 2 ? y[2] : align;
            if (pivot != null) {
                let cTf = child.getComponent(UITransform);
                if (cTf == null) {
                    cc_assert(false);
                    return 0;
                }
                ty += (cTf.anchorY - pivot) * cTf.height * child.scale.y;
            }
        }
        return ty;
    }

    export function aligned_pos(child: Node, x: [number, number?, number?], y: [number, number?, number?], parent?: Node): Vec2 {
        return cc_v2(aligned_x(child, x, parent), aligned_y(child, y, parent));
    }

    export function alignNodeX(child: Node, x: [number, number?, number?], parent?: Node): void {
        let pos = child.position;
        child.setPosition(aligned_x(child, x, parent), pos.y);
    }

    export function alignNodeY(child: Node, y: [number, number?, number?], parent?: Node): void {
        let pos = child.position;
        child.setPosition(pos.x, aligned_y(child, y, parent));
    }

    export function alignNode(child: Node, x: [number, number?, number?], y: [number, number?, number?], parent?: Node): void {
        child.setPosition(aligned_x(child, x, parent), aligned_y(child, y, parent));
    }

    // 对齐节点
    export function addChildAndAlign(parent: Node, child: Node, x: [number, number?, number?], y: [number, number?, number?], order?: number, tag?: string) {
        if (tag != null) {
            setTag(child, tag);
        }
        if (order != null) {
            setZOrder(child, order);
        }
        addChild(parent, child);
        alignNode(child, x, y);
        return child;
    }

    export function addNodesToCenter(parent: Node, nodes: Node[], gaps: number | number[], y?: number, order?: number): void {
        let w = 0;
        for (var i = 0; i < nodes.length; ++i) {
            var node = nodes[i];
            w = w + sw(node);
            if (i < nodes.length - 1) {
                w = w + (gaps instanceof Array ? gaps[i] : gaps);
            }
        }

        w = nox.makeEven(w);

        let tf = parent.getComponent(UITransform);
        if (tf == null) {
            cc_assert(false);
            return;
        }

        let x = (tf.width - w) / 2 - tf.width * tf.anchorX;
        y ??= tf.height / 2 - tf.height * tf.anchorY;
        for (var i = 0; i < nodes.length; ++i) {
            let node = nodes[i];
            node.setPosition(Math.floor(x + asw(node)), y || node.position.y);
            if (order != null) {
                setZOrder(node, order + i);
            }
            addChild(parent, node);
            if (i < nodes.length - 1) {
                x += sw(node) + (gaps instanceof Array ? gaps[i] : gaps);
            }
        }
    }

    //---- cocos相关 noxcc
    export function invideCallback(object: Component, funcName: string, beforeCallback: Function, afterCallback?: Function): void {
        var component = object;
        if (component == null) return;
        var superFunc = (component as any)[funcName];
        if (superFunc) {
            (component as any)[funcName] = function () {
                var args = [].slice.apply(arguments, [1]);
                if (beforeCallback) {
                    beforeCallback.apply(null, args);
                }
                superFunc.apply(component, args);
                if (afterCallback) {
                    afterCallback.apply(null, args);
                }
            };
        }
        else {
            cc_assert(false, "cc.Node.prototype.invideCallback failed, unknown funcName " + funcName);
        }
    }

    export const safeEdgePercent = !nox.isHtml5 || CC_DEV ? 0.04 : 0;

    export function getSafeEdge() {
        let minWidth = cc_view.getVisibleSize().height * (cc_view.getDesignResolutionSize().width / cc_view.getDesignResolutionSize().height);
        let minEdge = (cc_view.getVisibleSize().width - minWidth) / 2;
        let edge = Math.min(noxcc.safeEdgePercent * cc_view.getVisibleSize().width, minEdge);
        return edge;
    }

    let uiCanvas: Canvas = null as any as Canvas;
    let uiCanvasTf: UITransform = null as any as UITransform;
    let uiCamera: Camera = null as any as Camera;
    let uiRootNode: Node = null as any as Node;

    export function getUIRootNode() {
        return uiRootNode;
    }

    export function getUICanvas(): Canvas {
        return uiCanvas as Canvas;
    }

    export function getUICamera(): Camera {
        return uiCamera;
    }

    export function to_v3(v2: Vec2, v3?: Vec3): Vec3 {
        v3 ??= cc_v3();
        v3.x = v2.x;
        v3.y = v2.y;
        v3.z = 0;
        return v3;
    }

    export function to_v2(v3: Vec3, v2?: Vec2): Vec2 {
        if (v2) {
            v2.x = v3.x;
            v2.y = v3.y;
        }
        else {
            v2 = cc_v2(v3.x, v3.y);
        }
        return v2;
    }

    let __temp_vec2 = cc_v2();
    let __temp_vec3 = cc_v3();
    let __temp_rect = cc_rect();
    let __temp_size = cc_size();

    export function getLocationInNodeFromTouch(event: EventTouch, node: Node): Vec2 {
        let tf = node.getComponent(UITransform);
        if (tf) {
            event.getUILocation(__temp_vec2);
            to_v3(__temp_vec2, __temp_vec3);
            return to_v2(tf.convertToNodeSpaceAR(__temp_vec3));
        }
        else {
            event.getLocation(__temp_vec2);
            to_v3(__temp_vec2, __temp_vec3);
            getUICamera().screenToWorld(__temp_vec3, __temp_vec3);
            return to_v2(getUICamera().convertToUINode(__temp_vec3, node));
        }
    }

    export function localToWorld(node: Node, pos: Vec2) {
        to_v3(pos, __temp_vec3);
        noxcc.getOrAddComponent(node, UITransform).convertToWorldSpaceAR(__temp_vec3, __temp_vec3);
        return cc_v2(__temp_vec3.x, __temp_vec3.y);
    }

    export function worldToLocal(node: Node, pos: Vec2) {
        to_v3(pos, __temp_vec3);
        noxcc.getOrAddComponent(node, UITransform).convertToNodeSpaceAR(__temp_vec3, __temp_vec3);
        return cc_v2(__temp_vec3.x, __temp_vec3.y);
    }

    export function localToScreen(node: Node, pos: Vec2) {
        to_v3(pos, __temp_vec3);
        noxcc.getOrAddComponent(node, UITransform).convertToWorldSpaceAR(__temp_vec3, __temp_vec3);
        getUICamera().worldToScreen(__temp_vec3, __temp_vec3);
        return cc_v2(__temp_vec3.x, __temp_vec3.y);
    }

    export function screenToLocal(node: Node, pos: Vec2) {
        to_v3(pos, __temp_vec3);
        getUICamera().screenToWorld(__temp_vec3, __temp_vec3);
        noxcc.getOrAddComponent(node, UITransform).convertToNodeSpaceAR(__temp_vec3, __temp_vec3);
        return cc_v2(__temp_vec3.x, __temp_vec3.y);
    }

    /*
    export function deserializing() {
        return cc_game._isDeserializing;
    }
    */

    function hackEngine() {
        var EditorExtends = (globalThis as any).EditorExtends;
        var legacyCC = (globalThis as any).cc;
        (BaseNode as any).prototype.addComponent = function <T extends Component>(typeOrClassName: string | Constructor<T>) {
            if (CC_EDITOR && (this._objFlags & CCObject.Flags.Destroying)) {
                throw Error('isDestroying');
            }

            // get component

            let constructor: Constructor<T> | null | undefined;
            if (typeof typeOrClassName === 'string') {
                constructor = cc_js.getClassByName(typeOrClassName) as Constructor<T> | undefined;
                if (!constructor) {

                    if (legacyCC._RF.peek()) {
                        cc_errorID(3808, typeOrClassName);
                    }
                    throw TypeError(cc_getError(3807, typeOrClassName));
                }
            } else {
                if (!typeOrClassName) {
                    throw TypeError(cc_getError(3804));
                }
                constructor = typeOrClassName;
            }

            // check component

            if (typeof constructor !== 'function') {
                throw TypeError(cc_getError(3809));
            }
            if (!cc_js.isChildClassOf(constructor, legacyCC.Component)) {
                throw TypeError(cc_getError(3810));
            }

            if (CC_EDITOR && (constructor as typeof constructor & { _disallowMultiple?: unknown })._disallowMultiple) {
                this._checkMultipleComp!(constructor);
            }

            // check requirement

            const ReqComp = (constructor as typeof constructor & { _requireComponent?: typeof Component })._requireComponent;
            if (ReqComp && !this.getComponent(ReqComp)) {
                this.addComponent(ReqComp);
            }

            const component = new constructor();
            component.node = (this as unknown as Node); // TODO: HACK here
            this._components.push(component);
            if (CC_EDITOR && EditorExtends.Node && EditorExtends.Component) {
                const node = EditorExtends.Node.getNode(this._id);
                if (node) {
                    EditorExtends.Component.add(component._id, component);
                }
            }
            if ((component as any).onAddedToNode) {
                (component as any).onAddedToNode();
            }
            if (this._activeInHierarchy) {
                legacyCC.director._nodeActivator.activateComp(component);
            }

            return component;
        };

        BaseNode.prototype.removeComponent = function (component: any) {
            if (!component) {
                cc_errorID(3813);
                return;
            }
            let componentInstance: Component | null = null;
            if (component instanceof Component) {
                componentInstance = component;
            } else {
                componentInstance = this.getComponent(component);
            }
            if (componentInstance) {
                if ((componentInstance as any).onRemovedFromNode) {
                    (componentInstance as any).onRemovedFromNode();
                }
                componentInstance.destroy();
            }
        };
    }

    //---- 模块初始化
    export function init(rootNode: Node) {
        //hackEngine();

        uiRootNode = rootNode;
        uiCanvas = uiRootNode.parent?.getComponent(Canvas) as Canvas;
        uiCanvasTf = uiCanvas?.getComponent(UITransform) as UITransform;
        uiCamera = uiRootNode.parent?.getChildByName("Camera")?.getComponent(Camera) as Camera;
        cc_assert(uiCanvas);
        cc_assert(uiCanvasTf);
        cc_assert(uiCamera);
    }

    export function initAllInfos() {
        var gAllInfos: { [key: string]: object } = (window as any).gAllInfos = {};
        for (var n = 0; n < (window as any)._allJsonData.length; n++) {
            var data = (window as any)._allJsonData[n];
            for (var key in data) {
                gAllInfos[key] = data[key];
            }
        }
    }

    export function loadAllInfos(next: () => void) {
        if ((window as any)._allJsonData == null) {
            //cc_assert(CC_PREVIEW, "Only preview mode supported!!!");
            var partCount = 8;
            var taskDoneCount = 0;
            var taskAllCount = partCount;
            var allJsonData: object[] = (window as any)._allJsonData = [];
            for (let i = 1; i <= partCount; ++i) {
                ++_isLoadingRes;
                cc_resources.load(`data/AllData${i}`, JsonAsset, function (err: Error | null, asset: JsonAsset) {
                    --_isLoadingRes;
                    ++taskDoneCount;
                    cc_log(`[${taskDoneCount}/${taskAllCount}]AllData${i} done`);
                    allJsonData.push(asset.json as object);
                    if (taskDoneCount == taskAllCount) {
                        next();
                    }
                });
            }
        }
        else {
            next();
        }
    }
}
