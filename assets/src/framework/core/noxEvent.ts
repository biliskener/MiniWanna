import { cc_assert, CC_DEBUG, nox } from "./nox";

export interface noxListenerBase {
    remove: () => void,
}

export type noxCallback0 = () => void;

export class noxListener0 implements noxListenerBase {
    public _object: object;
    public _callback: noxCallback0;
    public _once: boolean;
    public _event: noxEvent0 | null;
    public constructor(object: object, callback: noxCallback0, once: boolean, event: noxEvent0) {
        this._object = object;
        this._callback = callback;
        this._once = once;
        this._event = event;
    }
    public remove(): void {
        if (this._event) {
            this._event.removeListener(this);
            this._event = null;
        }
    }
}

export class noxEvent0 {
    private _listeners: noxListener0[] = [];

    public addListener(object: object, callback: noxCallback0, once?: boolean): noxListener0 {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            var listener = listeners[i];
            if (listener._object == object && listener._callback == callback) {
                CC_DEBUG && nox.warn("listener already exists");
                return listener;
            }
        }

        var listener = new noxListener0(object, callback, once || false, this);
        listeners.push(listener);
        return listener;
    }

    public removeListener(object: object | noxListener0 | null, callback?: noxCallback0): void {
        if (nox.isFunction(object)) {
            callback = <any>object;
            object = null;
        }

        var listeners = this._listeners;
        if (object instanceof noxListener0) {
            let listener = object;
            if (listener._event) {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listener._event = null;
                    listeners.splice(index, 1);
                }
                else {
                    CC_DEBUG && cc_assert(false, "fatal error");
                }
            }
        }
        else {
            for (var i = 0; i < listeners.length; ++i) {
                let listener = listeners[i];
                if (listener._object == object && listener._callback == callback) {
                    listener._event = null;
                    listeners.splice(i, 1);
                    return;
                }
            }
            CC_DEBUG && nox.warn("listener not found");
        }
    }

    public removeAllListeners(): void {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            let listener = listeners[i];
            listener._event = null;
        }
        this._listeners = [];
    }

    public dispatchEvent(): void {
        var listeners = this._listeners;
        if (listeners && listeners.length > 0) {
            var listeners2 = listeners.slice(0);
            for (var i = 0; i < listeners2.length; ++i) {
                var listener = listeners2[i];
                if (listener._event) {
                    if (listener._once) {
                        var index = listeners.indexOf(listener);
                        if (index >= 0) {
                            listener._event = null;
                            listeners.splice(index, 1);
                        }
                        else {
                            CC_DEBUG && cc_assert(false, "fatal error");
                        }
                    }
                    if (listener._object) {
                        listener._callback.call(listener._object);
                    }
                    else {
                        listener._callback();
                    }
                }
            }
        }
    }
}

export type noxCallback1<P1> = (p1: P1) => void;

export class noxListener1<P1> implements noxListenerBase {
    public _object: object;
    public _callback: noxCallback1<P1>;
    public _once: boolean;
    public _event: noxEvent1<P1> | null;
    public constructor(object: object, callback: noxCallback1<P1>, once: boolean, event: noxEvent1<P1>) {
        this._object = object;
        this._callback = callback;
        this._once = once;
        this._event = event;
    }
    public remove(): void {
        if (this._event) {
            this._event.removeListener(this);
            this._event = null;
        }
    }
}

export class noxEvent1<P1> {
    private _listeners: noxListener1<P1>[] = [];

    public addListener(object: object, callback: noxCallback1<P1>, once?: boolean): noxListener1<P1> {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            var listener = listeners[i];
            if (listener._object == object && listener._callback == callback) {
                CC_DEBUG && nox.warn("listener already exists");
                return listener;
            }
        }

        var listener = new noxListener1<P1>(object, callback, once || false, this);
        listeners.push(listener);
        return listener;
    }

    public removeListener(object: object | noxListener1<P1> | null, callback?: noxCallback1<P1>): void {
        if (nox.isFunction(object)) {
            callback = <any>object;
            object = null;
        }

        var listeners = this._listeners;
        if (object instanceof noxListener1) {
            let listener = object;
            if (listener._event) {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listener._event = null;
                    listeners.splice(index, 1);
                }
                else {
                    CC_DEBUG && cc_assert(false, "fatal error");
                }
            }
        }
        else {
            for (var i = 0; i < listeners.length; ++i) {
                let listener = listeners[i];
                if (listener._object == object && listener._callback == callback) {
                    listener._event = null;
                    listeners.splice(i, 1);
                    return;
                }
            }
            CC_DEBUG && nox.warn("listener not found");
        }
    }

    public removeAllListeners(): void {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            let listener = listeners[i];
            listener._event = null;
        }
        this._listeners = [];
    }

    public dispatchEvent(p1: P1): void {
        var listeners = this._listeners;
        if (listeners && listeners.length > 0) {
            var listeners2 = listeners.slice(0);
            for (var i = 0; i < listeners2.length; ++i) {
                var listener = listeners2[i];
                if (listener._event) {
                    if (listener._once) {
                        var index = listeners.indexOf(listener);
                        if (index >= 0) {
                            listener._event = null;
                            listeners.splice(index, 1);
                        }
                        else {
                            CC_DEBUG && cc_assert(false, "fatal error");
                        }
                    }
                    if (listener._object) {
                        listener._callback.call(listener._object, p1);
                    }
                    else {
                        listener._callback(p1);
                    }
                }
            }
        }
    }
}


