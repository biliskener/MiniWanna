export module LanguageConfig {
    // 是否是中文版本, 用来做字符的排版使用
    export function isChinese() {
        return true;
    }

    //是否需要空格作为断词标识! (拼接字符的时候需要使用)
    export function isNeedSpaceBreak(): boolean {
        // 越南和英语类似语言的时候返回true, 汉字类的返回false
        return false;
    }

    export function breakCharacter(): string {
        if (isNeedSpaceBreak()) {
            return " ";
        }
        else {
            return "";
        }
    }
}
