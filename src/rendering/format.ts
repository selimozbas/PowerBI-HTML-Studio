/**
 * Tiny, dependency-free value formatter used by template helpers.
 * Supports a practical subset of the ICU / Excel-style number patterns
 * that report authors reach for: "0", "0.00", "#,##0", "0%", "0.0%",
 * "$#,##0.00", and plain date tokens "yyyy-MM-dd", "dd/MM/yyyy".
 *
 * It is deliberately not a full number-format implementation - anything
 * exotic should be produced in DAX and passed through as text.
 */

export function formatValue(value: unknown, pattern: string, locale = "en-US"): string {
    if (value == null || value === "") {
        return "";
    }

    if (pattern && /[yMdHms]/.test(pattern) && (value instanceof Date || !isNaN(Date.parse(String(value))))) {
        return formatDate(value instanceof Date ? value : new Date(String(value)), pattern);
    }

    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.\-eE]/g, ""));
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
    const decPart = core.split(".")[1] || "";
    const minFractionDigits = (decPart.match(/0/g) || []).length;
    const maxFractionDigits = Math.max(minFractionDigits, decPart.length);

    let scaled = isPercent ? num * 100 : num;

    const formatted = new Intl.NumberFormat(locale, {
        useGrouping,
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: maxFractionDigits || (isPercent ? 0 : 2)
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
