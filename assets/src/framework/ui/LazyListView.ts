import { Layout, Node, Rect, ScrollView, Size, UIOpacity, UITransform, Vec2, Vec3 } from "cc";
import { cc_assert, CC_DEBUG, cc_rect, cc_v2 } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { noxScheduler } from "../core/noxScheduler";
import { BaseComponent } from "../base/BaseComponent";

export type ItemNode = Node;
export type ItemCreator<DATA> = (itemNode: Node, itemData: DATA, index?: number) => Node;

export class LazyListView<DATA> extends BaseComponent {
    protected mSizeMode: LazyListView.SizeMode = LazyListView.SizeMode.indetermined;        // 列表项大小模式

    protected mSetOrCreateItem: ItemCreator<DATA> = null as any as ItemCreator<DATA>;       // 列表项创建器
    protected mUsingItemList: Node[] = [];                                                  // 正在使用的列表项
    protected mCachedItemList: Node[] = [];                                                 // 缓存的列表项
    protected mBindingData: DATA[] = [];                                                    // 绑定的数据
    protected mKeepCount: number = 0;                                                       // 保留的项数
    protected mCacheCount: number = 0;                                                      // 缓存的项数
    protected mTargetScrollView: ScrollView = null as any as ScrollView;                    // 列表视图
    protected mTargetLayout: Layout = null as any as Layout;                                // 列表项容器
    protected mTargetContainer: Node = null as any as Node;                                 // 列表项容器
    protected mCellSize: Size | ((itemData: DATA | null) => Size) = null as any as Size;    // 列表项大小或者函数

    protected mLastPosition: Vec3 = null as any as Vec3;                    // 上一次滚动视图位置
    protected mIndexOffset: number = -1;                                    // 第一项的索引偏移

    protected mScheduleTimerID: noxScheduler.TimerID | null = null;         // 调度器

    public config(scrollView?: ScrollView, container?: Node, sizeMode?: LazyListView.SizeMode): void {
        this.mSizeMode = sizeMode || LazyListView.SizeMode.indetermined;

        this.mTargetScrollView = scrollView || this.node.getComponent(ScrollView) as ScrollView;
        cc_assert(this.mTargetScrollView, "fatal error");
        this.mTargetContainer = container || noxcc.findNode("view/content", this.mTargetScrollView.node);
        cc_assert(this.mTargetContainer, "fatal error");
        this.mTargetLayout = this.mTargetContainer.getComponent(Layout) as Layout;
        cc_assert(this.mTargetLayout, "fatal error");

        for (var i = 0; i < this.mCachedItemList.length; ++i) {
            this.mCachedItemList[i].destroy();
        }
        this.mCachedItemList = [];

        this.mTargetContainer.removeAllChildren();

        if (this.mSizeMode == LazyListView.SizeMode.identical) {
            this.mTargetLayout.enabled = false;
            this.mLastPosition = this.mTargetContainer.getPosition();
        }
        else {
            this.mTargetLayout.enabled = true;
        }

        this.mTargetScrollView.node.on("scrolling", () => {
            this.onScrolling();
        }, this);
    }

    public bindData(data: DATA[], setOrCreateItem: (itemNode: Node, itemData: DATA) => Node, cellSize?: Size | ((itemData: DATA | null) => Size), keepCount?: number, cacheCount?: number) {
        if (cacheCount != null) {
            this.mCacheCount = cacheCount;
        }
        if (keepCount != null) {
            this.mKeepCount = keepCount;
        }
        if (setOrCreateItem) {
            this.mSetOrCreateItem = setOrCreateItem;
        }
        if (cellSize) {
            this.mCellSize = cellSize;
        }
        cc_assert(this.mCellSize, "fatal error");

        this.removeAllItems();
        this.mBindingData = data || [];
        switch (this.mSizeMode) {
            case LazyListView.SizeMode.indetermined: {
                for (var i = 0; i < this.mKeepCount + this.mCacheCount && i < this.mBindingData.length; ++i) {
                    var itemData = this.mBindingData[i];
                    var itemNode = this.createItemNode(null, itemData, i);
                    this.mTargetContainer.addChild(itemNode);
                }
                this.checkAllItems();
                break;
            }
            case LazyListView.SizeMode.different: {
                for (var i = 0; i < this.mBindingData.length; ++i) {
                    var itemData = this.mBindingData[i];
                    var blankNode = this.createBlankNode(itemData);
                    this.mTargetContainer.addChild(blankNode);
                }
                (this.mTargetContainer.getComponent(Layout) as Layout).updateLayout();
                this.checkAllItems();
                break;
            }
            case LazyListView.SizeMode.identical: {
                this.updateContentSize();
                this.mTargetScrollView.scrollToTopLeft();
                this.checkAllItems();
                break;
            }
            default: {
                cc_assert(false, "not supported");
                break;
            }
        }
    }

