import { mountTrustedHtml } from "../dom/inject";

/**
 * First-run landing page shown when no data is bound. Static, self
 * contained markup - the richer template gallery arrives with the Monaco
 * advanced editor in a later phase.
 */
export function renderLanding(host: HTMLElement): void {
    mountTrustedHtml(
        host,
        `<div class="hf-landing">
            <h3>HTML Forge</h3>
            <p>Add a column or measure to the <b>Content</b> field to render it as HTML or SVG.</p>
            <ul>
                <li>Add extra measures to <b>Data (named fields)</b> and reference them in a template as <code>{{Revenue}}</code>.</li>
                <li>Switch <b>Content &rsaquo; Content source</b> to <b>Template</b> for <code>{{#each rows}}</code>, <code>{{#if}}</code> and helpers like <code>{{bar(Actual, Target)}}</code>.</li>
                <li>Use <b>Conditional formatting</b> for rule-based styling without DAX.</li>
            </ul>
        </div>`
    );
}
