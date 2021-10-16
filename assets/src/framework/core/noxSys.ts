import { cc_sys } from "./nox";

export module noxSys {
    export function openUrl(url: string): void {
        cc_sys.openURL(url);
    }
}