    public isAtBegin(): boolean {
        var offset = this.mTargetScrollView.getScrollOffset();
        if (this.mTargetScrollView.vertical) {
            return offset.y <= this.mTargetLayout.paddingTop;
        }
        else {
            return offset.x <= this.mTargetLayout.paddingLeft;
        }
    }

    public isAtEnd(): boolean {
        var offset = this.mTargetScrollView.getScrollOffset();
        if (this.mTargetScrollView.vertical) {
            return offset.y >= noxcc.h(this.mTargetContainer) - this.mTargetLayout.paddingBottom - noxcc.h(this.mTargetScrollView.node);
        }
        else {
            return offset.x >= noxcc.w(this.mTargetContainer) - this.mTargetLayout.paddingRight - noxcc.w(this.mTargetScrollView.node);
        }
    }

    public jumpToBegin(): void {
        this.mTargetScrollView.scrollToTopLeft();
    }

    public jumpToEnd(): void {
        this.mTargetScrollView.scrollToBottomRight();
    }

    public getIndexOffset(): number {
        return this.mIndexOffset;
    }

    public getItemData(index: number): DATA {
        return this.mBindingData[index];
    }

    public getLoadedItems(): ItemNode[] {
        return this.mUsingItemList.slice();
    }

    public getItemNode(index: number): Node {
        switch (this.mSizeMode) {
            case LazyListView.SizeMode.indetermined:
                return this.mTargetContainer.children[index] as Node;
                break;
            case LazyListView.SizeMode.different:
                var child = this.mTargetContainer.children[index];
                return child && child.children[0] as Node;
                break;
            case LazyListView.SizeMode.identical:
                return this.mTargetContainer.children[index] as Node;
                break;
            default:
                cc_assert(false, "not supported");
                return null as any as Node;
        }
    }

