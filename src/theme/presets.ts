/**
 * Ready-made look-and-feel presets, injected ahead of the user's Custom
 * CSS so anything they add still wins. Each scopes to `.hf-content` so it
 * never fights the visual's own chrome.
 */
export const THEME_PRESETS: Record<string, string> = {
    none: "",

    card: `
.hf-content { padding: 12px; }
.hf-content .hf-row, .hf-content .card, .hf-content > * > div {
  background: var(--hf-background, #fff);
  border: 1px solid var(--hf-track, #e1dfdd);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}`,

    minimal: `
.hf-content { font-size: 12px; line-height: 1.5; color: var(--hf-foreground, #252423); }
.hf-content h1, .hf-content h2, .hf-content h3 { font-weight: 600; margin: .2em 0 .4em; }
.hf-content .hf-row { padding: 4px 0; border-bottom: 1px solid var(--hf-track, #eee); }
.hf-content a { color: var(--hf-accent, #118dff); text-decoration: none; }`,

    dark: `
.hf-content { background: #1b1a19; color: #f3f2f1; padding: 12px; border-radius: 8px; }
.hf-content .hf-row, .hf-content .card { background: #252423; border: 1px solid #3b3a39; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
.hf-content a { color: #4aa3ff; }
.hf-content .text-secondary, .hf-content small { color: #a19f9d !important; }`,

    newspaper: `
.hf-content { font-family: Georgia, "Times New Roman", serif; column-gap: 24px; }
.hf-content h1, .hf-content h2 { font-family: Georgia, serif; letter-spacing: -.01em; }
.hf-content .hf-row { border-bottom: 1px solid #ccc; padding: 8px 0; }
.hf-content p { text-align: justify; }`,

    tile: `
.hf-content { padding: 0; }
.hf-content .hf-row, .hf-content .card {
  background: linear-gradient(180deg, var(--hf-accent, #118dff) 0%, var(--hf-accent-2, #12239e) 100%);
  color: #fff; border-radius: 10px; padding: 16px; margin: 6px; min-height: 96px;
}
.hf-content .hf-row a, .hf-content .card a { color: #fff; text-decoration: underline; }`
};

export interface SanitizePreset {
    enabled: boolean;
    allowSvg: boolean;
    allowStyleTag: boolean;
}

/** `custom` means "use the individual toggles"; anything else overrides them. */
export const SANITIZE_PRESETS: Record<string, SanitizePreset | null> = {
    custom: null,
    strict: { enabled: true, allowSvg: true, allowStyleTag: false },
    standard: { enabled: true, allowSvg: true, allowStyleTag: true },
    trusted: { enabled: true, allowSvg: true, allowStyleTag: true }
};
