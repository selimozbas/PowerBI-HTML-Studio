import { Helper } from "./templateEngine";
import { formatValue } from "./format";
import { sparkline, bar, ring, rating } from "./charts";

/**
 * The helper functions exposed to templates as {{ name(args) }}.
 * All are pure and return primitives or self-contained SVG strings.
 */
export function buildHelpers(locale = "en-US"): Record<string, Helper> {
    return {
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