    public pushFrontItems(data: DATA[], isScrolling: boolean): void {
        if (!data || !data.length) return;
        this.mBindingData = this.mBindingData || [];

        var sizeChanged = 0;
        for (var i = data.length - 1; i >= 0; --i) {
            var itemData = data[i];
            this.mBindingData.unshift(itemData);

            switch (this.mSizeMode) {
                case LazyListView.SizeMode.indetermined: {
                    var itemNode = this.createItemNode(null, itemData, i);
                    this.mTargetContainer.insertChild(itemNode, 0);
                    this.mUsingItemList.unshift(itemNode);

                    if (this.mTargetScrollView.vertical) {
                        if (i != 0) {
                            sizeChanged += this.mTargetLayout.spacingY;
                        }
                        sizeChanged += noxcc.h(itemNode);
                    }
                    else {
                        if (i != 0) {
                            sizeChanged += this.mTargetLayout.spacingX;
                        }
                        sizeChanged += noxcc.w(itemNode);
                    }
                    break;
                }
                case LazyListView.SizeMode.different: {
                    var blankNode = this.createBlankNode(itemData);
                    this.mTargetContainer.insertChild(blankNode, 0);
                    this.mIndexOffset++;

                    if (this.mTargetScrollView.vertical) {
                        if (i != 0) {
                            sizeChanged += this.mTargetLayout.spacingY;
                        }
                        sizeChanged += noxcc.h(blankNode);
                    }
                    else {
                        if (i != 0) {
                            sizeChanged += this.mTargetLayout.spacingX;
                        }
                        sizeChanged += noxcc.w(blankNode);
                    }
                    break;
                }
                case LazyListView.SizeMode.identical: {
                    this.mIndexOffset++;

                    if (this.mTargetScrollView.vertical) {
                        if (i != 0) {
                            sizeChanged += this.mTargetLayout.spacingY;
                        }
                        sizeChanged += this.calcCellSize(itemData).height;
                    }
                    else {
                        if (i != 0) {
                            sizeChanged += this.mTargetLayout.spacingX;
                        }
                        sizeChanged += this.calcCellSize(itemData).width;
                    }
                    break;
                }
                default: {
                    cc_assert(false, "not supported");
                    break;
                }
            }
        }

        if (this.mSizeMode == LazyListView.SizeMode.identical) {
            this.updateContentSize();
            for (var i = 0; i < this.mUsingItemList.length; ++i) {
                var itemNode = this.mUsingItemList[i];
                let position = this.calcItemPosition(itemNode, i + this.mIndexOffset);
                itemNode.setPosition(position.x, position.y);
            }
        }
        else {
            this.mTargetLayout.updateLayout();
        }

        if (isScrolling) {
            var scrollOffset = this.mTargetScrollView.getScrollOffset();
            if (this.mTargetScrollView.vertical && !this.mTargetScrollView.horizontal) {
                scrollOffset.y = Math.max(0, Math.min(noxcc.h(this.mTargetContainer) - noxcc.h(this.mTargetScrollView.node), scrollOffset.y + sizeChanged));
                this.mTargetScrollView.scrollToOffset(scrollOffset);
            }
            else if (this.mTargetScrollView.horizontal && !this.mTargetScrollView.vertical) {
                scrollOffset.x = Math.max(0, Math.min(noxcc.w(this.mTargetContainer) - noxcc.w(this.mTargetScrollView.node), scrollOffset.x + sizeChanged));
                this.mTargetScrollView.scrollToOffset(scrollOffset);
            }
            else {
                cc_assert(false, "not supported");
            }
        }

        this.checkAllItems();
    }

    public removeAllItems(): void {
        switch (this.mSizeMode) {
            case LazyListView.SizeMode.indetermined: {
                var children = this.mTargetContainer.children;
                for (let i = children.length - 1; i >= 0; i--) {
                    var itemNode = children[i];
                    noxcc.setParent(itemNode, null);
                    this.mCachedItemList.push(itemNode);
                }
                break;
            }
            case LazyListView.SizeMode.different: {
                var children = this.mTargetContainer.children;
                for (let i = children.length - 1; i >= 0; i--) {
                    var child = children[i];
                    var itemNode = child.children[0];
                    if (itemNode) {
                        noxcc.setParent(itemNode, null);
                        this.mCachedItemList.push(itemNode);
                    }
                }
                break;
            }
            case LazyListView.SizeMode.identical: {
                var children = this.mTargetContainer.children;
                for (let i = children.length - 1; i >= 0; i--) {
                    var itemNode = children[i];
                    noxcc.setParent(itemNode, null);
                    this.mCachedItemList.push(itemNode);
                }
                break;
            }
            default: {
                cc_assert(false, "not supported");
                break;
            }
        }

        this.mTargetContainer.removeAllChildren();
        this.mBindingData = [];
        this.mUsingItemList = [];
        this.mIndexOffset = 0;
    }

    public clearCachedItems(): void {
        for (var i = 0; i < this.mCachedItemList.length; ++i) {
            this.mCachedItemList[i].destroy();
        }
        this.mCachedItemList = [];
    }

    private calcCellSize(itemData: DATA | null): Size {
        return typeof (this.mCellSize) == "function" ? this.mCellSize(itemData) : this.mCellSize;
    }

