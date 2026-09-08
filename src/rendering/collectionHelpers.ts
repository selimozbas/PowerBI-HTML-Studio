import { Helper } from "./templateEngine";

/**
 * Aggregation / sort / filter helpers so authors can build subtotals,
 * top-N lists, "% of total", leaderboards and grouped sections without
 * DAX. All are pure and return plain arrays / numbers that the template
 * engine's `{{#each}}` and interpolation understand.
 *
 * `list` is normally `rows` (from the body template context); `field` is
 * a column display name. When `field` is omitted the list is treated as
 * a list of numbers.
 */

type Row = Record<string, unknown>;

function asArray(v: unknown): unknown[] {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") return Object.values(v);
    return [];
}

function numOf(item: unknown, field?: unknown): number {
    const raw = field ? (item as Row)?.[String(field)] : item;
    const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? "").replace(/[^0-9.\-eE]/g, ""));
    return isNaN(n) ? 0 : n;
}

function compareBy(field: unknown, dir: string) {
    const sign = String(dir).toLowerCase() === "desc" ? -1 : 1;
    return (a: unknown, b: unknown): number => {
        const av = field ? (a as Row)?.[String(field)] : a;
        const bv = field ? (b as Row)?.[String(field)] : b;
        const an = typeof av === "number" ? av : parseFloat(String(av));
        const bn = typeof bv === "number" ? bv : parseFloat(String(bv));
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * sign;
        return String(av ?? "").localeCompare(String(bv ?? "")) * sign;
    };
}

export function buildCollectionHelpers(): Record<string, Helper> {
    return {
        sum: (list, field) => asArray(list).reduce<number>((t, it) => t + numOf(it, field), 0),
        avg: (list, field) => {
            const arr = asArray(list);
            return arr.length ? arr.reduce<number>((t, it) => t + numOf(it, field), 0) / arr.length : 0;
        },
        min: (list, field) => {
            const arr = asArray(list);
            return arr.length ? Math.min(...arr.map((it) => numOf(it, field))) : 0;
        },
        max: (list, field) => {
            const arr = asArray(list);
            return arr.length ? Math.max(...arr.map((it) => numOf(it, field))) : 0;
        },
        count: (list) => asArray(list).length,
        pluck: (list, field) => asArray(list).map((it) => (it as Row)?.[String(field)]),
        first: (list, field) => {
            const it = asArray(list)[0];
            return field ? (it as Row)?.[String(field)] : it;
        },
        last: (list, field) => {
            const arr = asArray(list);
            const it = arr[arr.length - 1];
            return field ? (it as Row)?.[String(field)] : it;
        },
        sortBy: (list, field, dir) => asArray(list).slice().sort(compareBy(field, String(dir ?? "asc"))),
        where: (list, field, value) =>
            asArray(list).filter(
                (it) => String((it as Row)?.[String(field)] ?? "").trim().toLowerCase() === String(value ?? "").trim().toLowerCase()
            ),
        whereNot: (list, field, value) =>
            asArray(list).filter(
                (it) => String((it as Row)?.[String(field)] ?? "").trim().toLowerCase() !== String(value ?? "").trim().toLowerCase()
            ),
        top: (list, n, field) => asArray(list).slice().sort(compareBy(field, "desc")).slice(0, Math.max(0, Number(n) || 0)),
        bottom: (list, n, field) => asArray(list).slice().sort(compareBy(field, "asc")).slice(0, Math.max(0, Number(n) || 0)),
        rank: (list, field, item) => {
            const sorted = asArray(list).slice().sort(compareBy(field, "desc"));
            const target = numOf(item, field);
            const idx = sorted.findIndex((it) => numOf(it, field) === target);
            return idx === -1 ? sorted.length + 1 : idx + 1;
        },
        pctOfTotal: (value, list, field) => {
            const total = asArray(list).reduce<number>((t, it) => t + numOf(it, field), 0);
            return total ? (numOf(value) / total) * 100 : 0;
        },
        groupBy: (list, field) => {
            const groups = new Map<string, unknown[]>();
            for (const it of asArray(list)) {
                const key = String((it as Row)?.[String(field)] ?? "");
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key)!.push(it);
            }
            return Array.from(groups, ([key, items]) => ({ key, items, count: items.length }));
        },
        colorScale: (value, min, max, from, to) => interpolateColor(Number(value), Number(min), Number(max), String(from || "#ffffff"), String(to || "#118dff")),
        relativeTime: (v) => relativeTime(v),
        duration: (seconds) => formatDuration(Number(seconds)),
        split: (str, sep) => String(str ?? "").split(sep ? String(sep) : ",").map((s) => s.trim()).filter(Boolean),
        join: (list, sep) => asArray(list).join(sep === undefined ? ", " : String(sep)),
        initials: (name) =>
            String(name ?? "")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")
    };
}

function interpolateColor(value: number, min: number, max: number, from: string, to: string): string {
    const t = max === min ? 0 : Math.max(0, Math.min(1, (value - min) / (max - min)));
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
    return `#${[mix(0), mix(1), mix(2)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full || "000000", 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeTime(v: unknown): string {
    if (v === null || v === undefined || v === "") return "";
    const d = v instanceof Date ? v : new Date(String(v));
    if (isNaN(d.getTime())) return String(v);
    const diff = (d.getTime() - Date.now()) / 1000;
    const abs = Math.abs(diff);
    const units: Array<[number, string]> = [
        [60, "second"], [3600, "minute"], [86400, "hour"],
        [604800, "day"], [2629800, "week"], [31557600, "month"]
    ];
    let unit = "year";
    let scale = 31557600;
    for (let i = 0; i < units.length; i++) {
        if (abs < units[i][0]) {
            unit = i === 0 ? "second" : units[i - 1][1];
            scale = i === 0 ? 1 : units[i - 1][0];
            break;
        }
    }
    const n = Math.round(diff / scale);
    const RTF = (Intl as unknown as {
        RelativeTimeFormat?: new (l?: string, o?: { numeric?: string }) => { format: (n: number, u: string) => string };
    }).RelativeTimeFormat;
    if (RTF) {
        try {
            return new RTF(undefined, { numeric: "auto" }).format(n, unit);
        } catch {
            /* fall through to the plain-English form */
        }
    }
    return `${Math.abs(n)} ${unit}${Math.abs(n) === 1 ? "" : "s"} ${diff < 0 ? "ago" : "from now"}`;
}

function formatDuration(totalSeconds: number): string {
    if (!isFinite(totalSeconds)) return "";
    const s = Math.max(0, Math.round(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
