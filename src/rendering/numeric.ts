/**
 * Shared value coercion. Used by the formatter, the aggregation helpers
 * and conditional formatting so they agree on what "a number" is.
 *
 * Rules:
 *  - real numbers pass through
 *  - ISO date strings ("2024-03-15", "2024-03-15T09:00") -> NaN
 *    (they are dates, not numbers; the date path handles them)
 *  - `(1,234)` accounting notation -> -1234
 *  - otherwise strip non-numeric characters and parseFloat
 */

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

export function parseNumeric(value: unknown): number {
    if (typeof value === "number") return value;
    if (value == null) return NaN;
    const s = String(value).trim();
    if (s === "" || ISO_DATE_ONLY.test(s) || ISO_DATE_TIME.test(s)) return NaN;
    const accountingNeg = /^\(.*\)$/.test(s);
    const n = parseFloat(s.replace(/[^0-9.\-eE]/g, ""));
    if (isNaN(n)) return NaN;
    return accountingNeg && n > 0 ? -n : n;
}

/** Parse `#rgb` / `#rrggbb` / `#rrggbbaa` -> [r,g,b]; null when unusable. */
export function hexToRgb(hex: string): [number, number, number] | null {
    let h = String(hex || "").trim().replace(/^#/, "").toLowerCase();
    if (h.length === 3) h = h.split("").map((x) => x + x).join("");
    if (h.length === 8) h = h.slice(0, 6);
    if (h.length !== 6 || /[^0-9a-f]/.test(h)) return null;
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Only returns a Date when the value really is one (not e.g. `"2024"`). */
export function toDate(value: unknown): Date | null {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    const s = String(value).trim();
    if (ISO_DATE_ONLY.test(s)) {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d); // local midnight, stable day-of-month
    }
    if (ISO_DATE_TIME.test(s)) {
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}
