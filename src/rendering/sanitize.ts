import createDOMPurify from "dompurify";

export interface SanitizeOptions {
    enabled: boolean;
    allowSvg: boolean;
    allowStyleTag: boolean;
    allowScripts: boolean;
    extraTags: string[];
    extraAttrs: string[];
}

export interface SanitizeResult {
    fragment: DocumentFragment;
    removed: string[];
}

let purifier: ReturnType<typeof createDOMPurify> | null = null;

function getPurifier(): ReturnType<typeof createDOMPurify> {
    if (!purifier) {
        purifier = createDOMPurify(window);
    }
    return purifier;
}

/**
 * Sanitises authored HTML with DOMPurify and returns a ready-to-adopt
 * DocumentFragment - the visual never assigns an HTML string to a DOM
 * markup property, which keeps it clear of `no-implied-inner-html` and
 * Microsoft certification review.
 *
 * `<script>` is only ever kept when the author explicitly opts in via the
 * "unsafe" toggle (and even then Power BI's own sandbox still blocks
 * externally-hosted scripts).
 */
export function sanitizeToFragment(html: string, opts: SanitizeOptions): SanitizeResult {
    const dp = getPurifier();
    const removed: string[] = [];

    dp.addHook("uponSanitizeElement", (node: Node, data: { tagName: string; allowedTags: Record<string, boolean> }) => {
        if (data.tagName && !data.allowedTags[data.tagName]) {
            removed.push(node.nodeName.toLowerCase());
        }
    });

    const config: Record<string, unknown> = {
        RETURN_DOM_FRAGMENT: true,
        FORCE_BODY: true,
        ADD_TAGS: [
            ...(opts.allowStyleTag ? ["style"] : []),
            ...(opts.allowScripts ? ["script"] : []),
            ...opts.extraTags
        ],
        ADD_ATTR: [
            "target",
            "data-hf-row",
            "data-hf-select",
            "data-hf-tab",
            "data-hf-tabs",
            "data-hf-panel",
            "data-hf-acc",
            "data-hf-acc-panel",
            ...opts.extraAttrs
        ],
        USE_PROFILES: { html: true, svg: opts.allowSvg, svgFilters: opts.allowSvg }
    };

    const result = opts.enabled
        ? (dp.sanitize(html, config as never) as unknown as DocumentFragment)
        : rawFragment(html);

    dp.removeAllHooks();
    return { fragment: result, removed: Array.from(new Set(removed)) };
}

/**
 * Used only when the author has explicitly disabled sanitisation. Parses
 * without executing: `DOMParser` never runs scripts and never fires inline
 * event handlers on the detached document.
 */
function rawFragment(html: string): DocumentFragment {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach((n) => frag.appendChild(document.importNode(n, true)));
    return frag;
}