    private getScreenRectOfNode(node: Node, extraWidth?: number, extraHeight?: number): Rect {
        var worldPos = noxcc.localToScreen(node, Vec2.ZERO);
        extraWidth = extraWidth || 0;
        extraHeight = extraHeight || 0;
        var tf = noxcc.getOrAddComponent(node, UITransform);
        var worldRect = cc_rect(
            worldPos.x - tf.width * tf.anchorX - extraWidth,
            worldPos.y - tf.height * tf.anchorY - extraHeight,
            tf.width + extraWidth * 2,
            tf.height + extraHeight * 2,
        );
        return worldRect;
    }

    private checkAllItems(): void {
        if (!this.mTargetScrollView) return;

        let viewRect = this.getScreenRectOfNode(this.mTargetScrollView.node, 0, 0);
        switch (this.mSizeMode) {

            case LazyListView.SizeMode.indetermined: {
                let children = this.mTargetContainer.children;
                for (let i = 0; i < children.length; ++i) {
                    let itemData = this.mBindingData[i];
                    var itemNode = children[i];
                    var itemRect = this.getScreenRectOfNode(itemNode);
                    if (itemRect.intersects(viewRect)) {
                        noxcc.getOrAddComponent(itemNode, UIOpacity).opacity = 255;
                    }
                    else {
                        noxcc.getOrAddComponent(itemNode, UIOpacity).opacity = 0;
                    }
                }
                break;
            }

            case LazyListView.SizeMode.different: {
                this.mIndexOffset = 0;
                this.mUsingItemList = [];
                let indexOffset = null;
                let children = this.mTargetContainer.children;
                for (let i = 0; i < children.length; ++i) {
                    let itemData = this.mBindingData[i];
                    let blankNode = children[i];
                    let itemNode = blankNode.children[0];

                    let blankNodeRect = this.getScreenRectOfNode(blankNode);
                    if (blankNodeRect.intersects(viewRect)) {
                        if (!itemNode) {
                            itemNode = this.createItemNode(itemNode, itemData, i);
                            noxcc.addChildToCenter(blankNode, itemNode);
                            (blankNode.getComponent(Layout) as Layout).enabled = true;
                        }
                        if (indexOffset == null) {
                            this.mIndexOffset = indexOffset = i;
                        }
                        this.mUsingItemList.push(itemNode);
                    }
                    else {
                        if (itemNode) {
                            (blankNode.getComponent(Layout) as Layout).enabled = false;
                            noxcc.setParent(itemNode, null);
                            this.mCachedItemList.push(itemNode);
                        }
                    }
                }

                while (this.mUsingItemList.length + this.mCachedItemList.length > this.mKeepCount + this.mCacheCount) {
                    let itemNode = this.mCachedItemList.pop() as Node;
                    itemNode.destroy();
                }

                break;
            }

            case LazyListView.SizeMode.identical: {
                this.createEnoughItems();
                this.checkDirection(-1);
                this.checkDirection(1);
                break;
            }
            default: {
                cc_assert(false, "not supported");
                break;
            }
        }
    }

    private createEnoughItems(): void {
        if (this.mUsingItemList.length < this.mBindingData.length && this.mUsingItemList.length < this.mKeepCount + this.mCacheCount) {
            for (var i = this.mIndexOffset - 1; i >= 0; --i) {
                if (this.mUsingItemList.length < this.mBindingData.length && this.mUsingItemList.length < this.mKeepCount + this.mCacheCount) {
                    var itemData = this.mBindingData[i];
                    var itemNode = this.createItemNode(null, itemData, i);
                    var position = this.calcItemPosition(itemNode, i);
                    itemNode.setPosition(position.x, position.y);
                    this.mTargetContainer.insertChild(itemNode, 0);
                    this.mUsingItemList.unshift(itemNode);
                    this.mIndexOffset--;
                    CC_DEBUG && cc_assert(this.mIndexOffset >= 0, "fatal error");
                }
                else {
                    break;
                }
            }
            for (var i = this.mIndexOffset + this.mUsingItemList.length; i < this.mBindingData.length; ++i) {
                if (this.mUsingItemList.length < this.mBindingData.length && this.mUsingItemList.length < this.mKeepCount + this.mCacheCount) {
                    var itemData = this.mBindingData[i];
                    var itemNode = this.createItemNode(null, itemData, i);
                    var position = this.calcItemPosition(itemNode, i);
                    itemNode.setPosition(position.x, position.y);
                    this.mTargetContainer.addChild(itemNode);
                    this.mUsingItemList.push(itemNode);
                }
                else {
                    break;
                }
            }
        }
    }

