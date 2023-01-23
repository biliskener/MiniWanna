import { DEBUG as _CC_DEBUG, DEV as _CC_DEV, PREVIEW as _CC_PREVIEW, EDITOR as _CC_EDITOR } from "cc/env";
import { settings as _cc_settings, Vec2, VERSION as _CC_VERSION, __private } from "cc";
import { assert as _cc_assert, log as _cc_log, debug as _cc_debug, warn as _cc_warn, error as _cc_error, js as _cc_js, errorID as _cc_errorID, getError as _cc_getError } from "cc";
import { v2 as _cc_v2, v3 as _cc_v3, macro as _cc_macro, sys as _cc_sys, misc as _cc_misc, input as _cc_input } from "cc";
import { color as _cc_color, rect as _cc_rect, size as _cc_size } from "cc";
import { view as _cc_view, game as _cc_game, director as _cc_director, setDisplayStats as _cc_setDisplayStats } from "cc";
import { isValid as _cc_isValid, find as _cc_find, instantiate as _cc_instantiate } from "cc";
import { tween as _cc_tween, resources as _cc_resources, assetManager as _cc_assetManager } from "cc";
import { TMap } from "./T";
import { clamp as _cc_clamp } from "cc";

export const CC_DEBUG = _CC_DEBUG;
export const CC_DEV = _CC_DEV;
export const CC_PREVIEW = _CC_PREVIEW;
export const CC_EDITOR = _CC_EDITOR;
export const CC_VERSION = _CC_VERSION;
export const cc_assert: (value: any, message?: string, ...optionalParams: any[]) => asserts value = _cc_assert;

export const cc_log = _cc_log;
export const cc_debug = _cc_debug;
export const cc_warn = _cc_warn;
export const cc_error = _cc_error;
export const cc_js = _cc_js;
export const cc_errorID = _cc_errorID;
export const cc_getError = _cc_getError;
export const cc_v2 = _cc_v2;
export const cc_v3 = _cc_v3;
export const cc_macro = _cc_macro;
export const cc_sys = _cc_sys;
export const cc_misc = _cc_misc;
export const cc_color = _cc_color;
export const cc_rect = _cc_rect;
export const cc_size = _cc_size;
export const cc_view = _cc_view;
export const cc_game = _cc_game;
export const cc_settings = _cc_settings;
export const cc_director = _cc_director;
export const cc_isValid = _cc_isValid;
export const cc_find = _cc_find;
export const cc_instantiate = _cc_instantiate;
export const cc_tween = _cc_tween;
export const cc_resources = _cc_resources;
export const cc_assetManager = _cc_assetManager;
export const cc_clamp = _cc_clamp;
export const cc_setDisplayStats = _cc_setDisplayStats;
export const cc_input = _cc_input;

declare module wx {
    function getSystemInfoSync(): { platform: string };
    function getPerformance(): { now: () => number };
}

declare const qg: any;

export module nox {
    cc_assert((<any>Object).values);
    if (!(<any>Object).values) {
        (<any>Object).values = function (obj: any) {
            let ret = [];
            for (let key in obj) {
                ret.push(obj[key]);
            }
            return ret;
        };
    }

    //cc_assert(CC_VERSION == '3.3.2', '版本不一致, 需要检查OS和PLATFORM常量值是否和引擎一致');

    export enum PLATFORM {
        UNKNOWN = cc_sys.Platform.UNKNOWN,
        EDITOR_PAGE = cc_sys.Platform.EDITOR_PAGE,
        EDITOR_CORE = cc_sys.Platform.EDITOR_CORE,
        MOBILE_BROWSER = cc_sys.Platform.MOBILE_BROWSER,
        DESKTOP_BROWSER = cc_sys.Platform.DESKTOP_BROWSER,
        WIN32 = cc_sys.Platform.WIN32,
        ANDROID = cc_sys.Platform.ANDROID,
        IOS = cc_sys.Platform.IOS,
        MACOS = cc_sys.Platform.MACOS,
        OHOS = cc_sys.Platform.OHOS,
        WECHAT_GAME = cc_sys.Platform.WECHAT_GAME,
        BAIDU_MINI_GAME = cc_sys.Platform.BAIDU_MINI_GAME,
        XIAOMI_QUICK_GAME = cc_sys.Platform.XIAOMI_QUICK_GAME,
        ALIPAY_MINI_GAME = cc_sys.Platform.ALIPAY_MINI_GAME,
        BYTEDANCE_MINI_GAME = cc_sys.Platform.BYTEDANCE_MINI_GAME,
        OPPO_MINI_GAME = cc_sys.Platform.OPPO_MINI_GAME,
        VIVO_MINI_GAME = cc_sys.Platform.VIVO_MINI_GAME,
        HUAWEI_QUICK_GAME = cc_sys.Platform.HUAWEI_QUICK_GAME,
        COCOSPLAY = cc_sys.Platform.COCOSPLAY,
        LINKSURE_MINI_GAME = cc_sys.Platform.LINKSURE_MINI_GAME,
        QTT_MINI_GAME = cc_sys.Platform.QTT_MINI_GAME
    }