export type noxCallback2<P1, P2> = (p1: P1, p2: P2) => void;
export class noxListener2<P1, P2> implements noxListenerBase {
    public _object: object;
    public _callback: noxCallback2<P1, P2>;
    public _once: boolean;
    public _event: noxEvent2<P1, P2> | null;
    public constructor(object: object, callback: noxCallback2<P1, P2>, once: boolean, event: noxEvent2<P1, P2>) {
        this._object = object;
        this._callback = callback;
        this._once = once;
        this._event = event;
    }
    public remove(): void {
        if (this._event) {
            this._event.removeListener(this);
            this._event = null;
        }
    }
}

export class noxEvent2<P1, P2> {
    private _listeners: noxListener2<P1, P2>[] = [];

    public addListener(object: object, callback: noxCallback2<P1, P2>, once?: boolean): noxListener2<P1, P2> {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            var listener = listeners[i];
            if (listener._object == object && listener._callback == callback) {
                CC_DEBUG && nox.warn("listener already exists");
                return listener;
            }
        }

        var listener = new noxListener2<P1, P2>(object, callback, once || false, this);
        listeners.push(listener);
        return listener;
    }

    public removeListener(object: object | noxListener2<P1, P2> | null, callback?: noxCallback2<P1, P2>): void {
        if (nox.isFunction(object)) {
            callback = <any>object;
            object = null;
        }

        var listeners = this._listeners;
        if (object instanceof noxListener2) {
            let listener = object;
            if (listener._event) {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listener._event = null;
                    listeners.splice(index, 1);
                }
                else {
                    CC_DEBUG && cc_assert(false, "fatal error");
                }
            }
        }
        else {
            for (var i = 0; i < listeners.length; ++i) {
                let listener = listeners[i];
                if (listener._object == object && listener._callback == callback) {
                    listener._event = null;
                    listeners.splice(i, 1);
                    return;
                }
            }
            CC_DEBUG && nox.warn("listener not found");
        }
    }

    public removeAllListeners(): void {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            let listener = listeners[i];
            listener._event = null;
        }
        this._listeners = [];
    }

    public dispatchEvent(p1: P1, p2: P2): void {
        var listeners = this._listeners;
        if (listeners && listeners.length > 0) {
            var listeners2 = listeners.slice(0);
            for (var i = 0; i < listeners2.length; ++i) {
                var listener = listeners2[i];
                if (listener._event) {
                    if (listener._once) {
                        var index = listeners.indexOf(listener);
                        if (index >= 0) {
                            listener._event = null;
                            listeners.splice(index, 1);
                        }
                        else {
                            CC_DEBUG && cc_assert(false, "fatal error");
                        }
                    }
                    if (listener._object) {
                        listener._callback.call(listener._object, p1, p2);
                    }
                    else {
                        listener._callback(p1, p2);
                    }
                }
            }
        }
    }
}



export type noxCallback3<P1, P2, P3> = (p1: P1, p2: P2, p3: P3) => void;
export class noxListener3<P1, P2, P3> implements noxListenerBase {
    public _object: object;
    public _callback: noxCallback3<P1, P2, P3>;
    public _once: boolean;
    public _event: noxEvent3<P1, P2, P3> | null;
    public constructor(object: object, callback: noxCallback3<P1, P2, P3>, once: boolean, event: noxEvent3<P1, P2, P3>) {
        this._object = object;
        this._callback = callback;
        this._once = once;
        this._event = event;
    }
    public remove(): void {
        if (this._event) {
            this._event.removeListener(this);
            this._event = null;
        }
    }
}

export class noxEvent3<P1, P2, P3> {
    private _listeners: noxListener3<P1, P2, P3>[] = [];

    public addListener(object: object, callback: noxCallback3<P1, P2, P3>, once?: boolean): noxListener3<P1, P2, P3> {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            var listener = listeners[i];
            if (listener._object == object && listener._callback == callback) {
                CC_DEBUG && nox.warn("listener already exists");
                return listener;
            }
        }

        var listener = new noxListener3<P1, P2, P3>(object, callback, once || false, this);
        listeners.push(listener);
        return listener;
    }

    public removeListener(object: object | noxListener3<P1, P2, P3> | null, callback?: noxCallback3<P1, P2, P3>): void {
        if (nox.isFunction(object)) {
            callback = <any>object;
            object = null;
        }

        var listeners = this._listeners;
        if (object instanceof noxListener3) {
            let listener = object;
            if (listener._event) {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listener._event = null;
                    listeners.splice(index, 1);
                }
                else {
                    CC_DEBUG && cc_assert(false, "fatal error");
                }
            }
        }
        else {
            for (var i = 0; i < listeners.length; ++i) {
                let listener = listeners[i];
                if (listener._object == object && listener._callback == callback) {
                    listener._event = null;
                    listeners.splice(i, 1);
                    return;
                }
            }
            CC_DEBUG && nox.warn("listener not found");
        }
    }

    public removeAllListeners(): void {
        var listeners = this._listeners;
        for (var i = 0; i < listeners.length; ++i) {
            let listener = listeners[i];
            listener._event = null;
        }
        this._listeners = [];
    }

    public dispatchEvent(p1: P1, p2: P2, p3: P3): void {
        var listeners = this._listeners;
        if (listeners && listeners.length > 0) {
            var listeners2 = listeners.slice(0);
            for (var i = 0; i < listeners2.length; ++i) {
                var listener = listeners2[i];
                if (listener._event) {
                    if (listener._once) {
                        var index = listeners.indexOf(listener);
                        if (index >= 0) {
                            listener._event = null;
                            listeners.splice(index, 1);
                        }
                        else {
                            CC_DEBUG && cc_assert(false, "fatal error");
                        }
                    }
                    if (listener._object) {
                        listener._callback.call(listener._object, p1, p2, p3);
                    }
                    else {
                        listener._callback(p1, p2, p3);
                    }
                }
            }
        }
    }
}

