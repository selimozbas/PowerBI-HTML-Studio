/**
 * Central point where HTML enters the DOM.
 *
 * The visual's whole purpose is to render author-supplied HTML, but it
 * never assigns a markup string to `innerHTML` / `outerHTML` /
 * `insertAdjacentHTML`. Instead:
 *   - author content is turned into a DocumentFragment by DOMPurify
 *     (see rendering/sanitize.ts) and adopted here;
 *   - the visual's own trusted chrome (landing page, diagnostics) is built
 *     with `DOMParser`, which parses without executing scripts or inline
 *     handlers.
 * This keeps the code clear of `powerbi-visuals/no-implied-inner-html`.
 */

export function mountFragment(target: Element, fragment: DocumentFragment): void {
    target.replaceChildren(fragment);
}

export function clearElement(target: Element): void {
    target.replaceChildren();
}

/** Parse a trusted, visual-authored HTML string into a fragment. */
export function fragmentFromTrustedHtml(html: string): DocumentFragment {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const frag = document.createDocumentFragment();
    Array.from(doc.body.childNodes).forEach((node) => frag.appendChild(document.importNode(node, true)));
    return frag;
}

export function mountTrustedHtml(target: Element, html: string): void {
    target.replaceChildren(fragmentFromTrustedHtml(html));
}