    private updateContentSize(): void {
        if (this.mTargetScrollView.vertical && !this.mTargetScrollView.horizontal) {
            var cellHeight = this.calcCellSize(null).height;
            var marginTop = this.mTargetLayout.paddingTop;
            var marginBottom = this.mTargetLayout.paddingBottom;
            var spacingY = this.mTargetLayout.spacingY;
            noxcc.setHeight(this.mTargetContainer, this.calcFullHeight());
            let height = noxcc.h(this.mTargetScrollView.node);
            this.mKeepCount = Math.max(this.mKeepCount, 3 + Math.ceil(height / (cellHeight + spacingY)));
        }
        else if (this.mTargetScrollView.horizontal && !this.mTargetScrollView.vertical) {
            var cellWidth = this.calcCellSize(null).width;
            var marginLeft = this.mTargetLayout.paddingLeft;
            var marginRight = this.mTargetLayout.paddingRight;
            var spacingX = this.mTargetLayout.spacingX;
            noxcc.setWidth(this.mTargetContainer, this.calcFullWidth());
            let width = noxcc.w(this.mTargetScrollView.node);
            this.mKeepCount = Math.max(this.mKeepCount, 3 + Math.ceil(width / (cellWidth + spacingX)));
        }
        else {
            cc_assert(false, "not supported");
        }
    }

    private checkDirection(direction: number): void {
        if (this.mBindingData.length > 0) {
            let firstVisibleIndex = this.calcFirstVisibleItemIndex();
            let lastVisibleIndex = this.calcLastVisibleItemIndex();
            while (true) {
                let itemIndex = direction > 0 ? this.mIndexOffset + this.mUsingItemList.length : this.mIndexOffset - 1;
                if (itemIndex < 0 || itemIndex >= this.mBindingData.length) {
                    break;
                }

                if (direction > 0 && itemIndex > lastVisibleIndex || direction < 0 && itemIndex < firstVisibleIndex) {
                    break;
                }

                let itemData = this.mBindingData[itemIndex];
                let itemNode: Node = null as any as Node;

                if (this.mUsingItemList.length > 0) {
                    let swapNodeIndex = direction > 0 ? 0 : this.mUsingItemList.length - 1;
                    let swapItemIndex = swapNodeIndex + this.mIndexOffset;
                    if (swapItemIndex < firstVisibleIndex || swapItemIndex > lastVisibleIndex) {
                        itemNode = this.mUsingItemList[swapNodeIndex];
                        this.mUsingItemList.splice(swapNodeIndex, 1);
                        if (direction > 0) {
                            this.mIndexOffset++;
                        }
                    }
                    else {
                        console.log("out of visible area");
                    }
                }

                itemNode = this.createItemNode(itemNode, itemData, itemIndex);
                var position = this.calcItemPosition(itemNode, itemIndex);
                itemNode.setPosition(position.x, position.y);

                if (direction > 0) {
                    this.mUsingItemList.push(itemNode);
                }
                else {
                    this.mUsingItemList.unshift(itemNode);
                    this.mIndexOffset--;
                    CC_DEBUG && cc_assert(this.mIndexOffset >= 0, "fatal error");
                }
                noxcc.setParent(itemNode, this.mTargetContainer);
            }
        }
    }

