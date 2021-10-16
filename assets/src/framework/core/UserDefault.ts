import { cc_sys, nox } from "./nox";

//---- 本地存储
export namespace UserDefault {
    export function getBoolForKey(key: string, def?: boolean): boolean {
        if (def == null) def = false;
        let val = cc_sys.localStorage.getItem(key);
        if (val != null) {
            return nox.isString(val) ? (val == "true" ? true : false) : !!val;
        }
        return def;
    }

    export function setBoolForKey(key: string, val: boolean): void {
        return cc_sys.localStorage.setItem(key, val ? "true" : "false");
    }

    export function getStringForKey(key: string, def?: string): string {
        if (def == null) def = "";
        let val = cc_sys.localStorage.getItem(key);
        return val != null && val ? val : def;
    }

    export function setStringForKey(key: string, val: string): void {
        return cc_sys.localStorage.setItem(key, val);
    }

    export function getIntegerForKey(key: string, def: number): number {
        if (def == null) def = 0;
        let val = cc_sys.localStorage.getItem(key);
        return val != null ? nox.toNumber(val) : def;
    }

    export function setIntegerForKey(key: string, val: number): void {
        return cc_sys.localStorage.setItem(key, val + "");
    }

    export function getFloatForKey(key: string, def?: number): number {
        if (def == null) def = 0;
        let val = cc_sys.localStorage.getItem(key);
        return val != null ? nox.toNumber(val) : def;
    }

    export function setFloatForKey(key: string, val: number): void {
        return cc_sys.localStorage.setItem(key, val + "");
    }

    export function getJsonForKey(key: string, def?: object): any {
        let val = cc_sys.localStorage.getItem(key);
        return val != null ? JSON.parse(val) : def;
    }

    export function setJsonForKey(key: string, val: object): void {
        return cc_sys.localStorage.setItem(key, JSON.stringify(val));
    }

    export function deleteValueForKey(key: string): void {
        return cc_sys.localStorage.removeItem(key);
    }
}
