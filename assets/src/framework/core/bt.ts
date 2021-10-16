import { cc_assert, CC_DEBUG } from "./nox";

export module bt {
    // 完整代码在https://segmentfault.com/a/1190000012397660
    export enum BehaviorStatus {
        invalid = -1,
        success = 0,
        failure = 1,
        running = 2,
        aborted = 3,
    }

    type BehaviorObserver = (result: BehaviorStatus) => void;

    export class Behavior {
        private mStatus: BehaviorStatus = BehaviorStatus.invalid;
        private mObserver: BehaviorObserver | null = null;
        protected mBehaviorTree: BehaviorTree;

        public constructor(behaviorTree: BehaviorTree) {
            this.mBehaviorTree = behaviorTree;
        }

        public onInitialize(): void {
        }

        protected onUpdate(dt: number): BehaviorStatus {
            return BehaviorStatus.invalid;
        }

        public onTerminate(statuds: BehaviorStatus): void {
        }

        public onRelease(): void {
        }

        public tick(dt: number): BehaviorStatus {
            if (this.mStatus != BehaviorStatus.running) {
                this.onInitialize();
            }

            this.mStatus = this.onUpdate(dt);

            if (this.mStatus != BehaviorStatus.running) {
                this.onTerminate(this.mStatus);
            }

            return this.mStatus;
        }

        public addChild(child: Behavior) {
            CC_DEBUG && cc_assert(false, "fatal error");
        }

        public reset(): void {
            this.mStatus = BehaviorStatus.invalid;
        }

        public abort(): void {
            this.onTerminate(BehaviorStatus.aborted);
            this.mStatus = BehaviorStatus.aborted;
        }

        public isTerminated(): boolean {
            return this.mStatus == BehaviorStatus.success || this.mStatus == BehaviorStatus.failure;
        }

        public isRunning(): boolean {
            return this.mStatus == BehaviorStatus.running;
        }

        public isFailure(): boolean {
            return this.mStatus == BehaviorStatus.failure;
        }

        public getStatus(): BehaviorStatus {
            return this.mStatus;
        }

        public setStatus(status: BehaviorStatus) {
            this.mStatus = status;
        }

        public setObserver(observer: BehaviorObserver): void {
            this.mObserver = observer;
        }

        public getObserver(): BehaviorObserver | null {
            return this.mObserver;
        }
    }

    export class Action extends Behavior {
        public constructor(behaviorTree: BehaviorTree) {
            super(behaviorTree);
        }
    }

    export class Condition extends Behavior {
        private mIsNegation: boolean;

        public constructor(behaviorTree: BehaviorTree, isNegation: boolean) {
            super(behaviorTree);
            this.mIsNegation = isNegation;
        }
    }

    export class Decorator extends Behavior {
        protected mChild: Behavior;

        public constructor(behaviorTree: BehaviorTree, child: Behavior) {
            super(behaviorTree);
            this.mChild = child;
        }

        public onRelease(): void {
            this.mChild.onRelease();
            super.onRelease();
        }
    }

    export class Repeat extends Decorator {
        protected mLimitCount: number | null = null;
        protected mCurrentCount: number = 0;

        protected constructor(behaviorTree: BehaviorTree, child?: Behavior, count?: number) {
            super(behaviorTree, child as Behavior);
            this.mLimitCount = count ?? null;
            this.mCurrentCount = 0;
        }

        public setCount(count: number): void {
            this.mLimitCount = count;
        }

        public onInitialize(): void {
            this.mCurrentCount = 0;
        }

        protected onUpdate(dt: number): BehaviorStatus {
            while (true) {
                this.mChild.tick(dt);
                if (this.mChild.getStatus() == BehaviorStatus.running) break;
                if (this.mChild.getStatus() == BehaviorStatus.failure) return BehaviorStatus.failure;
                if (++this.mCurrentCount == this.mLimitCount) return BehaviorStatus.success;
                this.mChild.reset();
            }
            return BehaviorStatus.invalid;
        }

