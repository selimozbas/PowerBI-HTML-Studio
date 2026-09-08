/**
 * Inline SVG mini-chart helpers. Every function returns a self-contained
 * <svg> string with no external references, so it survives the Power BI
 * sandbox and "export to PDF/PowerPoint".
 *
 * Colours default to the injected report-theme CSS variables (see
 * theme/themeVars.ts) with hard fallbacks for contexts where the
 * variables are absent (e.g. static export).
 */

const ACCENT = "var(--hf-accent, #118DFF)";
const MUTED = "var(--hf-muted, #C8C6C4)";
const TRACK = "var(--hf-track, #E1DFDD)";

export function parseSeries(input: unknown): number[] {
    if (Array.isArray(input)) {
        return input.map(Number).filter((n) => !isNaN(n));
    }
    return String(input ?? "")
        .split(/[\s,;]+/)
        .map((s) => parseFloat(s))
        .filter((n) => !isNaN(n));
}

export function sparkline(input: unknown, width = 80, height = 20): string {
    const data = parseSeries(input);
    if (data.length < 2) {
        return `<svg width="${width}" height="${height}" role="img" aria-label="sparkline"></svg>`;
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const step = width / (data.length - 1);
    const points = data
        .map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 2) - 1).toFixed(1)}`)
        .join(" ");
    return (
        `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="sparkline">` +
        `<polyline fill="none" stroke="${ACCENT}" stroke-width="1.5" points="${points}"/>` +
        `</svg>`
    );
}

export function bar(value: number, max = 100, width = 100, height = 10): string {
    const pct = Math.max(0, Math.min(1, max ? value / max : 0));
    return (
        `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${(pct * 100).toFixed(0)}%">` +
        `<rect width="${width}" height="${height}" rx="2" fill="${TRACK}"/>` +
        `<rect width="${(width * pct).toFixed(1)}" height="${height}" rx="2" fill="${ACCENT}"/>` +
        `</svg>`
    );
}

export function ring(value: number, max = 100, size = 36): string {
    const pct = Math.max(0, Math.min(1, max ? value / max : 0));
    const r = size / 2 - 4;
    const c = 2 * Math.PI * r;
    const cx = size / 2;
    return (
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${(pct * 100).toFixed(0)}%">` +
        `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${TRACK}" stroke-width="4"/>` +
        `<circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="${ACCENT}" stroke-width="4" ` +
        `stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" stroke-linecap="round" ` +
        `transform="rotate(-90 ${cx} ${cx})"/>` +
        `<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.28}">${(pct * 100).toFixed(0)}%</text>` +
        `</svg>`
    );
}

export function rating(value: number, max = 5, size = 14): string {
    const full = Math.round(Math.max(0, Math.min(max, value)));
    let stars = "";
    for (let i = 0; i < max; i++) {
        stars +=
            `<path transform="translate(${i * (size + 2)} 0)" fill="${i < full ? ACCENT : MUTED}" ` +
            `d="M${size / 2} 0l${size * 0.16} ${size * 0.34} ${size * 0.38} ${size * 0.05}-${size * 0.27} ${size * 0.26} ` +
            `${size * 0.07} ${size * 0.37}-${size * 0.34}-${size * 0.18}-${size * 0.34} ${size * 0.18} ${size * 0.07}-${size * 0.37}` +
            `-${size * 0.27}-${size * 0.26} ${size * 0.38}-${size * 0.05}z"/>`;
    }
    return `<svg width="${max * (size + 2)}" height="${size}" role="img" aria-label="${full} of ${max}">${stars}</svg>`;
}
