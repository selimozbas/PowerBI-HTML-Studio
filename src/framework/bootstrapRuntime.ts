import * as bootstrap from "bootstrap";
import { BOOTSTRAP_CSS } from "./bootstrapCss";

/**
 * Bootstrap 5 bundled into the visual: CSS + the Bootstrap Icons webfont
 * (inlined as a data: URI, see scripts/embed-bootstrap.mjs) + the JS.
 *
 * The CSS is injected into <head> as one <style> rather than imported
 * through the build's LESS/CSS pipeline (less-loader can't parse
 * Bootstrap's minified custom-property CSS).
 *
 * Behaviours that run through Bootstrap's document-level data-api -
 * collapse, tab, dropdown, alert, toast, scrollspy, offcanvas - activate
 * because the `bootstrap` module is imported. Tooltip / popover / carousel
 * are opt-in and instantiated per render by `initBootstrap`.
 *
 * Sandbox limits: `bootstrap.Modal` only covers the visual's own
 * rectangle (fine in focus mode); popups and network are blocked by
 * Power BI, not by this code.
 */

export interface BsDisposable {
    dispose?: () => void;
}

let cssInjected = false;

export function injectBootstrapCss(): void {
    if (cssInjected) return;
    cssInjected = true;
    const style = document.createElement("style");
    style.id = "hf-bootstrap-css";
    style.textContent = BOOTSTRAP_CSS;
    document.head.appendChild(style);
}

export function initBootstrap(root: HTMLElement): BsDisposable[] {
    const made: BsDisposable[] = [];
    const add = (el: Element, make: (e: HTMLElement) => BsDisposable): void => {
        try {
            made.push(make(el as HTMLElement));
        } catch {
            /* malformed markup - skip this element */
        }
    };

    root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) =>
        add(el, (e) => bootstrap.Tooltip.getOrCreateInstance(e))
    );
    root.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) =>
        add(el, (e) => bootstrap.Popover.getOrCreateInstance(e))
    );
    root.querySelectorAll('.carousel, [data-bs-ride="carousel"]').forEach((el) =>
        add(el, (e) => bootstrap.Carousel.getOrCreateInstance(e))
    );
    return made;
}

export function disposeBootstrap(instances: BsDisposable[]): void {
    instances.forEach((i) => {
        try {
            i.dispose?.();
        } catch {
            /* already disposed with its element */
        }
    });
}