        public static create(behaviorTree: BehaviorTree, count: number): Repeat {
            return new Repeat(behaviorTree, null as any as Behavior, count);
        }
    }

    export type Behaviors = Behavior[];

    export class Composite extends Behavior {
        protected mChildren: Behavior[] = [];

        public addChild(child: Behavior) {
            this.mChildren.push(child);
        }

        public removeChild(child: Behavior): void {
            this.mChildren.splice(this.mChildren.indexOf(child), 1);
        }

        public clearChildren(): void {
            for (var i = 0; i < this.mChildren.length; ++i) {
                this.mChildren[i].onRelease();
            }
            this.mChildren = [];
        }

        public onRelease(): void {
            for (var i = 0; i < this.mChildren.length; ++i) {
                this.mChildren[i].onRelease();
            }
            super.onRelease();
        }
    }

    export class Sequence extends Composite {
        protected mCurrentIndex: number = 0;

        protected constructor(behaviorTree: BehaviorTree) {
            super(behaviorTree);
        }

        public onInitialize(): void {
            this.mCurrentIndex = 0;

            if (this.mBehaviorTree) {
                var child = this.mChildren[this.mCurrentIndex];
                this.mBehaviorTree.start(child, () => {
                    this.onChildComplete();
                });
            }
            else {
            }
        }

        protected onUpdate(dt: number): BehaviorStatus {
            if (this.mBehaviorTree) {
                return BehaviorStatus.running;
            }
            else {
                while (true) {
                    let s: BehaviorStatus = this.mChildren[this.mCurrentIndex].tick(dt);
                    if (s != BehaviorStatus.success) {
                        return s;
                    }

                    if (++this.mCurrentIndex >= this.mChildren.length) {
                        return BehaviorStatus.success;
                    }
                }

                CC_DEBUG && cc_assert(false, "impossible");
                return BehaviorStatus.invalid;
            }
        }

        protected onChildComplete(): void {
            var child = this.mChildren[this.mCurrentIndex];

            if (child.getStatus() == BehaviorStatus.failure) {
                this.mBehaviorTree.stop(this, BehaviorStatus.failure);
                return;
            }

            CC_DEBUG && cc_assert(this.getStatus() == BehaviorStatus.success, "fatal error");
            if (++this.mCurrentIndex >= this.mChildren.length) {
                this.mBehaviorTree.stop(this, BehaviorStatus.success);
            }
            else {
                var child = this.mChildren[this.mCurrentIndex];
                this.mBehaviorTree.start(child, () => {
                    this.onChildComplete();
                });
            }
        }

        public static create(behaviorTree: BehaviorTree): Sequence {
            return new Sequence(behaviorTree);
        }
    }

    export class Selector extends Composite {
        protected mCurrentIndex: number = 0;

        protected constructor(behaviorTree: BehaviorTree) {
            super(behaviorTree);
        }

        public onInitialize(): void {
            this.mCurrentIndex = 0;
        }

        protected onUpdate(dt: number): BehaviorStatus {
            while (true) {
                let s: BehaviorStatus = this.mChildren[this.mCurrentIndex].tick(dt);
                if (s != BehaviorStatus.failure) {
                    return s;
                }

                if (++this.mCurrentIndex >= this.mChildren.length) {
                    return BehaviorStatus.failure;
                }
            }

            cc_assert(false, "impossible");
            return BehaviorStatus.invalid;
        }

        public static create(behaviorTree: BehaviorTree): Selector {
            return new Selector(behaviorTree);
        }
    }

    export enum Policy {
        RequireOne = 0,
        RequireAll = 1,
    }

    export class Parallel extends Composite {
        protected mSuccessPolicy: Policy;
        protected mFailurePolicy: Policy;

        protected constructor(behaviorTree: BehaviorTree, successPolicy: Policy, failurePolicy: Policy) {
            super(behaviorTree);
            this.mSuccessPolicy = successPolicy;
            this.mFailurePolicy = failurePolicy;
        }

