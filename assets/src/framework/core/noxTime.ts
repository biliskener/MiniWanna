import { cc_assert, cc_director } from "./nox";

//---- 时间相关 noxt
export module noxTime {
    //返回毫秒
    export function getTickCount(): number {
        return cc_director.getTotalTime();
    }

    // 程序当前时间
    export function getNow() {
        return (new Date()).getTime() / 1000.0;
    }

    // 程序开始时间
    export const AppStartTime = getNow();

    // 程序运行时间
    export function getRunningTime() {
        return getNow() - AppStartTime;
    }

    export function absTime(time: number): number {
        return time * cc_director.getScheduler().getTimeScale();
    }

    export function getYearOfTimeSeconds(time: number): number {
        let date = new Date();
        date.setTime(time * 1000);
        let r = date.getFullYear();
        return r;
    }

    export function getYearOfTimeSecondsWithFormat(time: number, format: string): string {
        return string.format(format, getYearOfTimeSeconds(time));
    }

    export function getMonthOfTimeSeconds(time: number): number {
        let date = new Date();
        date.setTime(time * 1000);
        let r = date.getMonth() + 1;
        return r;
    }

    export function getMonthOfTimeSecondsWithFormat(time: number, format: string): string {
        return string.format(format, getMonthOfTimeSeconds(time));
    }

    export function getDayOfTimeSeconds(time: number): number {
        let date = new Date();
        date.setTime(time * 1000);
        let r = date.getDate();
        return r;
    }

    export function getDayOfTimeSecondsWithFormat(time: number, format: string): string {
        return string.format(format, getDayOfTimeSeconds(time));
    }

    export function getHoursOfTimeSeconds(time: number): number {
        let date = new Date();
        date.setTime(time * 1000);
        let r = date.getHours();
        return r;
    }

    export function getHoursOfTimeSecondsWithFormat(time: number, format: string): string {
        return string.format(format, getHoursOfTimeSeconds(time));
    }

    export function getMinutesOfTimeSeconds(time: number): number {
        let date = new Date();
        date.setTime(time * 1000);
        let r = date.getMinutes();
        return r;
    }

    export function getMinutesOfTimeSecondsWithFormat(time: number, format: string): string {
        return string.format(format, getMinutesOfTimeSeconds(time));
    }

    export function getSecondsOfTimeSeconds(time: number): number {
        cc_assert(typeof (time) == "number");
        let date = new Date();
        date.setTime(time * 1000);
        let r = date.getSeconds();
        return r;
    }

    export function getSecondsOfTimeSecondsWithFormat(time: number, format: string): string {
        return string.format(format, getSecondsOfTimeSeconds(time));
    }

    export type DateTable = {
        year: number,
        month: number,
        day: number,
        hours: number,
        minutes: number,
        seconds: number,
        millSeconds: number,
    };

    export function getTimeSecondsFromDateTable(date: DateTable | Date): number {
        if (date instanceof Date) {
            return Math.floor(date.getTime() / 1000);
        }
        else {
            let d = new Date();
            date.year != null && d.setFullYear(date.year);
            date.month != null && d.setMonth(date.month - 1);
            date.day != null && d.setDate(date.day);
            date.hours != null ? d.setHours(date.hours) : 0;
            date.minutes != null ? d.setMinutes(date.minutes) : 0;
            date.seconds != null ? d.setSeconds(date.seconds) : 0;
            date.millSeconds != null ? d.setMilliseconds(date.millSeconds) : 0;
            return Math.floor(d.getTime() / 1000);
        }
    }

    export function getDateTableFromTimeSeconds(time: Date | number): DateTable {
        let date = new Date();
        if (time instanceof Date) {
            date = time;
        }
        else {
            date.setTime(time * 1000);
        }

        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hours: date.getHours(),
            minutes: date.getMinutes(),
            seconds: date.getSeconds(),
            millSeconds: date.getMilliseconds(),
        };
    }
}
