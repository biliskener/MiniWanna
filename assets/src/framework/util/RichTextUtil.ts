import { Color, Label, RichText, UITransform } from "cc";
import { LanguageConfig } from "../config/LanguageConfig";
import { UIConfig } from "../config/UIConfig";
import { noxBBCode } from "../core/noxBBCode";
import { noxcc } from "../core/noxcc";
import { LabelParam, RichTextParam } from "../core/T";
import { StaticPrefabMgr } from "../mgr/StaticPrefabMgr";

export module RichTextUtil {
    export function createLabel(text: string, param?: LabelParam): Label {
        var node = noxcc.newNode();
        var label = node.addComponent(Label);
        updateLabel(label, text, param);
        return label;
    }

    export function updateLabel(label: Label, text: string, param?: LabelParam): Label {
        var node = label.node;

        var width = param && param.width;
        var height = param && param.height;
        if (width != null && height != null) {
            noxcc.getOrAddComponent(node, UITransform).setContentSize(width, height);
        }
        if (height === 0) {
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
        }
        else {
            label.overflow = Label.Overflow.NONE;
        }

        label.fontSize = (param && param.size) ?? UIConfig.FontSize.S2;
        label.lineHeight = label.fontSize;
        label.enableWrapText = (param && param.wrap) ?? true;
        label.overflow = 0;
        var horzAlign = param && param.horzAlign;
        if (horzAlign != null) {
            label.horizontalAlign = horzAlign;
        }
        var vertAlign = param && param.vertAlign;
        if (vertAlign != null) {
            label.verticalAlign = vertAlign;
        }
        label.string = text;
        label.color = (param && param.color) ?? UIConfig.COLOR_TEXT_LIGHT;

        StaticPrefabMgr.configDefaultTTFFont(label);
        if (width != null && height != null) {
            noxcc.getOrAddComponent(node, UITransform).setContentSize(width, height || noxcc.h(node));
        }

        return label;
    }

    // 新建普通富文本
    export function newRichText(): RichText {
        var node = noxcc.newNode();
        var richText = node.addComponent(RichText);
        StaticPrefabMgr.configDefaultTTFFont(richText);
        richText.string = "";
        return richText;
    }

    // 添加文本
    export function appendText(richText: RichText, text: string, color?: Color, size?: number, family?: string): void {
        var code: string = text;
        if (color) code = noxBBCode.color(code, color);
        if (size) code = noxBBCode.size(code, size);
        richText.string = richText.string + code;
    }

    // 添加图片
    export function appendImage(richText: RichText, name: string): void {
        richText.string = richText.string + noxBBCode.image(name);
    }

    export function createRichText(str: string, param?: RichTextParam, maxWidth?: number) {
        param ??= {};

        var node = noxcc.newNode();
        var richText = node.addComponent(RichText);
        StaticPrefabMgr.configDefaultTTFFont(richText);

        richText.fontSize = param.size ?? UIConfig.FontSize.S2;
        maxWidth = param.width ?? maxWidth;
        if (maxWidth != null) {
            richText.maxWidth = maxWidth;
        }

        appendText(
            richText,
            str,
            param.boldColor ?? UIConfig.COLOR_TEXT_LIGHT,
            param.size ?? UIConfig.FontSize.S2,
            param.family ?? UIConfig.TTF_FONT
        );

        return richText;
    }

    // 创建加粗富文本
    export function createBoldRichText(text: string, param?: RichTextParam, maxWidth?: number): RichText {
        param ??= {};

        //部分文字换行成问题由于少空格
        //text = text.replace(/\|/g, "| ");

        var node = noxcc.newNode();
        var richText = node.addComponent(RichText);
        StaticPrefabMgr.configDefaultTTFFont(richText);

        richText.fontSize = param.size ?? UIConfig.FontSize.S2;
        maxWidth = param.width ?? maxWidth;
        if (maxWidth != null) {
            richText.maxWidth = maxWidth;
        }

        richText.string = createBoldBBCode(text, param);

        return richText;
    }

    // 添加加粗文本
    export function appendBoldRichText(richText: RichText, str: string, param: RichTextParam): void {
        param ??= {};

        var content: string = richText.string;
        //content += "<br/>";
        content += createBoldBBCode(str, param);

        richText.string = content;
    }

    export function updateBoldRichText(richText: RichText, str: string, param: RichTextParam): void {
        richText.string = "";
        appendBoldRichText(richText, str, param);
    }