        protected onUpdate(dt: number): BehaviorStatus {
            let iSuccessCount: number = 0;
            let iFailureCount: number = 0;
            for (let it = 0; it < this.mChildren.length; ++it) {
                let child: Behavior = this.mChildren[it];
                if (!child.isTerminated()) {
                    child.tick(dt);
                }

                if (child.getStatus() == BehaviorStatus.success) {
                    ++iSuccessCount;
                    if (this.mSuccessPolicy == Policy.RequireOne) {
                        return BehaviorStatus.success;
                    }
                }

                if (child.getStatus() == BehaviorStatus.failure) {
                    ++iFailureCount;
                    if (this.mFailurePolicy == Policy.RequireOne) {
                        return BehaviorStatus.failure;
                    }
                }
            }

            if (this.mFailurePolicy == Policy.RequireAll && iFailureCount == this.mChildren.length) {
                return BehaviorStatus.failure;
            }

            if (this.mSuccessPolicy == Policy.RequireAll && iSuccessCount == this.mChildren.length) {
                return BehaviorStatus.success;
            }

            return BehaviorStatus.running;
        }

        public onTerminate(status: BehaviorStatus): void {
            for (let it = 0; it < this.mChildren.length; ++it) {
                let b: Behavior = this.mChildren[it];
                if (b.isRunning()) {
                    b.abort();
                }
            }
        }

        public static create(behaviorTree: BehaviorTree, successPolicy: Policy, failurePolicy: Policy): Parallel {
            return new Parallel(behaviorTree, successPolicy, failurePolicy);
        }
    }

    export class ActiveSelector extends Selector {
        protected constructor(behaviorTree: BehaviorTree) {
            super(behaviorTree);
        }

        public onInitialize(): void {
            this.mCurrentIndex = this.mChildren.length;
        }

        protected onUpdate(dt: number): BehaviorStatus {
            let previous: number = this.mCurrentIndex;
            super.onInitialize();
            let status: BehaviorStatus = super.onUpdate(dt);
            if (previous != this.mChildren.length && this.mCurrentIndex != previous) {
                this.mChildren[previous].onTerminate(BehaviorStatus.aborted);
            }
            return status;
        }

        public static create(behaviorTree: BehaviorTree): ActiveSelector {
            return new ActiveSelector(behaviorTree);
        }
    }

    export class Filter extends Sequence {
        protected constructor(behaviorTree: BehaviorTree) {
            super(behaviorTree);
        }

        public addCondition(condition: Behavior): void {
            this.mChildren.unshift(condition);
        }

        public addAction(action: Behavior): void {
            this.mChildren.push(action);
        }

        public static create(behaviorTree: BehaviorTree): Filter {
            return new Filter(behaviorTree);
        }
    }

    export class Monitor extends Parallel {
        protected constructor(behaviorTree: BehaviorTree, successPolicy: Policy, failurePolicy: Policy) {
            super(behaviorTree, successPolicy, failurePolicy);
        }

        public addCondition(condition: Behavior): void {
            this.mChildren.unshift(condition);
        }

        public addAction(action: Behavior): void {
            this.mChildren.push(action);
        }

        public static create(behaviorTree: BehaviorTree, successPolicy: Policy, failurePolicy: Policy): Monitor {
            return new Monitor(behaviorTree, successPolicy, failurePolicy);
        }
    }

    export class BehaviorTree {
        private mEventMode: boolean;
        private mRoot: Behavior = null as any as Behavior;
        private mBehaviors: Behavior[] = [];

        public constructor(eventMode: boolean) {
            this.mEventMode = eventMode;
        }

        public tick(dt: number): void {
            if (this.mEventMode) {
                while (this.step(dt)) {
                }
            }
            else {
                this.mRoot.tick(dt);
            }
        }

        public haveRoot(): boolean {
            return this.mRoot ? true : false;
        }

        public setRoot(root: Behavior) {
            this.mRoot = root;
        }

