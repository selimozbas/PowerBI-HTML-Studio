import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";
import { COMPONENT_NAMES } from "../components/library";

export const TEMPLATE_LANGUAGE_ID = "hf-template";

export const HELPER_NAMES = [
    "format", "number", "percent", "currency", "date",
    "upper", "lower", "trim", "default",
    "add", "sub", "mul", "div", "pct", "round", "json",
    "sum", "avg", "min", "max", "maxOf", "minOf", "count", "pluck", "first", "last",
    "sortBy", "where", "whereNot", "top", "bottom", "rank", "pctOfTotal", "groupBy",
    "colorScale", "relativeTime", "duration", "split", "join", "initials",
    "selectAttr", "qr", "sparkline", "bar", "ring", "rating"
];

const BLOCK_KEYWORDS = ["if", "unless", "each", "else"];

export interface TemplateContext {
    fields: string[];
}

let registered = false;

/**
 * Registers the `hf-template` language: HTML with `{{ }}` / `{{{ }}}`
 * expression blocks highlighted, plus a completion provider that offers
 * the bound field names, helper functions and block snippets while the
 * caret is inside a moustache. Main-thread only - no workers.
 */
export function registerTemplateLanguage(
    monaco: typeof Monaco,
    getContext: () => TemplateContext
): void {
    if (registered) return;
    registered = true;

    monaco.languages.register({ id: TEMPLATE_LANGUAGE_ID });

    monaco.languages.setMonarchTokensProvider(TEMPLATE_LANGUAGE_ID, {
        defaultToken: "",
        tokenizer: {
            root: [
                [/\{\{\{/, { token: "delimiter.moustache", next: "@expr" }],
                [/\{\{/, { token: "delimiter.moustache", next: "@expr" }],
                [/<!--/, { token: "comment", next: "@comment" }],
                [/<\/?[\w-]+/, { token: "tag", next: "@tag" }],
                [/&\w+;/, "string.escape"]
            ],
            comment: [
                [/-->/, { token: "comment", next: "@pop" }],
                [/[^-]+/, "comment"],
                [/./, "comment"]
            ],
            tag: [
                [/\/?>/, { token: "tag", next: "@pop" }],
                [/[\w-]+(?==)/, "attribute.name"],
                [/"[^"]*"/, "attribute.value"],
                [/'[^']*'/, "attribute.value"],
                [/\{\{\{?/, { token: "delimiter.moustache", next: "@expr" }],
                [/[\w-]+/, "attribute.name"]
            ],
            expr: [
                [/\}\}\}?/, { token: "delimiter.moustache", next: "@pop" }],
                [/#(if|unless|each)\b/, "keyword"],
                [/\/(if|unless|each)\b/, "keyword"],
                [/\belse\b/, "keyword"],
                [/@(index|first|last|key)\b/, "variable.predefined"],
                [/\bthis\b/, "variable.predefined"],
                [new RegExp(`\\b(${HELPER_NAMES.join("|")})\\b(?=\\s*\\()`), "type.identifier"],
                [/"[^"]*"|'[^']*'/, "string"],
                [/-?\d+(\.\d+)?/, "number"],
                [/[=!<>]=?|>=|<=/, "operator"],
                [/[a-zA-Z_$][\w$.]*/, "identifier"],
                [/[(),]/, "delimiter"]
            ]
        }
    } as Monaco.languages.IMonarchLanguage);

    monaco.languages.setLanguageConfiguration(TEMPLATE_LANGUAGE_ID, {
        brackets: [["{{", "}}"], ["<", ">"], ["(", ")"]],
        autoClosingPairs: [
            { open: "{{", close: "}}" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "'", close: "'" }
        ],
        comments: { blockComment: ["<!--", "-->"] }
    });

    monaco.languages.registerCompletionItemProvider(TEMPLATE_LANGUAGE_ID, {
        triggerCharacters: ["{", " ", "."],
        provideCompletionItems: (model, position) => {
            const line = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
            const openIdx = line.lastIndexOf("{{");
            const closeIdx = line.lastIndexOf("}}");
            if (openIdx === -1 || openIdx < closeIdx) {
                return { suggestions: [] };
            }
            const word = model.getWordUntilPosition(position);
            const range: Monaco.IRange = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn
            };
            const K = monaco.languages.CompletionItemKind;
            const suggestions: Monaco.languages.CompletionItem[] = [];

            for (const f of getContext().fields) {
                suggestions.push({ label: f, kind: K.Field, insertText: /\s/.test(f) ? f : f, range });
            }
            for (const h of HELPER_NAMES) {
                suggestions.push({
                    label: `${h}()`,
                    kind: K.Function,
                    insertText: `${h}($0)`,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range
                });
            }
            for (const b of BLOCK_KEYWORDS) {
                suggestions.push({ label: `#${b}`, kind: K.Keyword, insertText: b === "else" ? "else" : `#${b} `, range });
            }
            for (const c of COMPONENT_NAMES) {
                suggestions.push({
                    label: `> ${c}`,
                    kind: K.Module,
                    insertText: `> ${c} `,
                    detail: "component",
                    range
                });
            }
            suggestions.push(
                {
                    label: "#each rows",
                    kind: K.Snippet,
                    insertText: "#each rows}}\n\t$0\n{{/each",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range
                },
                {
                    label: "#if",
                    kind: K.Snippet,
                    insertText: "#if $1}}$0{{/if",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    range
                }
            );
            return { suggestions };
        }
    });
}
