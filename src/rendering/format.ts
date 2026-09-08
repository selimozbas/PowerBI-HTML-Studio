/**
 * Tiny, dependency-free value formatter used by template helpers.
 * Supports a practical subset of the ICU / Excel-style number patterns
 * that report authors reach for: "0", "0.00", "#,##0", "0%", "0.0%",
 * "$#,##0.00", and plain date tokens "yyyy-MM-dd", "dd/MM/yyyy".
 *
 * It is deliberately not a full number-format implementation - anything
 * exotic should be produced in DAX and passed through as text.
 */

import { parseNumeric, toDate } from "./numeric";

const DATE_TOKENS = /y{2,4}|MM|dd|HH|mm|ss/;

export function formatValue(value: unknown, pattern: string, locale = "en-US"): string {
    if (value == null || value === "") {
        return "";
    }

    if (pattern && DATE_TOKENS.test(pattern)) {
        const d = toDate(value);
        // pattern is a date pattern: format the date, or pass the value through
        // rather than feeding a date pattern into the number formatter.
        return d ? formatDate(d, pattern) : String(value);
    }

    const num = parseNumeric(value);
    if (isNaN(num)) {
        return String(value);
    }
    return formatNumber(num, pattern || "0.##", locale);
}

function formatNumber(num: number, pattern: string, locale: string): string {
    const isPercent = pattern.indexOf("%") !== -1;
    const currencyMatch = pattern.match(/^([^\d#0.,]+)/);
    const prefix = currencyMatch ? currencyMatch[1] : "";
    const useGrouping = pattern.indexOf(",") !== -1;

    const core = pattern.replace(/[^0#.]/g, "");
    const hasFractionSpec = core.indexOf(".") !== -1;
    const decPart = core.split(".")[1] || "";
    const minFractionDigits = (decPart.match(/0/g) || []).length;
    // no "." in the pattern => explicit integer format; keep 0 decimals.
    const maxFractionDigits = hasFractionSpec
        ? Math.max(minFractionDigits, decPart.length)
        : minFractionDigits;

    const scaled = isPercent ? num * 100 : num;

    const formatted = new Intl.NumberFormat(locale, {
        useGrouping,
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits
    }).format(scaled);

    return `${prefix}${formatted}${isPercent ? "%" : ""}`;
}

function formatDate(d: Date, pattern: string): string {
    const pad = (n: number, len = 2) => String(n).padStart(len, "0");
    return pattern
        .replace(/yyyy/g, String(d.getFullYear()))
        .replace(/yy/g, pad(d.getFullYear() % 100))
        .replace(/MM/g, pad(d.getMonth() + 1))
        .replace(/dd/g, pad(d.getDate()))
        .replace(/HH/g, pad(d.getHours()))
        .replace(/mm/g, pad(d.getMinutes()))
        .replace(/ss/g, pad(d.getSeconds()));
}
