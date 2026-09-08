import powerbi from "powerbi-visuals-api";
import IColorPalette = powerbi.extensibility.IColorPalette;

/**
 * Turns the active report theme into CSS custom properties that authored
 * HTML can consume, so content visually matches the rest of the report:
 *
 *   .hf-card { color: var(--hf-foreground); background: var(--hf-background); }
 *   .accent  { color: var(--hf-accent); }
 */
export interface ThemeInput {
    palette: IColorPalette;
    isHighContrast?: boolean;
    foreground?: string;
    background?: string;
    fontFamily?: string;
}

export function buildThemeVars(t: ThemeInput): string {
    const p = t.palette as unknown as {
        foreground?: { value: string };
        background?: { value: string };
        foregroundNeutralSecondary?: { value: string };
        backgroundNeutral?: { value: string };
    };
    const accent = safeColor(t.palette, 0, "#118DFF");
    const vars: Record<string, string> = {
        "--hf-accent": accent,
        "--hf-accent-2": safeColor(t.palette, 1, "#12239E"),
        "--hf-accent-3": safeColor(t.palette, 2, "#E66C37"),
        "--hf-foreground": t.foreground || p.foreground?.value || "#252423",
        "--hf-background": t.background || p.background?.value || "#FFFFFF",
        "--hf-muted": p.foregroundNeutralSecondary?.value || "#605E5C",
        "--hf-track": p.backgroundNeutral?.value || "#E1DFDD",
        "--hf-font": t.fontFamily || "'Segoe UI', wf_segoe-ui_normal, helvetica, arial, sans-serif"
    };
    if (t.isHighContrast) {
        vars["--hf-foreground"] = t.foreground || "CanvasText";
        vars["--hf-background"] = t.background || "Canvas";
        vars["--hf-accent"] = "Highlight";
    }
    return Object.keys(vars)
        .map((k) => `${k}:${vars[k]}`)
        .join(";");
}

function safeColor(palette: IColorPalette, index: number, fallback: string): string {
    try {
        const c = palette.getColor(String(index));
        return c && c.value ? c.value : fallback;
    } catch {
        return fallback;
    }
}
