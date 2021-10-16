//---- HTTP帮助函数
export module noxHttp {
    export function getString(url: string, callback: (statusCode: number, resp: string, respText: string) => any): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let resp: string = xhr.responseText;
                callback && callback(xhr.status, resp, xhr.responseText);
            }
        };
        xhr.onerror = function (err) {
            callback && callback(-1, "", "Network error");
        };
        xhr.send();
        return xhr;
    }

    export function getJson(url: string, callback: (statusCode: number, resp: object | null, respText: string) => any): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let resp = null;
                try {
                    if (xhr.responseText != "") {
                        resp = JSON.parse(xhr.responseText);
                    }
                }
                catch (e) {
                }
                callback && callback(xhr.status, resp, xhr.responseText);
            }
        };
        xhr.onerror = function (err) {
            callback && callback(-1, null, "Network error");
        };
        xhr.send();
        return xhr;
    }

    export function postJson(url: string, data: object | string, callback: (statusCode: number, resp: object | null, respText: string) => any): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let resp = null;
                try {
                    if (xhr.responseText != "") {
                        resp = JSON.parse(xhr.responseText);
                    }
                }
                catch (e) {
                }
                callback && callback(xhr.status, resp, xhr.responseText);
            }
        };
        xhr.onerror = function (err) {
            callback && callback(-1, null, "Network error");
        };
        var text = typeof (data) == "string" ? data : JSON.stringify(data);
        xhr.send(text);
        return xhr;
    }

    /*
    export function postForm(url: string, data: object | string, callback?: (statusCode: number, resp: object | null, respText: string) => any): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                CC_DEBUG && nox.log(xhr.responseText);
                callback && callback(xhr.status, xhr.responseText != "" && JSON.parse(xhr.responseText), xhr.responseText);
            }
        };
        xhr.onerror = function (err) {
            callback && callback(-1, null, "Network error");
        };
        if (typeof (data) == "object") {
            let data2 = [];
            for (let key in data) {
                let value = (data as any)[key];
                data2.push(key + "=" + encodeURI(value));
            }
            data = data2.join("&");
        }
        xhr.send(data);
        return xhr;
    }

    export function postJsonSpecial(url: string, data: object | string, callback: (statusCode: number, resp: object | null, respText: string) => any): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let resp = null;
                try {
                    if (xhr.responseText != "") {
                        resp = JSON.parse(xhr.responseText);
                    }
                }
                catch (e) {
                }
                callback && callback(xhr.status, resp, xhr.responseText);
            }
        };
        xhr.onerror = function (err) {
            callback && callback(-1, null, "Network error");
        };
        var text = typeof (data) == "string" ? data : `data=${encodeURI(JSON.stringify(data))}`;
        xhr.send(text);
        return xhr;
    }

    export function postBase64(url: string, data: string, callback: (statusCode: number, resp: object | null, respText: string) => any): XMLHttpRequest {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        //xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                let resp = null;
                try {
                    if (xhr.responseText != "") {
                        resp = JSON.parse(xhr.responseText);
                    }
                }
                catch (e) {
                }
                callback && callback(xhr.status, resp, xhr.responseText);
            }
        };
        xhr.onerror = function (err) {
            callback && callback(-1, null, "Network error");
        };
        xhr.send(data);
        return xhr;
    }
    */
}