    private calcItemPosition(itemNode: Node, index: number): Vec2 {
        let cellSize = this.calcCellSize(null);
        let marginLeft = this.mTargetLayout.paddingLeft;
        let marginTop = this.mTargetLayout.paddingTop;
        let marginBottom = this.mTargetLayout.paddingBottom;
        let pos: Vec2 = cc_v2(0, 0);

        if (this.mTargetScrollView.vertical && !this.mTargetScrollView.horizontal) {
            let spacingY = this.mTargetLayout.spacingY;
            pos.x = marginLeft;
            pos.y = marginTop + (noxcc.h(itemNode) + spacingY) * (index + 1) - spacingY;
            pos.y = this.calcFullHeight() - pos.y;
        }
        else if (this.mTargetScrollView.horizontal && !this.mTargetScrollView.vertical) {
            let spacingX = this.mTargetLayout.spacingX;
            pos.x = marginLeft + (noxcc.w(itemNode) + spacingX) * index;
            pos.y = marginBottom;
        }
        else {
            cc_assert(false, "not supported");
        }

        // 转换到锚点坐标
        pos.x -= noxcc.w(this.mTargetContainer) * noxcc.ax(this.mTargetContainer);
        pos.x += noxcc.w(itemNode) * noxcc.ax(itemNode);
        pos.y -= noxcc.h(this.mTargetContainer) * noxcc.ay(this.mTargetContainer);
        pos.y += noxcc.h(itemNode) * noxcc.ay(itemNode);

        return pos;
    }

    private calcFullWidth(): number {
        var cellWidth = this.calcCellSize(null).width;
        var marginLeft = this.mTargetLayout.paddingLeft;
        var marginRight = this.mTargetLayout.paddingRight;
        var spacingX = this.mTargetLayout.spacingX;
        return Math.max(noxcc.w(this.mTargetScrollView.node), this.mBindingData.length * (cellWidth + spacingX) - spacingX + marginLeft + marginRight);
    }

    private calcFullHeight(): number {
        var cellHeight = this.calcCellSize(null).height;
        var marginTop = this.mTargetLayout.paddingTop;
        var marginBottom = this.mTargetLayout.paddingBottom;
        var spacingY = this.mTargetLayout.spacingY;
        return Math.max(noxcc.h(this.mTargetScrollView.node), this.mBindingData.length * (cellHeight + spacingY) - spacingY + marginTop + marginBottom);
    }

    private calcFirstVisibleItemIndex(): number {
        if (this.mTargetScrollView.vertical) {
            var offsetY = this.mTargetScrollView.getScrollOffset().y;
            var marginTop = this.mTargetLayout.paddingTop;
            var spacingY = this.mTargetLayout.spacingY;
            var itemHeight = this.calcCellSize(null).height;
            return Math.max(0, Math.floor((offsetY - marginTop + spacingY) / (itemHeight + spacingY)));
        }
        else {
            var offsetX = this.mTargetScrollView.getScrollOffset().x;
            var marginLeft = this.mTargetLayout.paddingLeft;
            var spacingX = this.mTargetLayout.spacingX;
            var itemWidth = this.calcCellSize(null).width;
            return Math.max(0, Math.floor((offsetX - marginLeft + spacingX) / (itemWidth + spacingX)));
        }
    }

    private calcLastVisibleItemIndex(): number {
        if (this.mTargetScrollView.vertical) {
            var offsetY = this.mTargetScrollView.getScrollOffset().y;
            var marginTop = this.mTargetLayout.paddingTop;
            var spacingY = this.mTargetLayout.spacingY;
            var itemHeight = this.calcCellSize(null).height;
            var viewHeight = noxcc.h(this.mTargetScrollView.node);
            return Math.max(0, Math.ceil((viewHeight + offsetY - marginTop + spacingY + viewHeight) / (itemHeight + spacingY)));
        }
        else {
            var offsetX = this.mTargetScrollView.getScrollOffset().x;
            var marginLeft = this.mTargetLayout.paddingLeft;
            var spacingX = this.mTargetLayout.spacingX;
            var itemWidth = this.calcCellSize(null).width;
            var viewWidth = noxcc.w(this.mTargetScrollView.node);
            return Math.max(0, Math.ceil((viewWidth + offsetX - marginLeft + spacingX) / (itemWidth + spacingX)));
        }
    }

    private calcVisibleItemCount(): number {
        return 1 + (this.calcLastVisibleItemIndex() - this.calcFirstVisibleItemIndex());
    }