    // 创建加粗富文本内容
    export function createBoldBBCode(str: string, param?: RichTextParam): string {
        param ??= {};

        var normalColor = param.color ?? UIConfig.COLOR_TEXT_LIGHT;
        var fontSize = param.size ?? UIConfig.FontSize.S2;
        var match = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;

        var content: string = "";
        var parts = str.split('|');
        for (var i = 0; i < parts.length; ++i) {
            var part = parts[i];
            if (part.length) {
                var text = "";
                var text2 = "";
                if (i % 2 == 0) {
                    text = part;
                    text = text.replace(/\r*\n/g, "<br/>");
                    text2 = noxBBCode.color(text, normalColor);
                }
                else {
                    var boldColor: Color = param.boldColor ?? UIConfig.COLOR_TEXT_PURPLE;
                    if (part[0] == '\\' && (part[1] == '#' || part[1] >= '0' && part[1] <= '9')) {
                        var begin = 1;
                        var end = part.indexOf('\\', begin);
                        if (end >= 0) {
                            var clrStr = part.substring(begin, end);
                            if (clrStr[0] == "#") {
                                var r = parseInt(clrStr.substring(1, 3), 16);
                                var g = parseInt(clrStr.substring(3, 5), 16);
                                var b = parseInt(clrStr.substring(5, 7), 16);
                                boldColor = noxcc.c3b(r, g, b);
                            }
                            else {
                                var clrParts = string.splitByChar(clrStr, '.');
                                if (clrParts.length == 1) {
                                    boldColor = (noxcc.COLOR as { [key: string]: Color })[clrParts[0]];
                                }
                                else {
                                    boldColor = noxcc.c3b(parseInt(clrParts[0]), parseInt(clrParts[1]), parseInt(clrParts[2]));
                                }
                            }
                        }
                        text = part.substr(end + 1);
                    }
                    else {
                        text = part;
                    }
                    text = text.replace(/\r*\n/g, "<br/>")
                    text2 = noxBBCode.color(text, boldColor);
                }
                if (match.test(text)) {
                    text2 = noxBBCode.on(text2, "onClick", text);
                }
                content += text2;
            }
        }

        return noxBBCode.size(content, fontSize);
    }

    export function createBoldRichTextWithIcons(str: string, param: RichTextParam, width: number): RichText {
        var node = noxcc.newNode();
        var richText = node.addComponent(RichText);
        StaticPrefabMgr.configDefaultTTFFont(richText);

        width = param.width ?? width;
        if (width != null) {
            richText.maxWidth = width;
        }

        var len = str.length;
        var pos1 = 0; // 当前位置
        while (pos1 < len) {
            var pos2 = str.indexOf('[', pos1);
            if (pos2 >= 0) {
                if (pos2 > pos1) {
                    appendBoldRichText(richText, str.substring(pos1, pos2), param);
                }

                pos1 = pos2;
                pos2 = str.indexOf(']', pos1 + 1);
                appendImage(richText, str.substring(pos1 + 1, pos2));

                pos1 = pos2 + 1;
            }
            else {
                appendBoldRichText(richText, str.substring(pos1, len), param);
                pos1 = len;
            }
        }
        return richText;
    }

    // 字符的格式化处理!!
    // ttf 要处理的字符
    // len 换行的字符
    // maxLine 最多换行的行数
    //isDealMoreWords 是否处理最后一行字符过多的字符, 默认为处理, 但是名称,标题等换行,此处应该传false
    export function trimMoreText(ttf: string, maxLength: number, maxLine: number | null = null, addDots: boolean = true): string {
        let destTtf = "";
        maxLine = maxLine || 0xFFF;
        let curLine = 1;
        while (ttf.length > maxLength) {
            var curText = ttf;
            curText = curText.replace("\n", "");
            var leftLength = maxLength;
            var leftWords = curText.substr(0, leftLength);
            // 中文
            if (LanguageConfig.isChinese()) {
            }
            else {
                // 其他语言, 以空格隔断的!
                let index = leftWords.lastIndexOf(" ");
                if (index != -1) {
                    leftWords = curText.substr(0, index + 1);
                    leftLength = index + 1;
                }
            }
            ttf = curText.substr(leftLength, curText.length - 1);
            curLine++;
            if (maxLine < curLine && ttf.length > 0 && addDots) {
                leftWords = curText.substr(0, leftLength - 4);
                leftWords = leftWords + "....";
                return destTtf = destTtf + leftWords;
            }
            else if (maxLine < curLine && ttf.length > 0 && !addDots) {
                return destTtf = destTtf + curText;
            }
            destTtf = destTtf + leftWords + "\n";
        }
        return destTtf + ttf;
    }
}
