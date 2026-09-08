/**
 * Starter templates offered in the advanced editor. Each is valid input
 * for the template engine (see rendering/templateEngine.ts) and uses only
 * built-in helpers.
 */
export interface TemplateSample {
    id: string;
    name: string;
    description: string;
    template: string;
}

export const TEMPLATE_GALLERY: TemplateSample[] = [
    {
        id: "passthrough",
        name: "Pass through HTML",
        description: "Render the Content field's own HTML as-is, one block per row. Use this when Content already produces HTML (or just set Content source back to \"Field value\").",
        template: [
            '{{#each rows}}',
            '  {{{content}}}',
            '{{/each}}'
        ].join("\n")
    },
    {
        id: "wrap-html",
        name: "Wrap HTML",
        description: "Your Content HTML inside a themed card. Note the triple braces {{{content}}} for raw HTML.",
        template: [
            '{{#each rows}}',
            '<div class="card mb-2"><div class="card-body">',
            '  {{{content}}}',
            '</div></div>',
            '{{/each}}'
        ].join("\n")
    },
    {
        id: "kpi-card",
        name: "KPI card",
        description: "Content = a text label; put Actual / Target measures in the Data well. Caption + big number + progress bar.",
        template: [
            '<div class="hf-card" style="padding:12px;border:1px solid var(--hf-track);border-radius:8px">',
            '  {{#each rows}}',
            '  <div style="font-size:12px;color:var(--hf-muted)">{{content}}</div>',
            '  <div style="font-size:28px;font-weight:600">{{format(Actual, "#,##0")}}</div>',
            '  <div>{{{bar(Actual, Target)}}} <span style="font-size:11px">{{format(pct(Actual, Target), "0.0")}}% of target</span></div>',
            '  {{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "progress-list",
        name: "Progress list",
        description: "Content = a label; Actual / Target measures in the Data well. One row per item with a value and inline bar.",
        template: [
            '<table style="width:100%;border-collapse:collapse">',
            '  {{#each rows}}',
            '  <tr {{{selectAttr("content", content)}}}>',
            '    <td style="padding:4px 8px">{{content}}</td>',
            '    <td style="padding:4px 8px;text-align:right">{{format(Actual, "#,##0")}}</td>',
            '    <td style="padding:4px 8px;width:120px">{{{bar(Actual, Target, 120)}}}</td>',
            '  </tr>',
            '  {{/each}}',
            '</table>'
        ].join("\n")
    },
    {
        id: "tabs",
        name: "Tabbed sections",
        description: "A tab per row; click to switch panels.",
        template: [
            '<div class="hf-tabs" data-hf-tabs="g1">',
            '  {{#each rows}}<button data-hf-tab="t{{@index}}">{{content}}</button>{{/each}}',
            '  {{#each rows}}<div data-hf-panel="t{{@index}}" style="padding:8px">',
            '    <b>{{content}}</b><br/>Actual {{format(Actual, "#,##0")}} / Target {{format(Target, "#,##0")}}',
            '  </div>{{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "bootstrap-cards",
        name: "Bootstrap cards",
        description: "Responsive card grid using the bundled Bootstrap 5 + icons.",
        template: [
            '<div class="row g-2">',
            '  {{#each rows}}',
            '  <div class="col-sm-6 col-lg-4">',
            '    <div class="card h-100" {{{selectAttr("content", content)}}}>',
            '      <div class="card-body">',
            '        <h6 class="card-title"><i class="bi bi-graph-up-arrow me-1"></i>{{content}}</h6>',
            '        <p class="display-6 mb-1">{{number(Actual)}}</p>',
            '        <span class="badge text-bg-{{#if Actual >= Target}}success{{else}}danger{{/if}}">',
            '          {{percent(pct(Actual, Target), 0)}} of target',
            '        </span>',
            '      </div>',
            '    </div>',
            '  </div>',
            '  {{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "bootstrap-accordion",
        name: "Bootstrap accordion",
        description: "Collapsible sections via Bootstrap's data-bs-* API.",
        template: [
            '<div class="accordion" id="hfAcc">',
            '  {{#each rows}}',
            '  <div class="accordion-item">',
            '    <h2 class="accordion-header">',
            '      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#hfAcc{{@index}}">',
            '        {{content}}',
            '      </button>',
            '    </h2>',
            '    <div id="hfAcc{{@index}}" class="accordion-collapse collapse" data-bs-parent="#hfAcc">',
            '      <div class="accordion-body">Actual {{number(Actual)}} &middot; Target {{number(Target)}}</div>',
            '    </div>',
            '  </div>',
            '  {{/each}}',
            '</div>'
        ].join("\n")
    },
    {
        id: "component-dashboard",
        name: "Component dashboard",
        description: "Uses the built-in component library ({{> kpi}}, {{> trend}}, {{> sparkRow}}).",
        template: [
            '<div class="row g-2">',
            '  {{#each rows}}',
            '  <div class="col-sm-6 col-lg-3">{{> kpi label=content value=Actual target=Target}}</div>',
            '  {{/each}}',
            '</div>',
            '<hr/>',
            '{{#each rows}}{{> sparkRow label=content series=Series value=Actual}}{{/each}}',
            '<div class="mt-2 text-secondary small">Total {{number(sum(rows, "Actual"))}} across {{count(rows)}} items</div>'
        ].join("\n")
    },
    {
        id: "chart-card",
        name: "Chart card",
        description: "An interactive uPlot line chart driven by the bound rows.",
        template: [
            '<div class="card"><div class="card-body">',
            '  <h6 class="card-title">Actual vs Target</h6>',
            '  <div data-hf-chart=\'{"type":"line","x":"content","y":["Actual","Target"],"height":180}\'></div>',
            '  <div class="text-secondary small mt-1">{{count(rows)}} points &middot; total {{number(sum(rows,"Actual"))}}</div>',
            '</div></div>'
        ].join("\n")
    },
    {
        id: "badge-table",
        name: "Status table",
        description: "Rows with a coloured status pill (pair with Conditional formatting).",
        template: [
            '<table style="width:100%;border-collapse:collapse">',
            '  <thead><tr><th style="text-align:left">Item</th><th style="text-align:right">Actual</th><th>Status</th></tr></thead>',
            '  {{#each rows}}',
            '  <tr style="{{cfStyle}}" class="{{cfClass}}">',
            '    <td>{{content}}</td>',
            '    <td style="text-align:right">{{format(Actual, "#,##0")}}</td>',
            '    <td style="text-align:center">{{#if Actual >= Target}}✓{{else}}✗{{/if}}</td>',
            '  </tr>',
            '  {{/each}}',
            '</table>'
        ].join("\n")
    }
];
