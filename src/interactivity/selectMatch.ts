/**
 * Parses the `data-hf-select` attribute that authored HTML can put on any
 * element to cross-filter by field value(s) rather than by row index:
 *
 *   <button data-hf-select="Region:North">North</button>
 *   <li data-hf-select="Region:North; Segment:Retail">North retail</li>
 *
 * Multiple `field:value` pairs are ANDed: a row matches only when every
 * pair matches. Clicking selects the union of all matching rows.
 */

export interface SelectPair {
    field: string;
    value: string;
}

export function parseSelectSpec(spec: string): SelectPair[] {
    return String(spec || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((pair) => {
            const i = pair.indexOf(":");
            return i === -1
                ? { field: pair.trim(), value: "" }
                : { field: pair.slice(0, i).trim(), value: pair.slice(i + 1).trim() };
        });
}

export function rowMatchesSpec(fields: Record<string, unknown>, pairs: SelectPair[]): boolean {
    if (!pairs.length) return false;
    return pairs.every((p) => looseEq(fields[p.field], p.value));
}

function looseEq(a: unknown, b: unknown): boolean {
    return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
}
