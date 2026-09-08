import uPlot from "uplot";

/**
 * Real interactive charts inside authored HTML. An element with
 *   <div data-hf-chart='{"type":"line","x":"Month","y":["Actual","Target"]}'></div>
 * gets a uPlot canvas built from the bound rows (or from inline
 * `"data": [[x…],[y1…],…]`). uPlot is ~45 KB, canvas-based, works in the
 * sandbox and in static export.
 */

const UPLOT_CSS =
    '.uplot, .uplot *, .uplot *::before, .uplot *::after {box-sizing: border-box;}' +
    '.uplot {font-family: inherit; line-height: 1.5; width: min-content;}' +
    '.u-title {text-align: center; font-size: 14px; font-weight: bold;}' +
    '.u-wrap {position: relative; user-select: none;}' +
    '.u-over, .u-under {position: absolute;}' +
    '.u-under {overflow: hidden;}' +
    '.uplot canvas {display: block; position: relative; width: 100%; height: 100%;}' +
    '.u-axis {position: absolute;}' +
    '.u-legend {font-size: 12px; margin: auto; text-align: center;}' +
    '.u-legend .u-marker {width: 1em; height: 1em; margin-right: 4px; background-clip: padding-box !important;}' +
    '.u-legend .u-series > * {padding: 4px;}' +
    '.u-legend .u-series th {cursor: pointer;}' +
    '.u-legend .u-off > * {opacity: 0.3;}' +
    '.u-select {background: rgba(0,0,0,0.07); position: absolute; pointer-events: none;}' +
    '.u-cursor-x, .u-cursor-y {position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform;}' +
    '.u-hz .u-cursor-x, .u-vt .u-cursor-y {height: 100%; border-right: 1px dashed #888;}' +
    '.u-hz .u-cursor-y, .u-vt .u-cursor-x {width: 100%; border-bottom: 1px dashed #888;}' +
    '.u-cursor-pt {position: absolute; top: 0; left: 0; border-radius: 50%; border: 0 solid; pointer-events: none; will-change: transform; background-clip: padding-box !important;}' +
    '.u-axis.u-off, .u-select.u-off, .u-cursor-x.u-off, .u-cursor-y.u-off, .u-cursor-pt.u-off {display: none;}';

const FALLBACK_PALETTE = ["#118DFF", "#12239E", "#E66C37", "#6B007B", "#E044A7", "#744EC2"];

let cssInjected = false;
function ensureCss(): void {
    if (cssInjected) return;
    cssInjected = true;
    const style = document.createElement("style");
    style.id = "hf-uplot-css";
    style.textContent = UPLOT_CSS;
    document.head.appendChild(style);
}

export interface HfChartSpec {
    type?: "line" | "spline" | "area" | "bar";
    x?: string;
    y?: string[] | string;
    data?: number[][];
    height?: number;
    legend?: boolean;
    colors?: string[];
}

export interface ChartInstance {
    destroy(): void;
    resize(width: number): void;
}

type Row = Record<string, unknown>;

function toNum(v: unknown): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.\-eE]/g, ""));
    return isNaN(n) ? null : n;
}

function palette(root: HTMLElement, spec: HfChartSpec): string[] {
    if (Array.isArray(spec.colors) && spec.colors.length) return spec.colors;
    const styles = getComputedStyle(root);
    const accents = ["--hf-accent", "--hf-accent-2", "--hf-accent-3"]
        .map((v) => styles.getPropertyValue(v).trim())
        .filter(Boolean);
    return accents.length ? accents.concat(FALLBACK_PALETTE) : FALLBACK_PALETTE;
}

function fg(root: HTMLElement): string {
    return getComputedStyle(root).getPropertyValue("--hf-muted").trim() || "#888";
}

export function renderCharts(root: HTMLElement, rows: Row[]): ChartInstance[] {
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-hf-chart]"));
    if (!nodes.length) return [];
    ensureCss();

    const out: ChartInstance[] = [];
    for (const node of nodes) {
        let spec: HfChartSpec;
        try {
            spec = JSON.parse(node.getAttribute("data-hf-chart") || "{}");
        } catch {
            continue;
        }
        const inst = buildOne(node, spec, rows);
        if (inst) out.push(inst);
    }
    return out;
}

function buildOne(node: HTMLElement, spec: HfChartSpec, rows: Row[]): ChartInstance | null {
    const height = Number(spec.height) || 160;
    const width = node.clientWidth || node.parentElement?.clientWidth || 320;

    let data: (number | null)[][];
    let labels: string[] | null = null;
    let seriesLabels: string[];

    if (Array.isArray(spec.data) && spec.data.length >= 2) {
        data = spec.data as (number | null)[][];
        seriesLabels = data.slice(1).map((_, i) => `S${i + 1}`);
    } else {
        const yFields = Array.isArray(spec.y) ? spec.y : spec.y ? [spec.y] : [];
        if (!yFields.length || !rows.length) return null;
        const xNumeric = spec.x ? rows.every((r) => toNum(r[spec.x as string]) !== null) : false;
        const xVals = spec.x && xNumeric ? rows.map((r) => toNum(r[spec.x as string]) as number) : rows.map((_, i) => i);
        if (spec.x && !xNumeric) labels = rows.map((r) => String(r[spec.x as string] ?? ""));
        data = [xVals, ...yFields.map((f) => rows.map((r) => toNum(r[f])))];
        seriesLabels = yFields;
    }

    const colors = palette(node, spec);
    const axisColor = fg(node);
    const paths =
        spec.type === "bar"
            ? uPlot.paths.bars?.({ size: [0.6, 60] })
            : spec.type === "spline"
                ? uPlot.paths.spline?.()
                : undefined;

    const opts: uPlot.Options = {
        width,
        height,
        legend: { show: spec.legend !== false && seriesLabels.length > 1 },
        cursor: { show: true },
        scales: { x: { time: false } },
        axes: [
            {
                stroke: axisColor,
                grid: { stroke: "rgba(128,128,128,.15)" },
                ticks: { stroke: "rgba(128,128,128,.15)" },
                values: labels ? (_u, splits) => splits.map((s) => labels?.[s] ?? "") : undefined
            },
            {
                stroke: axisColor,
                grid: { stroke: "rgba(128,128,128,.15)" },
                ticks: { stroke: "rgba(128,128,128,.15)" }
            }
        ],
        series: [
            {},
            ...seriesLabels.map((label, i) => ({
                label,
                stroke: colors[i % colors.length],
                width: 2,
                fill: spec.type === "area" ? colors[i % colors.length] + "22" : undefined,
                paths,
                points: { show: (data[0]?.length ?? 0) <= 30 }
            }))
        ]
    };

    const u = new uPlot(opts, data as uPlot.AlignedData, node);
    return {
        destroy: () => u.destroy(),
        resize: (w: number) => u.setSize({ width: Math.max(80, w || width), height })
    };
}

export function disposeCharts(instances: ChartInstance[]): void {
    instances.forEach((c) => {
        try {
            c.destroy();
        } catch {
            /* canvas already gone */
        }
    });
}
