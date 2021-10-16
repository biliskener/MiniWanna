import { cc_assert } from "./nox";

export module bev {
    export enum ParallelFinishCondition {
        OR = 1,
        AND = 2,
    }

    export enum BevRunningStatus {
        Transition = -1,
        Executing = 0,
        Finish = 1,
    }

    export enum TerminalNodeStaus {
        Ready = 1,
        Running = 2,
        Finish = 3,
    }

    export type BevNodeInputParam = any;
    export type BevNodeOutputParam = any;

    export interface BevNodePrecondition {
        externalCondition(input: BevNodeInputParam): boolean;
    }

    export class BevNodePreconditionTRUE implements BevNodePrecondition {
        public externalCondition(input: BevNodeInputParam): boolean {
            return true;
        }
    }

    export class BevNodePreconditionFALSE implements BevNodePrecondition {
        public externalCondition(input: BevNodeInputParam): boolean {
            return false;
        }
    }

    export class BevNodePreconditionNOT implements BevNodePrecondition {
        private mLeftCondition: BevNodePrecondition;

        public constructor(lhs: BevNodePrecondition) {
            this.mLeftCondition = lhs;
        }

        public externalCondition(input: BevNodeInputParam): boolean {
            return !this.mLeftCondition.externalCondition(input);
        }
    }

    export class BevNodePreconditionAND implements BevNodePrecondition {
        private mLeftCondition: BevNodePrecondition;
        private mRightCondition: BevNodePrecondition;

        public constructor(lhs: BevNodePrecondition, rhs: BevNodePrecondition) {
            this.mLeftCondition = lhs;
            this.mRightCondition = rhs;
        }

        public externalCondition(input: BevNodeInputParam): boolean {
            return this.mLeftCondition.externalCondition(input) && this.mRightCondition.externalCondition(input);
        }
    }

    export class BevNodePreconditionOR implements BevNodePrecondition {
        private mLeftCondition: BevNodePrecondition;
        private mRightCondition: BevNodePrecondition;

        public constructor(lhs: BevNodePrecondition, rhs: BevNodePrecondition) {
            this.mLeftCondition = lhs;
            this.mRightCondition = rhs;
        }

        public externalCondition(input: BevNodeInputParam): boolean {
            return this.mLeftCondition.externalCondition(input) || this.mRightCondition.externalCondition(input);
        }
    }

    export class BevNode {
        protected mChildrenNode: BevNode[] = [];
        protected mParentNode: BevNode | null = null;
        protected mActiveNode: BevNode | null = null;
        protected mLastActiveNode: BevNode | null = null;
        protected mPrecondition: BevNodePrecondition | null = null;
        protected mDebugName: string = "";

        public constructor(parent: BevNode, precondition?: BevNodePrecondition) {
            this.mDebugName = "UNNAMED";
            if (parent) {
                parent.addChildNode(this);
            }
            this.setPrecondition(precondition || null);
        }

        public evaluate(input: BevNodeInputParam): boolean {
            return (this.mPrecondition == null || this.mPrecondition.externalCondition(input)) && this.doEvaluate(input);
        }

        public transition(input: BevNodeInputParam): void {
            this.doTransition(input);
        }

        public tick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            return this.doTick(input, output);
        }

        public addChildNode(child: BevNode): BevNode {
            cc_assert(child.mParentNode == null, "fatal error");
            child.mParentNode = this;
            this.mChildrenNode.push(child);
            return this;
        }

        public setPrecondition(precondition: BevNodePrecondition | null): BevNode {
            this.mPrecondition = precondition;
            return this;
        }

        public setDebugName(debugName: string): BevNode {
            this.mDebugName = debugName;
            return this;
        }

        public getDebugName(): string {
            return this.mDebugName;
        }

        public getLastActiveNode(): BevNode | null {
            return this.mLastActiveNode;
        }

        public setActiveNode(node: BevNode | null) {
            this.mLastActiveNode = this.mActiveNode;
            this.mActiveNode = node;
            if (this.mParentNode) {
                this.mParentNode.setActiveNode(node);
            }
        }

        protected doEvaluate(input: BevNodeInputParam): boolean {
            return true;
        }

        protected doTransition(input: BevNodeInputParam): void {
        }