    // 获得平台
    export const platform: PLATFORM = cc_sys.platform as any as PLATFORM;

    export enum OS {
        UNKNOWN = cc_sys.OS.UNKNOWN,
        IOS = cc_sys.OS.IOS,
        ANDROID = cc_sys.OS.ANDROID,
        WINDOWS = cc_sys.OS.WINDOWS,
        LINUX = cc_sys.OS.LINUX,
        OSX = cc_sys.OS.OSX,
        OHOS = cc_sys.OS.OHOS,
    }

    // 获得系统
    export const os: OS = cc_sys.os as any as OS;

    export const osVersion: string = cc_sys.osVersion;
    export const osMainVersion: number = cc_sys.osMainVersion;

    // 浏览器类型
    export const browserType: string = cc_sys.isBrowser ? cc_sys.browserType : "";
    export const browserVersion: string = cc_sys.isBrowser ? cc_sys.browserVersion : "";

    // 微端和快游戏时为true
    export const isNative: boolean = cc_sys.isNative;

    // 非微信, 非微端, 非QQ玩, 非快游戏, 即纯浏览器时为true
    export const isBrowser: boolean = cc_sys.isBrowser;

    // 是否为手机
    export const isMobile: boolean = cc_sys.isMobile;

    // 是否为电脑
    export const isPC: boolean = !cc_sys.isMobile;

    // 是否为HTML5平台
    export const isHtml5: boolean = nox.isBrowser;

    // 是否为JSB平台
    export const isJsb: boolean = cc_sys.isNative && typeof (qg) == "undefined";

    // 是否为快游戏
    export const isQuickGame: boolean = typeof (qg) != "undefined";

    // 是否为微信游戏
    export const isWechatGame: boolean = (cc_sys.platform == cc_sys.Platform.WECHAT_GAME);

