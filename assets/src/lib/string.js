(function (window) {
    var math = window.math = Math;
    var json = window.json = {};
    var string = window.string = {};

    json.encode = function (obj) {
        return JSON.stringify(obj);
    };

    json.decode = function (str) {
        return JSON.parse(str);
    };

    string.split = function (str, sep) {
        return str.split(sep);
    };

    string.splitByChar = string.split;

    string.trim = function (str) {
        return str.replace(/^\s*/, "").replace(/\s*$/, "");
    };

    string.format = sprintf;

    string.sub = function (str, beg, end) {
        cc.assert(false, "string.sub请不要再使用，因为Lua和JS的起始索引不一样");
        return str.substring(beg, end);
    };

    string.reverse = function (str) {
        return str.split("").reverse().join("");
    };

    string.find = function (str, pattern) {
        return str.indexOf(pattern);
    };

    string.hasSuffix = function (str, suffix) {
        if (str.length >= suffix.length && str.substr(str.length - suffix.length) == suffix) {
            return true;
        }
        return false;
    };

    string.hasPrefix = function (str, prefix) {
        if (str.length >= prefix.length && str.substr(0, prefix.length) == prefix) {
            return true;
        }
        return false;
    };

})(typeof (window) === "object" && window || typeof (global) === "object" && global || this);

