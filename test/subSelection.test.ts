import { describe, it, expect } from "vitest";
import { getSubSelectionStyles, getSubSelectionShortcuts, HF_OBJECT_MAP } from "../src/onObject/subSelection";

const ss = (objectName: string) =>
    [{ customVisualObjects: [{ objectName, selectionId: {} }], displayName: "x", subSelectionType: 1, selectionOrigin: { x: 0, y: 0 }, showUI: true }] as never;

describe("on-object sub-selection", () => {
    it("returns Text styles bound to the styling object", () => {
        const styles = getSubSelectionStyles(ss("styling"));
        expect(styles?.type).toBe(1); // SubSelectionStylesType.Text
        expect((styles as { fontFamily: { reference: { objectName: string } } }).fontFamily.reference.objectName).toBe("styling");
        expect((styles as { background?: { reference: { propertyName: string } } }).background?.reference.propertyName).toBe("background");
    });

    it("ignores unknown objects", () => {
        expect(getSubSelectionStyles(ss("nope"))).toBeUndefined();
        expect(getSubSelectionShortcuts(ss("nope"), "styling-card")).toBeUndefined();
    });

    it("shortcuts end with a navigate entry carrying the card uid", () => {
        const shortcuts = getSubSelectionShortcuts(ss("styling"), "styling-card")!;
        const last = shortcuts[shortcuts.length - 1] as { type: number; destinationInfo: { cardUid: string } };
        expect(last.type).toBe(1); // VisualShortcutType.Navigate
        expect(last.destinationInfo.cardUid).toBe("styling-card");
    });

    it("maps author object keys to a formatting object", () => {
        expect(HF_OBJECT_MAP.content).toBe("styling");
        expect(HF_OBJECT_MAP.nope).toBeUndefined();
    });
});
