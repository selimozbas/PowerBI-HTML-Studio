/**
 * Monaco in "no worker" mode - see monacoEnv.ts. Only main-thread
 * features are used: the Monarch tokenizer and completion providers from
 * templateLanguage.ts. This keeps Monaco working inside the Power BI
 * sandbox and its modal dialog iframe.
 */
import "./monacoEnv";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export { monaco };