        protected doTick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            return BevRunningStatus.Finish;
        }

        protected checkIndex(index: number): boolean {
            return index >= 0 && index < this.mChildrenNode.length;
        }
    }

    export class BevNodePrioritySelector extends BevNode {
        protected mLastSelectIndex: number;
        protected mCurrentSelectIndex: number;

        public constructor(parent: BevNode, precondition?: BevNodePrecondition) {
            super(parent, precondition);
            this.mLastSelectIndex = -1;
            this.mCurrentSelectIndex = -1;
        }

        protected doEvaluate(input: BevNodeInputParam): boolean {
            this.mCurrentSelectIndex = -1;
            for (var i = 0; i < this.mChildrenNode.length; ++i) {
                var child = this.mChildrenNode[i];
                if (child.evaluate(input)) {
                    this.mCurrentSelectIndex = i;
                    return true;
                }
            }
            return false;
        }

        protected doTransition(input: BevNodeInputParam): void {
            if (this.checkIndex(this.mLastSelectIndex)) {
                var child = this.mChildrenNode[this.mLastSelectIndex];
                child.transition(input);
            }
            this.mLastSelectIndex = -1;
        }

        protected doTick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            var bIsFinish = BevRunningStatus.Finish;
            if (this.checkIndex(this.mCurrentSelectIndex)) {
                if (this.mLastSelectIndex != this.mCurrentSelectIndex)  //new select result
                {
                    if (this.checkIndex(this.mLastSelectIndex)) {
                        var child = this.mChildrenNode[this.mLastSelectIndex];
                        child.transition(input);
                    }
                    this.mLastSelectIndex = this.mCurrentSelectIndex;
                }
            }
            if (this.checkIndex(this.mLastSelectIndex)) {
                var child = this.mChildrenNode[this.mLastSelectIndex];
                bIsFinish = child.tick(input, output);
                if (bIsFinish) {
                    this.mLastSelectIndex = -1;
                }
            }
            return bIsFinish;
        }
    }

    export class BevNodeNonePrioritySelector extends BevNodePrioritySelector {
        public constructor(parent: BevNode, precondition?: BevNodePrecondition) {
            super(parent, precondition);
        }

        protected doEvaluate(input: BevNodeInputParam): boolean {
            if (this.checkIndex(this.mCurrentSelectIndex)) {
                var child = this.mChildrenNode[this.mCurrentSelectIndex];
                if (child.evaluate(input)) {
                    return true;
                }
            }
            return super.doEvaluate(input);
        }
    }

    export class BevNodeSequence extends BevNode {
        private mCurrentNodeIndex: number;

        public constructor(parent: BevNode, precondition?: BevNodePrecondition) {
            super(parent, precondition);
            this.mCurrentNodeIndex = -1;
        }

        protected doEvaluate(input: BevNodeInputParam): boolean {
            var testNode: number = this.mCurrentNodeIndex < 0 ? 0 : this.mCurrentNodeIndex;
            if (this.checkIndex(testNode)) {
                var child = this.mChildrenNode[testNode];
                if (child.evaluate(input)) {
                    return true;
                }
            }
            return false;
        }

        protected doTransition(input: BevNodeInputParam): void {
            if (this.checkIndex(this.mCurrentNodeIndex)) {
                var child = this.mChildrenNode[this.mCurrentNodeIndex];
                child.transition(input);
            }
            this.mCurrentNodeIndex = -1;
        }

        protected doTick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            var bIsFinish = BevRunningStatus.Finish;

            if (this.mCurrentNodeIndex < 0) {
                this.mCurrentNodeIndex = 0;
            }

            var child = this.mChildrenNode[this.mCurrentNodeIndex];
            bIsFinish = child.tick(input, output);
            if (bIsFinish == BevRunningStatus.Finish) {
                ++this.mCurrentNodeIndex;
                if (this.mCurrentNodeIndex >= this.mChildrenNode.length) {
                    this.mCurrentNodeIndex = -1;
                }
                else {
                    bIsFinish = BevRunningStatus.Executing;
                }
            }
            if (bIsFinish < 0) {
                this.mCurrentNodeIndex = -1;
            }
            return bIsFinish;
        }
    }

    export class BevNodeTerminal extends BevNode {
        private mTerminalStatus: TerminalNodeStaus;
        private mNeedExit: boolean;

        public constructor(parent: BevNode, precondition?: BevNodePrecondition) {
            super(parent, precondition);
            this.mTerminalStatus = TerminalNodeStaus.Ready;
            this.mNeedExit = false;
        }

        protected doTransition(input: BevNodeInputParam): void {
            if (this.mNeedExit) {
                this.doExit(input, BevRunningStatus.Transition);
            }

            this.setActiveNode(null);
            this.mTerminalStatus = TerminalNodeStaus.Ready;
            this.mNeedExit = false;
        }

        protected doTick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            var bIsFinish = BevRunningStatus.Finish;
            if (this.mTerminalStatus == TerminalNodeStaus.Ready) {
                this.doEnter(input);
                this.mNeedExit = true;
                this.mTerminalStatus = TerminalNodeStaus.Running;
                this.setActiveNode(this);
            }
            if (this.mTerminalStatus == TerminalNodeStaus.Running) {
                bIsFinish = this.doExecute(input, output);
                this.setActiveNode(this);
                if (bIsFinish == BevRunningStatus.Finish || bIsFinish < 0) {
                    this.mTerminalStatus = TerminalNodeStaus.Finish;
                }
            }
            if (this.mTerminalStatus == TerminalNodeStaus.Finish) {
                if (this.mNeedExit) {
                    this.doExit(input, bIsFinish);
                }

                this.mTerminalStatus = TerminalNodeStaus.Ready;
                this.mNeedExit = false;
                this.setActiveNode(null);
                return bIsFinish;
            }
            return bIsFinish;
        }

        protected doEnter(input: BevNodeInputParam): void {
        }

        protected doExecute(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            return BevRunningStatus.Finish;
        }

        protected doExit(input: BevNodeInputParam, status: BevRunningStatus) {
        }
    }

    export class BevNodeParallel extends BevNode {
        private mFinishCondition: ParallelFinishCondition;
        private mChildrenStatus: BevRunningStatus[];

        public constructor(parent: BevNode, precondition?: BevNodePrecondition) {
            super(parent, precondition);
            this.mFinishCondition = ParallelFinishCondition.OR;
            this.mChildrenStatus = [];
        }

        public setFinishCondition(condition: ParallelFinishCondition): BevNodeParallel {
            this.mFinishCondition = condition;
            return this;
        }

        protected doEvaluate(input: BevNodeInputParam): boolean {
            for (var i = 0; i < this.mChildrenNode.length; ++i) {
                var child = this.mChildrenNode[i];
                if (this.mChildrenStatus[i] == null || this.mChildrenStatus[i] == BevRunningStatus.Executing) {
                    if (!child.evaluate(input)) {
                        return false;
                    }
                }
            }
            return true;
        }

        protected doTransition(input: BevNodeInputParam): void {
            for (var i = 0; i < this.mChildrenNode.length; ++i) {
                this.mChildrenStatus[i] = BevRunningStatus.Executing;
            }

            for (var i = 0; i < this.mChildrenNode.length; ++i) {
                this.mChildrenNode[i].transition(input);
            }
        }

        protected doTick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            var finishedChildCount = 0;
            for (var i = 0; i < this.mChildrenNode.length; ++i) {
                var child = this.mChildrenNode[i];
                if (this.mFinishCondition == ParallelFinishCondition.OR) {
                    if (this.mChildrenStatus[i] == null || this.mChildrenStatus[i] == BevRunningStatus.Executing) {
                        this.mChildrenStatus[i] = child.tick(input, output);
                    }
                    if (this.mChildrenStatus[i] != BevRunningStatus.Executing) {
                        for (var j = 0; j < this.mChildrenNode.length; ++j) {
                            this.mChildrenStatus[j] = BevRunningStatus.Executing;
                        }
                        return BevRunningStatus.Finish;
                    }
                }
                else if (this.mFinishCondition == ParallelFinishCondition.AND) {
                    if (this.mChildrenStatus[i] == null || this.mChildrenStatus[i] == BevRunningStatus.Executing) {
                        this.mChildrenStatus[i] = child.tick(input, output);
                    }
                    if (this.mChildrenStatus[i] != BevRunningStatus.Executing) {
                        finishedChildCount++;
                    }
                }
                else {
                    cc_assert(false, "fatal error");
                }
            }
            if (finishedChildCount == this.mChildrenNode.length) {
                for (var j = 0; j < this.mChildrenNode.length; ++j) {
                    this.mChildrenStatus[j] = BevRunningStatus.Executing;
                }
                return BevRunningStatus.Finish;
            }
            return BevRunningStatus.Executing;
        }
    }

    export class BevNodeLoop extends BevNode {
        public static InfiniteLoop: number = -1;

        private mLoopCount: number;
        private mCurrentCount: number;

        public constructor(parent: BevNode, precondition?: BevNodePrecondition, loopCount?: number) {
            super(parent, precondition);
            this.mLoopCount = loopCount == null ? BevNodeLoop.InfiniteLoop : loopCount;
            this.mCurrentCount = 0;
        }

        protected doEvaluate(input: BevNodeInputParam): boolean {
            var checkLoopCount = (this.mLoopCount == BevNodeLoop.InfiniteLoop) || this.mCurrentCount < this.mLoopCount;
            if (!checkLoopCount) {
                return false;
            }

            if (this.checkIndex(0)) {
                var child = this.mChildrenNode[0];
                if (child.evaluate(input)) {
                    return true;
                }
            }
            return false;
        }

        protected doTransition(input: BevNodeInputParam): void {
            if (this.checkIndex(0)) {
                var child = this.mChildrenNode[0];
                child.transition(input);
            }
            this.mCurrentCount = 0;
        }

        protected doTick(input: BevNodeInputParam, output: BevNodeOutputParam): BevRunningStatus {
            var bIsFinish = BevRunningStatus.Finish;
            if (this.checkIndex(0)) {
                var child = this.mChildrenNode[0];
                bIsFinish = child.tick(input, output);
                if (bIsFinish == BevRunningStatus.Finish) {
                    if (this.mLoopCount != BevNodeLoop.InfiniteLoop) {
                        this.mCurrentCount++;
                        if (this.mCurrentCount == this.mLoopCount) {
                            bIsFinish = BevRunningStatus.Executing;
                        }
                    }
                    else {
                        bIsFinish = BevRunningStatus.Executing;
                    }
                }
            }
            if (bIsFinish) {
                this.mCurrentCount = 0;
            }
            return bIsFinish;
        }
    }
}
