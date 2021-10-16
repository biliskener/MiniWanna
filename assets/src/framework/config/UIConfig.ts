// 特别说明: 此文件包含多种配置, 添加配置时请考虑清楚放置在哪段

import { Color } from "cc";
import { cc_color, cc_view } from "../core/nox";
import { RichTextParam } from "../core/T";

//--------------------------------------------------------------------------
// 屏幕配置
//--------------------------------------------------------------------------
export class UIConfig {
    public static get designResolutionSize() {
        return cc_view.getDesignResolutionSize();
    }

    public static get designResolutionWidth() {
        return cc_view.getDesignResolutionSize().width;
    }

    public static get designResolutionHeight() {
        return cc_view.getDesignResolutionSize().height;
    }

    public static get visibleSize() {
        return cc_view.getVisibleSize();
    }

    public static get visibleWidth() {
        return cc_view.getVisibleSize().width;
    }

    public static get visibleHeight() {
        return cc_view.getVisibleSize().height;
    }

    public static get screenEdgeX() {
        return Math.max(0, cc_view.getVisibleSize().width / 2 - cc_view.getDesignResolutionSize().width / 2);
    }
}

export module UIConfig {
    //--------------------------------------------------------------------------
    // MASK配置
    //--------------------------------------------------------------------------
    export const MASK_OPACITY_LIGHT = 128;
    export const MASK_OPACITY_DARK = 200;

    //--------------------------------------------------------------------------
    // 颜色配置
    //--------------------------------------------------------------------------
    export const COLOR_BMFONT = cc_color(255, 250, 240);

    export const COLOR_TEXT_TITLE = cc_color(255, 200, 0);
    export const COLOR_TEXT_TITLE_DESC = cc_color(230, 200, 160);
    export const COLOR_BUTTON_TITLE = cc_color(252, 234, 170);

    export const COLOR_LABEL_LIGHT = cc_color(240, 150, 70);
    export const COLOR_LABEL_DARK = cc_color(96, 64, 32);
    export const COLOR_TEXT_LIGHT = COLOR_BMFONT;
    export const COLOR_TEXT_DARK = cc_color(40, 20, 0);

    export const COLOR_TEXT_WHITE = COLOR_BMFONT;
    export const COLOR_TEXT_GREEN = cc_color(200, 250, 150);
    export const COLOR_TEXT_DARK_GREEN = cc_color(40, 210, 40);
    export const COLOR_TEXT_BLUE = cc_color(150, 220, 250);
    export const COLOR_TEXT_BLUE_2 = cc_color(0, 120, 230);
    export const COLOR_TEXT_PURPLE = cc_color(220, 130, 255);
    export const COLOR_TEXT_ORANGE = cc_color(255, 200, 60);
    export const COLOR_TEXT_RED = cc_color(255, 100, 100);
    export const COLOR_TEXT_GREEN_DARK = cc_color(60, 255, 80);
    export const COLOR_TEXT_BLUE_DARK = cc_color(0, 0, 128);
    export const COLOR_TEXT_PURPLE_DARK = cc_color(160, 0, 160);
    export const COLOR_TEXT_ORANGE_DARK = cc_color(150, 120, 20);
    export const COLOR_TEXT_RED_DARK = cc_color(180, 10, 10);
    export const COLOR_TEXT_GRAY = cc_color(96, 96, 96);
    export const COLOR_TEXT_LIGHT_BLUE = cc_color(75, 255, 250);

    export const COLOR_GLOW = cc_color(250, 250, 120);
    export const COLOR_GLOW_BLUE = cc_color(180, 250, 250);
    export const COLOR_DARK_BG = cc_color(64, 64, 64);

    //--------------------------------------------------------------------------
    // 字体配置
    //--------------------------------------------------------------------------
    export const defaultTTFFont = "ARIALUNI.TTF";
    export const defaultUIFont = "ARIALUNI.TTF";

    export const TTF_FONT = defaultTTFFont;
    //export let BMFontSize: { B1: number, B2: number, M1: number, M2: number, S1: number, S2: number, S3: number, S4: number };
    //export let UIFontSize: { B1: number, B2: number, M1: number, M2: number, S1: number, S2: number, S3: number, S4: number };
    //export let TTFFontSize: { B1: number, B2: number, M1: number, M2: number, S1: number, S2: number, S3: number, S4: number };
    //export let FontSize: { B1: number, B2: number, M1: number, M2: number, S1: number, S2: number, S3: number, S4: number };

    // 注意，字体大小只能为18和23，否则会和微端效果不一致，因为在LabelTTF中被限定死了。
    // 若要解除限定，要找我liujun。
    export const BMFontSize = {
        B1: 48,
        B2: 36,
        M1: 32,
        M2: 28,
        S1: 26,
        S2: 22,
        S3: 20,
        S4: 18,
    };
    export const UIFontSize = {
        B1: 48,
        B2: 36,
        M1: 32,
        M2: 28,
        S1: 26,
        S2: 22,
        S3: 20,
        S4: 18,
    };
    export const TTFFontSize = {
        B1: 48,
        B2: 36,
        M1: 32,
        M2: 28,
        S1: 26,
        S2: 22,
        S3: 20,
        S4: 18,
    };
    export const FontSize = TTFFontSize;

    //--------------------------------------------------------------------------
    // 富文本相关
    //--------------------------------------------------------------------------
    export const RICHTEXT_PARAM_DARK_S1: RichTextParam = {
        color: COLOR_TEXT_DARK,
        boldColor: COLOR_TEXT_GREEN_DARK,
        size: FontSize.S1
    };
    export const RICHTEXT_PARAM_DARK_S2: RichTextParam = {
        color: COLOR_TEXT_DARK,
        boldColor: COLOR_TEXT_GREEN_DARK,
        size: FontSize.S2
    };
    export const RICHTEXT_PARAM_LIGHT_S1: RichTextParam = {
        color: COLOR_TEXT_LIGHT,
        boldColor: COLOR_TEXT_GREEN,
        size: FontSize.S1
    };
    export const RICHTEXT_PARAM_LIGHT_S2: RichTextParam = {
        color: COLOR_TEXT_LIGHT,
        boldColor: COLOR_TEXT_GREEN,
        size: FontSize.S2
    };
    export const RICHTEXT_PARAM_DARK_GEEN_S2: RichTextParam = {
        color: Color.BLACK,
        boldColor: COLOR_TEXT_DARK_GREEN,
        size: FontSize.S2
    };

    export function init(): void {
    }
}
