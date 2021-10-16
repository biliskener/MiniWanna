// 界面的一些小的窗口部分, 可能被很多其它地方使用的

import { Node, Prefab, Vec2 } from "cc";
import { ResConfig } from "../config/ResConfig";
import { cc_assert, CC_DEBUG, cc_log, cc_v2, nox } from "../core/nox";
import { noxcc } from "../core/noxcc";
import { NoxResMgr } from "../mgr/NoxResMgr";

export class NoxWidget {
    private mResPath: string = "";
    protected mHierarchy: number = 0;

    private mPrefabLoading: boolean = false;        // 是否正在装载预制件
    private mInitWidgetIsDone: boolean = false;     // 是否界面初始化过
    private mIsOpened: boolean = false;             // 是否已经被打开
    private mIsDeactivated: boolean = false;        // 是否为非激活状态
    private mIsDestroyed: boolean = false;          // 是否已经被销毁, 也就是无效了
    private mTargetName: string = "";
    protected mTargetParent: Node | null = null;
    private mTargetPosition: Vec2 | null = null;
    protected mRoot: Node | null = null;
    private mAutoDestroyRoot: boolean = false;      // 是否自动销毁ROOT

    private mCompletedCountAssest: number = 0;      // 记录加载完成的数量
    private mTotalCountAssest: number = 0;          // 记录加载要完成的数量

    public constructor(resPath?: string) {
        let self = this;
        self.mHierarchy = 0;
        self.mResPath = resPath || "";
    }

    public setResPath(resPath: string): void {
        let self = this;
        self.mResPath = resPath;
    }

    public setPrefab(prefab: Prefab): void {
        this.takeRoot(noxcc.instantiate(prefab));
    }

    public takeRoot(root: Node) {
        this.setRoot(root, true);
    }

    public useRoot(root: Node) {
        this.setRoot(root, false);
    }

    private setRoot(root: Node, autoDestroyRoot: boolean): void {
        let self = this;
        CC_DEBUG && cc_assert(!self.mRoot && !self.mResPath, "cannot set root again");
        self.mRoot = root;
        self.mAutoDestroyRoot = autoDestroyRoot;
        if (self.mRoot) {
            self.onInitWidget();
            self.mInitWidgetIsDone = true;
        }
    }

    public loadPrefab(): void {
        let self = this;
        if (!self.mPrefabLoading) {
            self.mPrefabLoading = true;

            let resPath = nox.pathJoin(ResConfig.viewPath, self.mResPath);
            NoxResMgr.loadPrefabAsync(resPath, function (err: Error | null, prefab: Prefab) {
                cc_assert(prefab, "load root failed: " + resPath);
                self.mPrefabLoading = false;

                if (!self.mRoot && !self.mIsDestroyed) {
                    self.mRoot = noxcc.instantiate(prefab);
                    noxcc.setZOrder(self.mRoot, self.calcZOrder());

                    self.applyName();
                    self.applyParent();
                    self.applyPosition();

                    if (!self.mInitWidgetIsDone) {
                        self.onInitWidget();
                        self.mInitWidgetIsDone = true;
                    }

                    self.mRoot.active = self.mIsOpened;
                    if (self.mIsOpened) {
                        self.onEnter();
                    }
                }
            }, function (completedCount: number, totalCount: number, item: any) {
                self.mCompletedCountAssest = completedCount;
                self.mTotalCountAssest = totalCount;
                if (self.mTotalCountAssest != 0) {
                    cc_log(" load assest : " + self.mCompletedCountAssest + "/" + self.mTotalCountAssest);
                }
            });
        }
    }

    public getCompletedCountAssest() {
        return this.mCompletedCountAssest;
    }

    public getTotalCountAssest() {
        return this.mTotalCountAssest;
    }

    //获取当前view加载的进度， 如果场景有加载多个 view， 各个scene 应自行计算
    public getLoadingProcess(): number {
        if (this.mTotalCountAssest > 0) {
            let process = this.mCompletedCountAssest / this.mTotalCountAssest;
            if (process >= 1.0) {
                process = 1.0;
            }
            return process;
        }
        return 0;
    }


    public setName(targetName: string): void {
        let self = this;
        self.mTargetName = targetName;
        self.applyName();
    }

    public setParent(targetParent: Node): void {
        let self = this;
        self.mTargetParent = targetParent;
        self.applyParent();
    }

    private applyName(): void {
        let self = this;
        if (self.mRoot && self.mTargetName != null) {
            self.mRoot.name = self.mTargetName;
        }
    }

    private applyParent(): void {
        let self = this;
        if (self.mRoot) {
            noxcc.setParent(self.mRoot, self.mTargetParent);
        }
    }

    public setPosition(posOrX: Vec2 | number, posY?: number) {
        let self = this;
        self.mTargetPosition = (typeof (posOrX) == "object" ? posOrX : cc_v2(posOrX, posY));
        self.applyPosition();
    }

    private applyPosition(): void {
        let self = this;
        if (self.mRoot && self.mTargetPosition) {
            self.mRoot.setPosition(self.mTargetPosition.x, self.mTargetPosition.y);
        }
    }

    public show(targetParent?: Node): void {
        let self = this;

        CC_DEBUG && cc_assert(self.mTargetParent || targetParent, "need parent");

        if (targetParent) {
            self.setParent(targetParent);
        }

        if (!self.mIsOpened) {
            self.mIsOpened = true;
            if (self.mRoot) {
                if (!self.mInitWidgetIsDone) {
                    self.onInitWidget();
                    self.mInitWidgetIsDone = true;
                }
                self.mRoot.active = true;
                self.onEnter();
            }
            else {
                self.loadPrefab();
            }
        }
    }

    public hide(): void {
        let self = this;
        if (self.mIsOpened) {
            self.mIsOpened = false;
            if (self.mRoot) {
                self.mRoot.active = false;
                self.onExit();
            }
        }
    }

    public destroy(): void {
        this.hide();

        if (this.mRoot) {
            if (this.mInitWidgetIsDone) {
                this.onReleaseWidget();
                this.mInitWidgetIsDone = false;
            }
            if (this.mAutoDestroyRoot) {
                noxcc.destroy(this.mRoot);
            }
            this.mRoot = null;

            this.onRelease();
        }
    }

    public calcZOrder(): number {
        return this.mHierarchy;
    }

    public getRoot(): Node {
        return this.mRoot as any as Node;
    }

    public isOpened(): boolean {
        return this.mIsOpened;
    }

    public isActivated(): boolean {
        return !this.mIsDeactivated;
    }

    public isRunning(): boolean {
        return !!this.mRoot && this.mIsOpened && !this.mIsDeactivated;
    }

    onRelease(): void {
    }

    public onInitWidget(): void {
    }

    public onReleaseWidget(): void {
    }

    public onEnter(): void {
    }

    public onExit(): void {
    }

    //每帧调用(真正可见状态时)
    public onUpdate(dt: number): void {
    }
}