    // 判断是否为微信浏览器
    export const isWechatBrowser: boolean = (function () {
        if (nox.isBrowser) {
            var ua: string = navigator.userAgent.toLowerCase();
            if (ua.match(/MicroMessenger/i)) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    })();

    export const isAndroid: boolean = (nox.os == nox.OS.ANDROID);

    export const isDebug: boolean = CC_DEBUG;
    export const isRelease: boolean = !CC_DEBUG;
    export const isDev: boolean = CC_DEV;
    export const isPreview: boolean = CC_PREVIEW;

    export function getEngineVersion(): string {
        return CC_VERSION;
    }

    //---- 其它辅助函数
    export const doNothing: () => void = (function () {
        return function () { };
    })();


    //---- 数据帮助函数

    // a有值时返回a, 否则返回d (有值代表非null, 非undefined)
    export function D<T>(a: T | null | undefined, d: T): T {
        return a ?? d;
    }

    export function D2<T>(a1: T | null | undefined, a2: T | null | undefined, d: T): T {
        return a1 ?? a2 ?? d;
    }

    // 判断a是不是一个值(a不为null且不为undefined且不为false时, 才代表有值)
    export function V(a: any): any {
        return a != null && a !== false;
    }

    //---- 类型检查帮助函数

    // 是否为布尔值
    export function isBoolean(obj: any): boolean {
        return typeof (obj) == "boolean";
    }

    // 是否为数值
    export function isNumber(obj: any): boolean {
        return typeof (obj) == "number";
    }

    // 是否为字符串
    export function isString(obj: any): boolean {
        return typeof (obj) == "string";
    }

    // 是否为函数
    export function isFunction(obj: any): boolean {
        return typeof (obj) == "function";
    }

    // 是否为对象(注意数组也是对象)
    export function isObject(obj: any): boolean {
        // 此函数不再建议使用
        return typeof (obj) == "object";
    }

    // 是否为Map结构对象, 即非数组对象
    export function isMapObject(obj: any): boolean {
        return typeof (obj) == "object" && !(obj instanceof Array);
    }

    // 是否为数组
    export function isArray(obj: any): boolean {
        return obj instanceof Array;
    }

    export function isSameClass(obj1: Object, obj2: Object): boolean {
        return obj1.constructor == obj2.constructor; // 不要用js.getClassName函数
    }

    //---- 类型转换帮助函数

    // 转换为字符串
    export function toString(v: number | boolean | string): string {
        return v + "";
    }

    // 转换为整数
    export function toInt(v: string): number {
        return parseInt(v);
    }

    // 转换为数值
    export function toNumber(v: number | string | object): number {
        if (typeof (v) == "number") {
            return v;
        }
        else if (typeof (v) == "string") {
            return parseFloat(v);
        }
        else if (protobuf.util.Long && v instanceof protobuf.util.Long) {
            CC_DEBUG && cc_assert(false, "Long type not supported");
            return protobuf.util.LongBits.from(v).toNumber();
        }
        else {
            cc_assert(false, "unknown v type");
        }
        return 0;
    }

    // 转换为JSON字符串
    export function jsonEncode(v: any): string {
        return JSON.stringify(v);
    }

    // 从JSON字符串转换为对象
    export function jsonDecode(s: string): any {
        try {
            return JSON.parse(s);
        }
        catch (e) {
            return null;
        }
    }

    // 变为偶数
    export function makeEven(num: number): number {
        var num = Math.floor(num);
        return (num % 2) == 0 ? num : num + 1;
    }

    //---- 数组与对象操作

    type KeysType = ({ }) => any[];
    type ValsType = ({ }) => any[];

    // keys
    export const keys: KeysType = (<KeysType>Object.keys || function <T>(t: {}): string[] {
        let results: string[] = [];
        for (let k in t) {
            results.push(k);
        }
        return results;
    });

    export function values<T>(t: TMap<T>): T[] {
        if ((<any>Object).values) {
            return (<any>Object).values(t);
        }
        else {
            let results: T[] = [];
            for (let k in t) {
                results.push(t[k]);
            }
            return results;
        }
    }

    // 复制数据(非深度)
    export function copy(obj: any): any {
        if (obj instanceof Array) {
            return obj.slice(0);
        }
        else if (obj instanceof Object) {
            let ret: TMap<any> = {};
            for (let i in obj) {
                ret[i] = obj[i];
            }
            return ret;
        }
        else {
            return obj;
        }
    }

    // 深度复制
    export function deepCopy(obj: any): any {
        if (obj instanceof Array) {
            var ret = [];
            for (var i = 0; i < obj.length; ++i) {
                ret.push(deepCopy(obj[i]));
            }
            return ret;
        }
        else if (obj instanceof Object) {
            let ret: TMap<any> = {};
            for (let i in obj) {
                ret[i] = deepCopy(obj[i]);
            }
            return ret;
        }
        else {
            return obj;
        }
    }

    // 针对数组arr进行排序，改变原数组
    export function sort<T>(arr: T[], func?: (a: T, b: T) => number): void {
        func ? arr.sort(func) : arr.sort();
    }

    // 针对数组进行过滤，并且返回新的数组; 不改变原数组
    export function grep<T>(arr: T[], filter: (a: T) => boolean): T[] {
        let r = [];
        for (let i = 0; i < arr.length; ++i) {
            let v = arr[i];
            if (filter(v)) {
                r.push(v);
            }
        }
        return r;
    }

    // 针对数组的每一个元素进行处理，返回新的数组; 不改变原数组
    export function map<T1, T2>(arr: T1[], func: (a1: T1) => T2): T2[] {
        let r = [];
        for (let i = 0; i < arr.length; ++i) {
            let v = arr[i];
            r.push(func(v));
        }
        return r;
    }

    // 针对数组的每一个元素进行处理，返回新的数组; 不改变原数组
    export function mmap<T1, T2>(arr: T1[], func: (a1: T1) => T2[]): T2[] {
        let r: any[] = [];
        for (let i = 0; i < arr.length; ++i) {
            let v = arr[i];
            r.concat(func(v));
        }
        return r;
    }

    export function tableSize(t: object): number {
        return t instanceof Array ? t.length : Object.keys(t).length;
    }

    export function tableEmpty(t: object): boolean {
        return nox.tableSize(t) == 0;
    }

    export function hasUniqueItem<T>(t: T[], v: T): boolean {
        let index = t.indexOf(v);
        return index >= 0;
    }

    export function addUniqueItem<T>(t: T[], v: T): T[] {
        let index = t.indexOf(v);
        if (index < 0) {
            t.push(v);
        }
        return t;
    }

    export function removeUniqueItem<T>(t: T[], v: T): boolean {
        let index = t.indexOf(v);
        if (index >= 0) {
            t.splice(index, 1);
            return true;
        }
        return false;
    }


    //----  数学函数
    // 弧度转角度
    (Math as any).deg = (Math as any).deg || function (radian: number) {
        return 180 / Math.PI * radian;
    };

    /*
    export function modf(v: number): [number, number] {
        let str = v + "";
        let b = str.split(".");
        return [b[0] ? parseInt(b[0]) : 0, b[1] ? parseInt(b[1]) : 0];
    }
    */

    // 求余数
    export function fmodf(y: number, x: number): number {
        // 5.1 % 3 == 2.1
        // -5.1 % 3 == -2.1
        // 5.1 % -1 == 2.1
        // -5.1 % -3 == -2.1
        return y % x;
    }

    export function positiveMod(lhs: number, rhs: number): number {
        return (lhs % rhs + rhs) % rhs;
    }

    export function positiveModf(lhs: number, rhs: number): number {
        return fmodf(fmodf(lhs, rhs) + rhs, rhs);
    }

    export function deg(radian: number): number {
        return 180 / Math.PI * radian;
    }

    export const max = Math.max;
    export const min = Math.min;
    export const floor = Math.floor;
    export const ceil = Math.ceil;
    export const round = Math.round;
    export const abs = Math.abs;
    export const atan = Math.atan;
    export const atan2 = Math.atan2;
    export const pow: Function | void = Math.pow || nox.error("Math.pow not found");
    cc_assert(Math.PI);
    export const PI: number = Math.PI;
    export const PI_2: number = PI / 2.0;
    export const PI_4: number = PI / 4.0;
    export const TAU: number = Math.PI * 2.0;

    export function rad2deg(radians: number): number {
        return radians * (180 / Math.PI);
    }

    export function deg2rad(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    export function tanAngle(from: Vec2, to: Vec2): number {
        let xdis = to.x - from.x;	//计算临边长度
        let ydis = to.y - from.y;	//计算对边长度
        let tanValue = nox.atan2(ydis, xdis);	//反正切得到弧度
        let angle = nox.rad2deg(tanValue);	//弧度转换为角度
        return angle;
    }

    //---- 随机数相关

    // 获得随机数(0-1之间的浮点)
    export const randomSeed = function () { };
    export const random = Math.random;

    //获取随机整数 返回startCount和endCount中间的值, 可能会出现startCount和endCount
    export function randomI(first: number, last: number): number {
        return first + Math.floor(Math.random() * (last + 1 - first));
    }

    // 获取随机浮点数
    export function randomF(begin: number, end: number): number {
        return begin + (end - begin) * Math.random();
    }

    // 获得随机项
    export function getRandomItem<T>(arr: T[]): T {
        CC_DEBUG && cc_assert(arr instanceof Array, "getRandomItem: arr should be Array");
        if (arr.length > 0) {
            let index = Math.floor(Math.random() * arr.length);
            return arr[index];
        }
        return null!;
    }

    // 获得随机索引
    export function getRandomIndex<T>(t: T[]): number {
        return Math.floor(Math.random() * t.length);
    }

    // 获得对象的随机key
    export function getRandomKey<T>(t: { [key: string]: T }): string {
        return nox.getRandomItem(nox.keys(t));
    }

    // 数组随机排序
    export function getRandomArray<T>(array: T[]): T[] {
        var srcArray = array.slice(0);
        var newArray = [];
        while (srcArray.length > 0) {
            var index = nox.randomI(0, srcArray.length - 1);
            newArray.push(srcArray[index]);
            srcArray.splice(index, 1);
        }
        return newArray;
    }

    //---- 打印输出帮助函数

    export const log = CC_DEBUG ? _cc_log : function (...args: any[]) { };

    export const logf = CC_DEBUG ? function (fmt: string, ...args: any[]) {
        cc_log(sprintf(fmt, ...args));
    } : function (...args: any[]) { };

    export const warn = CC_DEBUG ? _cc_warn : function (...args: any[]) { };

    export const warnf = CC_DEBUG ? function (fmt: string, ...args: any[]) {
        cc_warn(sprintf(fmt, ...args));
    } : function (...args: any[]) { };

    export const error = CC_DEBUG ? function (e: Error | string, ...args: any[]) {
        if (e instanceof Error) {
            cc_error(e.message + "\n\n" + e.stack);
        }
        else {
            cc_error([].join.call(arguments, " "));
        }
    } : function (e: Error | string, ...args: any[]) { };

    export const errorf = CC_DEBUG ? function (fmt: string, ...args: any[]) {
        cc_error(sprintf(fmt, ...args));
    } : function (...args: any[]) { };

    export const assert = CC_DEBUG ? cc_assert : function (value: any, msg?: string) { };

    //---- 调试帮助函数

    // 获得函数名称
    export function getFunctionName(func: Function) {
        let name;
        if (typeof func == 'function' || typeof func == 'object') {
            name = ('' + func).match(/function\s*([\w\$]*)\s*\(/);
        }
        return name && name[1];
    }

    // 获得调用栈信息
    export function stackTrace() {
        var err = new Error();
        if (!err.stack) {
            // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
            // so try that as a special-case.
            try {
                throw new Error('0');
            } catch (e) {
                err = e as Error;
            }
            if (!err.stack) {
                return '(no stack trace available)';
            }
        }

        return err.stack.toString();
    }

    //---- 字符串切分或连接

    // 分割
    export function split(szFullString: string, szSeparator: string): string[] {
        return szFullString.split(szSeparator);
    }

    // 连接
    export function join(strArr: string[], delimiter: string): string {
        return strArr.join(delimiter);
    }

    export function pathJoin(...args: string[]): string {
        let path = [].join.call(arguments, "/");
        path = path.replace(/[\/\\]+/g, "/");
        return path;
    }

    // 分割为一维字符串数组
    export function splitToString(szFullString: string, sp1?: string): string[] {
        if (szFullString == null || szFullString == '') {
            return [];
        }
        if (sp1 == null) sp1 = '_';
        return szFullString.split(sp1);
    }

    // 分割为一维数字数组
    export function splitToNumber(szFullString: string, sp1?: string): number[] {
        if (szFullString == null || szFullString == '') {
            return [];
        }

        if (sp1 == null) sp1 = "_";
        let szString = nox.split(szFullString, sp1);
        let ret = [];
        for (let i = 0; i < szString.length; ++i) {
            ret.push(parseFloat(szString[i]));
        }
        return ret;
    }

    // 分割字符串并转化为二维数组
    export function splitToString2(szFullString: string, sp1: string = '|', sp2: string = '_'): string[][] {
        if (szFullString == null || szFullString == '') {
            return [];
        }
        if (sp1 == null) sp1 = "|";
        if (sp2 == null) sp2 = "_";
        let szString = nox.split(szFullString, sp1);
        let szArray = [];
        for (let i = 0; i < szString.length; ++i) {
            szArray[i] = nox.split(szString[i], sp2);
        }
        return szArray;
    }

    // 分割字符串并转化为二维数值数组
    export function splitToNumber2(szFullString: string, sp1: string = '|', sp2: string = '_'): number[][] {
        if (szFullString == null || szFullString == '') {
            return [];
        }
        if (sp1 == null) sp1 = "|";
        if (sp2 == null) sp2 = "_";
        let szString = nox.split(szFullString, sp1);
        let szArray = [];
        for (let i = 0; i < szString.length; ++i) {
            szArray[i] = nox.splitToNumber(szString[i], sp2);
        }
        return szArray;
    }

    // 分割字符串并转化为三维字符串数组
    export function splitToString3(szFullString: string, sp1: string = '#', sp2: string = '|', sp3: string = '_'): string[][][] {
        if (szFullString == null || szFullString == '') {
            return [];
        }
        if (sp1 == null) sp1 = "#";
        if (sp2 == null) sp2 = "|";
        if (sp3 == null) sp3 = "_";
        let szString = nox.split(szFullString, sp1);
        let szArray = [];
        for (let i = 0; i < szString.length; ++i) {
            szArray[i] = nox.splitToString2(szString[i], sp2, sp3);
        }
        return szArray;
    }

    // 分割字符串并转化为三维数值数组
    export function splitToNumber3(szFullString: string, sp1: string = '#', sp2: string = '|', sp3: string = '_'): number[][][] {
        if (szFullString == null || szFullString == '') {
            return [];
        }
        if (sp1 == null) sp1 = "#";
        if (sp2 == null) sp2 = "|";
        if (sp3 == null) sp3 = "_";
        let szString = nox.split(szFullString, sp1);
        let szArray = [];
        for (let i = 0; i < szString.length; ++i) {
            szArray[i] = nox.splitToNumber2(szString[i], sp2, sp3);
        }
        return szArray;
    }
}
