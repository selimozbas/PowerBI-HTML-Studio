import { Helper } from "./templateEngine";
import { formatValue } from "./format";
import { sparkline, bar, ring, rating } from "./charts";
import { buildCollectionHelpers } from "./collectionHelpers";

/**
 * The helper functions exposed to templates as {{ name(args) }}.
 * All are pure and return primitives or self-contained SVG strings.
 */
export function buildHelpers(locale = "en-US"): Record<string, Helper> {
    return {
        ...buildCollectionHelpers(),
        format: (v, pattern) => formatValue(v, String(pattern ?? ""), locale),
        upper: (v) => String(v ?? "").toUpperCase(),
        lower: (v) => String(v ?? "").toLowerCase(),
        trim: (v) => String(v ?? "").trim(),
        "default": (v, fallback) => (v === undefined || v === null || v === "" ? fallback : v),
        add: (a, b) => Number(a) + Number(b),
        sub: (a, b) => Number(a) - Number(b),
        mul: (a, b) => Number(a) * Number(b),
        div: (a, b) => (Number(b) ? Number(a) / Number(b) : 0),
        pct: (a, b) => (Number(b) ? (Number(a) / Number(b)) * 100 : 0),
        round: (v, digits) => {
            const d = Number(digits ?? 0);
            const f = Math.pow(10, d);
            return Math.round(Number(v) * f) / f;
        },
        json: (v) => JSON.stringify(v),
        number: (v, decimals) => localeNumber(v, decimals, locale),
        percent: (v, decimals) => localePercent(v, decimals, locale),
        currency: (v, code) => localeCurrency(v, code, locale),
        date: (v, style) => localeDate(v, style, locale),
        selectAttr: (field, value) => {
            const spec = value === undefined ? String(field ?? "") : `${String(field)}:${String(value ?? "")}`;
            return `data-hf-select="${spec.replace(/"/g, "&quot;")}"`;
        },
        sparkline: (v, w, h) => sparkline(v, num(w, 80), num(h, 20)),
        bar: (v, max, w, h) => bar(Number(v), num(max, 100), num(w, 100), num(h, 10)),
        ring: (v, max, size) => ring(Number(v), num(max, 100), num(size, 36)),
        rating: (v, max, size) => rating(Number(v), num(max, 5), num(size, 14))
    };
}

function num(v: unknown, fallback: number): number {
    const n = Number(v);
    return isNaN(n) || v === undefined || v === "" ? fallback : n;
}

function toNumber(v: unknown): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-eE]/g, ""));
    return isNaN(n) ? null : n;
}

function localeNumber(v: unknown, decimals: unknown, locale: string): string {
    const n = toNumber(v);
    if (n === null) return "";
    const d = decimals === undefined || decimals === "" ? undefined : Number(decimals);
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: d,
        maximumFractionDigits: d ?? 3
    }).format(n);
}

function localePercent(v: unknown, decimals: unknown, locale: string): string {
    const n = toNumber(v);
    if (n === null) return "";
    const d = decimals === undefined || decimals === "" ? 0 : Number(decimals);
    return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: d,
        maximumFractionDigits: d
    }).format(n);
}

function localeCurrency(v: unknown, code: unknown, locale: string): string {
    const n = toNumber(v);
    if (n === null) return "";
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: String(code || "USD")
        }).format(n);
    } catch {
        return localeNumber(v, undefined, locale);
    }
}

function localeDate(v: unknown, style: unknown, locale: string): string {
    if (v === null || v === undefined || v === "") return "";
    const d = v instanceof Date ? v : new Date(String(v));
    if (isNaN(d.getTime())) return String(v);
    const s = String(style || "medium");
    const key = s === "time" ? "timeStyle" : "dateStyle";
    const val = s === "short" || s === "long" || s === "full" ? s : s === "time" ? "short" : "medium";
    const opts = { [key]: val } as unknown as Intl.DateTimeFormatOptions;
    return new Intl.DateTimeFormat(locale, opts).format(d);
}