    private createBlankNode(itemData: DATA): Node {
        var blankNode = noxcc.createNode(this.calcCellSize(itemData));
        var layout = blankNode.addComponent(Layout);
        layout.enabled = false;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        if (this.mTargetScrollView.vertical && !this.mTargetScrollView.horizontal) {
            layout.type = Layout.Type.VERTICAL;
            layout.paddingTop = layout.paddingBottom = layout.spacingY = 0;
        }
        else if (this.mTargetScrollView.horizontal && !this.mTargetScrollView.vertical) {
            layout.type = Layout.Type.HORIZONTAL;
            layout.paddingLeft = layout.paddingRight = layout.spacingX = 0;
        }
        else {
            cc_assert(false, "not supported");
        }
        return blankNode;
    }

    private createItemNode(itemNode: ItemNode | null, itemData: DATA, index: number): ItemNode {
        if (itemNode == null && this.mCachedItemList.length > 0) {
            itemNode = this.mCachedItemList.pop() || null;
        }
        return this.createItemNodeEx(itemNode as ItemNode, itemData, index);
    }

    private createItemNodeEx(itemNode: ItemNode, itemData: DATA, index: number): ItemNode {
        return this.mSetOrCreateItem(itemNode, itemData, index);
    }

    protected onLoad(): void {
        super.onLoad();
    }

    protected onEnable(): void {
        super.onEnable();
        this.checkAllItems();
        this.mScheduleTimerID = noxScheduler.scheduleInterval(this.onTimer.bind(this), 0.1);
    }

    protected onDisable(): void {
        noxScheduler.unscheduleInterval(this.mScheduleTimerID as noxScheduler.TimerID);
        this.mScheduleTimerID = null;
        super.onDisable();
    }

    protected onScrolling(): void {
        switch (this.mSizeMode) {
            case LazyListView.SizeMode.indetermined:
                this.checkAllItems();
                break;
            case LazyListView.SizeMode.different:
                this.checkAllItems();
                break;
            case LazyListView.SizeMode.identical: {
                this.checkAllItems();
                break;
            }
        }
    }

    protected onTimer(dt: number): void {
        // 创建缓存项
        if (this.mBindingData.length > 0 && this.mSetOrCreateItem) {
            switch (this.mSizeMode) {
                case LazyListView.SizeMode.indetermined: {
                    var count = 0;
                    if (this.mTargetContainer.children.length < this.mBindingData.length) {
                        for (var i = 0; i < this.mBindingData.length && count < 1; ++i) {
                            var itemData = this.mBindingData[i];
                            var itemNode = this.mTargetContainer.children[i];
                            if (!itemNode) {
                                itemNode = this.createItemNode(null, itemData, i);
                                this.mTargetContainer.insertChild(itemNode, i);
                                ++count;
                            }
                        }
                    }
                    if (count > 0) {
                        this.checkAllItems();
                    }
                    break;
                }
                case LazyListView.SizeMode.different: {
                    if (this.mUsingItemList.length + this.mCachedItemList.length < this.mKeepCount + this.mCacheCount) {
                        var itemNode = this.createItemNodeEx(null as any as ItemNode, this.mBindingData[0], 0);
                        this.mCachedItemList.push(itemNode);
                    }
                    break;
                }
                case LazyListView.SizeMode.identical: {
                    if (this.mUsingItemList.length + this.mCachedItemList.length < this.mKeepCount + this.mCacheCount) {
                        var itemNode = this.mSetOrCreateItem(null as any as ItemNode, this.mBindingData[0], 0);
                        this.mCachedItemList.push(itemNode);
                    }
                    break;
                }
            }
        }
    }

    protected onCleanup(): void {
        this.clearCachedItems();
        super.onCleanup();
    }
}

export module LazyListView {
    export enum SizeMode {
        indetermined = 0,   // 大小不可预知，或者至少获得大小的代价较耗时
        different = 1,      // 大小可预知，但各个列表项不一样
        identical = 2,      // 大小可预知，并且名个列表项大小都一样
    }
}