        public release() {
            this.mRoot.onRelease();
        }

        public start(behavior: Behavior, observer: BehaviorObserver) {
            behavior.setObserver(observer);
            this.mBehaviors.push(behavior);
        }

        public stop(behavior: Behavior, result: BehaviorStatus) {
            CC_DEBUG && cc_assert(result != BehaviorStatus.running, "fatal error");
            behavior.setStatus(result);
            behavior.getObserver()?.(result);
        }

        public step(dt: number) {
            var current: Behavior | null = this.mBehaviors.shift() || null;

            if (current == null) {
                return false;
            }

            current.tick(dt);

            if (current.getStatus() != BehaviorStatus.running && current.getObserver()) {
                current.getObserver()?.(current.getStatus());
            }
            else {
                this.mBehaviors.push(current);
            }

            return true;
        }
    }

    enum ActionMode {
        Attack,
        Patrol,
        Runaway,
    }

    enum ConditionMode {
        IsSeeEnemy,
        IsHealthLow,
        IsEnemyDead,
    }

    export class BehaviorTreeBuilder {
        public constructor() {
            this.mNodeStack = [];
        }

        public sequence(behaviorTree: BehaviorTree): BehaviorTreeBuilder {
            let sequence = Sequence.create(behaviorTree);
            this.addBehavior(sequence);
            return this;
        }

        public action(behaviorTree: BehaviorTree, actionMode: ActionMode): BehaviorTreeBuilder {
            cc_assert(false, "fatal error");
            return this;
        }

        public condition(conditionMode: ConditionMode, isNegation: boolean): BehaviorTreeBuilder {
            cc_assert(false, "fatal error");
            return this;
        }

        public selector(behaviorTree: BehaviorTree): BehaviorTreeBuilder {
            var selector = Selector.create(behaviorTree);
            this.addBehavior(selector);
            return this;
        }

        public repeat(behaviorTree: BehaviorTree, count: number): BehaviorTreeBuilder {
            var repeat = Repeat.create(behaviorTree, count);
            this.addBehavior(repeat);
            return this;
        }

        public activeSelector(behaviorTree: BehaviorTree): BehaviorTreeBuilder {
            var selector = ActiveSelector.create(behaviorTree);
            this.addBehavior(selector);
            return this;
        }

        public filter(behaviorTree: BehaviorTree): BehaviorTreeBuilder {
            var filter = Filter.create(behaviorTree);
            this.addBehavior(filter);
            return this;
        }

        public parallel(behaviorTree: BehaviorTree, successPolicy: Policy, failurePolicy: Policy): BehaviorTreeBuilder {
            var parallel = Parallel.create(behaviorTree, successPolicy, failurePolicy);
            this.addBehavior(parallel);
            return this;
        }

        public monitor(behaviorTree: BehaviorTree, successPolicy: Policy, failurePolicy: Policy): BehaviorTreeBuilder {
            var monitor = Monitor.create(behaviorTree, successPolicy, failurePolicy);
            this.addBehavior(monitor);
            return this;
        }

        public back(): BehaviorTreeBuilder {
            cc_assert(this.mNodeStack.length, "fatal error");
            this.mNodeStack.shift();
            return this;
        }

        public end(eventMode: boolean): BehaviorTree {
            while (this.mNodeStack.length > 0) {
                this.mNodeStack.shift();
            }
            let tmp = new BehaviorTree(eventMode);
            tmp.setRoot(this.mTreeRoot as Behavior);
            this.mTreeRoot = null;
            return tmp;
        }

        private addBehavior(behavior: Behavior): void {
            cc_assert(behavior);
            if (!this.mTreeRoot) {
                this.mTreeRoot = behavior;
            }
            else {
                this.mNodeStack[0].addChild(behavior);
            }
            this.mNodeStack.unshift(behavior);
        }

        private mTreeRoot: Behavior | null = null;
        private mNodeStack: Behavior[];
    }
}
