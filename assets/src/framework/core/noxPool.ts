import { cc_assert, nox } from "./nox";

type noxPoolObj<T> = T & {
    _usingPool?: noxPool<T>;
    _poolIndex?: number;
};

export class noxPool<T> {
    private _objCreate: () => T;
    private _objDestroy: (obj: T) => void;
    private _maxSize: number = 65535;
    private _extSize: number = 1;

    private _objs: noxPoolObj<T>[] = [];
    private _usedSize: number = 0;       // 已经使用的对象数量

    public constructor(objCreate: () => T, objDestroy: (obj: T) => void, maxSize?: number, extSize?: number, initSize?: number) {
        this._objCreate = objCreate;
        this._objDestroy = objDestroy;
        this._objs = [];
        this._maxSize = maxSize || 65535;
        this._extSize = extSize || 1;
        this._usedSize = 0;
        this.extend(initSize || this._extSize);
    }

    private extend(size?: number): void {
        size = size || this._extSize;
        for (var i = 0; i < size && this._objs.length < this._maxSize; ++i) {
            var obj: noxPoolObj<T> = this._objCreate();
            this._objs.push(obj);
            obj._poolIndex = this._objs.length - 1;
            obj._usingPool = this;
        }
        nox.logf("lcPool size is extend to %d", this._objs.length);
    }

    public extendTo(size: number): void {
        if (this._objs.length < size) {
            this.extend(size - this._objs.length);
        }
    }

    public getObj(): T {
        if (this._usedSize >= this._objs.length) {
            this.extend();
        }

        if (this._usedSize >= this._objs.length) {
            cc_assert(false, "pool has no objects");
            return null as any as T;
        }
        else {
            var obj = this._objs[this._usedSize];
            this._usedSize++;
            obj._usingPool = this;
            return obj;
        }
    }

    public putObj(obj: noxPoolObj<T>): void {
        if (obj._usingPool) {
            cc_assert(false, "fatal error");
        }
        else {
            var pool = obj._usingPool;
            delete obj._usingPool;

            // 与最后一个被使用的元素交换位置
            var index = obj._poolIndex as number;
            var index2 = this._usedSize - 1;
            if (index != index2) {
                var obj2 = this._objs[index2];
                obj._poolIndex = index2;
                obj2._poolIndex = index;
                this._objs[index] = obj2;
                this._objs[index2] = obj;
                cc_assert(this._objs[obj._poolIndex] == obj, "pool putObj error 1");
                cc_assert(this._objs[obj2._poolIndex] == obj2, "pool putObj error 2");
                cc_assert(obj != obj2, "pool putObj error 3");
            }

            --this._usedSize;
        }
    }

    public clear(): void {
        for (var i = 0; i < this._objs.length; ++i) {
            var obj = this._objs[i];
            this._objDestroy(obj);
        }
        this._objs = [];
        this._usedSize = 0;
    }
}
