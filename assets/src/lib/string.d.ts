declare module json {
    function encode(obj: object): string;
    function decode(str: string): object;
}

declare module string {
    function split(str: string, sep: string): string[];

    function splitByChar(str: string, sep: string): string[];

    function trim(str: string): string;

    function format(fmt: string, ...values: any): string;

    function sub(str: string, beg: number, end?: number): string;

    function reverse(str: string): string;

    function find(str: string, pattern: string): number;

    function hasPrefix(str: string, prefix: string): boolean;

    function hasSuffix(str: string, suffix: string): boolean;
}
