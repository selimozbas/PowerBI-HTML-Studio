import type powerbi from "powerbi-visuals-api";
type CustomVisualSubSelection = powerbi.visuals.CustomVisualSubSelection;
type SubSelectionStyles = powerbi.visuals.SubSelectionStyles;
type VisualSubSelectionShortcuts = powerbi.visuals.VisualSubSelectionShortcuts;

/**
 * On-object formatting for HTML Studio.
 *
 * The content region is one sub-selectable object bound to the "styling"
 * formatting object; authors can additionally tag elements in their HTML
 * with `data-hf-object="content|styling|text"` to expose more regions
 * (translated to the real sub-selection attributes at mount time).
 *
 * Enum values are inlined as numbers on purpose: powerbi's `const enum`s
 * have no runtime object, and the non-webpack (test) transpile can't
 * resolve `powerbi.visuals.*` at runtime.
 */
const STYLE_TYPE_TEXT = 1; // powerbi.visuals.SubSelectionStylesType.Text
const SHORTCUT_RESET = 0; // powerbi.visuals.VisualShortcutType.Reset
const SHORTCUT_NAVIGATE = 1; // powerbi.visuals.VisualShortcutType.Navigate

export const HF_OBJECT_ATTR = "data-hf-object";

/** Author-facing names -> the formatting object the mini toolbar edits. */
export const HF_OBJECT_MAP: Record<string, "styling"> = {
    content: "styling",
    styling: "styling",
    text: "styling"
};

const STYLE_PROPS = ["fontFamily", "fontSize", "bold", "italic", "underline", "fontColor", "background"];
const ref = (propertyName: string) => ({ objectName: "styling", propertyName });

/** Text styles surfaced on the on-object mini toolbar for the content region. */
export function getSubSelectionStyles(subSelections: CustomVisualSubSelection[]): SubSelectionStyles | undefined {
    const objectName = subSelections?.[0]?.customVisualObjects?.[0]?.objectName;
    if (objectName !== "styling") return undefined;
    return {
        type: STYLE_TYPE_TEXT,
        fontFamily: { reference: ref("fontFamily"), label: "Font family" },
        fontSize: { reference: ref("fontSize"), label: "Font size" },
        bold: { reference: ref("bold"), label: "Bold" },
        italic: { reference: ref("italic"), label: "Italic" },
        underline: { reference: ref("underline"), label: "Underline" },
        fontColor: { reference: ref("fontColor"), label: "Font color" },
        background: { reference: ref("background"), label: "Background" }
    } as unknown as SubSelectionStyles;
}

/** Reset + navigate-to-card shortcuts for the content region. */
export function getSubSelectionShortcuts(
    subSelections: CustomVisualSubSelection[],
    cardUid: string
): VisualSubSelectionShortcuts | undefined {
    const objectName = subSelections?.[0]?.customVisualObjects?.[0]?.objectName;
    if (objectName !== "styling") return undefined;
    return [
        { type: SHORTCUT_RESET, relatedResetFormattingIds: STYLE_PROPS.map(ref) },
        { type: SHORTCUT_NAVIGATE, destinationInfo: { cardUid }, label: "Format content style" }
    ] as unknown as VisualSubSelectionShortcuts;
}
