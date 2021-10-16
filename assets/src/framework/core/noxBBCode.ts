import { Color } from "cc";
import { cc_assert, CC_DEBUG } from "./nox";

export module noxBBCode {
    export function toHtmlColor(c: Color): string {
        return string.format('#%02x%02x%02x', c.r, c.g, c.b);
    }

    export function color(text: string, c: Color): string {
        return `<color=${toHtmlColor(c)}>${text}</>`;
    }

    export function size(text: string, s: number): string {
        return `<size=${s}>${text}</>`;
    }

    export function image(name: string, click?: string): string {
        if (click != null) {
            return `<img src='${name}' click='${click}' />`;
        }
        else {
            return `<img src='${name}' />`;
        }
    }

    export function on(text: string, name: string, param?: string): string {
        if (param == null) {
            return `<on click="${name}">${text}</on>`;
        }
        else {
            return `<on click="${name}" param="${param}">${text}</on>`;
        }
    }
}

export class noxBBCodeBuilder {
    private mContent: string = "";
    private mStack: [string, string][] = [];

    private push(bs: string, es: string): void {
        var beg = this.mContent + bs;
        var end = es;
        this.mContent = "";
        this.mStack.unshift([beg, end]);
    }

    public text(t: string): noxBBCodeBuilder {
        this.mContent += t;
        return this;
    }

    public img(src: string, click?: string): noxBBCodeBuilder {
        this.mContent += noxBBCode.image(src, click);
        return this;
    }

    public br(): noxBBCodeBuilder {
        this.mContent += "<br>";
        return this;
    }

    public color(c: Color): noxBBCodeBuilder {
        this.push(`<color=${noxBBCode.toHtmlColor(c)}>`, `</>`);
        return this;
    }

    public size(s: number): noxBBCodeBuilder {
        this.push(`<size=${s}>`, `</>`);
        return this;
    }

    public on(name: string, param?: string): noxBBCodeBuilder {
        if (param == null) {
            this.push(`<on click="${name}">`, `</on>`);
        }
        else {
            this.push(`<on click="${name}" param="${param}">`, `</on>`);
        }
        return this;
    }

    public back(): noxBBCodeBuilder {
        cc_assert(this.mStack.length > 0, "fatal error");
        var beg = this.mStack[0][0];
        var end = this.mStack[0][1];
        this.mContent = beg + this.mContent + end;
        this.mStack.shift();
        return this;
    }

    public end(): string {
        CC_DEBUG && cc_assert(this.mStack.length == 0, "fatal error");
        while (this.mStack.length > 0) {
            this.back();
        }
        return this.mContent;
    }
}
