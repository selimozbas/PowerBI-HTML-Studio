/**
 * Builds the font CSS that is prepended to the injected stylesheet.
 *
 * `googleFamilies` is a comma-separated list where each entry is a family
 * name with an optional `:weights` suffix, e.g.
 *   "Roboto, Open Sans:400;700, Cairo:400;700"
 * It becomes a single `@import` from fonts.googleapis.com (allowed by the
 * WebAccess privilege declared in capabilities.json).
 *
 * `fontFaceCss` is passed through verbatim - use it for self-hosted fonts
 * embedded as `src: url(data:font/woff2;base64,...)`.
 */
export function buildFontCss(googleFamilies: string, fontFaceCss: string): string {
    const parts: string[] = [];

    const families = (googleFamilies || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => {
            const [name, weights] = entry.split(":");
            const fam = name.trim().replace(/\s+/g, "+");
            const w = (weights || "").split(";").map((x) => x.trim()).filter(Boolean);
            return w.length ? `family=${fam}:wght@${w.join(";")}` : `family=${fam}`;
        });

    if (families.length) {
        parts.push(`@import url('https://fonts.googleapis.com/css2?${families.join("&")}&display=swap');`);
    }
    if (fontFaceCss && fontFaceCss.trim()) {
        parts.push(fontFaceCss.trim());
    }
    return parts.join("\n");
}
