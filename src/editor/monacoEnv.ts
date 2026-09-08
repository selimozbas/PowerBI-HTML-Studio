/**
 * Must be imported BEFORE `monaco-editor` so the global is in place when
 * Monaco initialises. See monacoSetup.ts for the rationale (no-worker
 * mode inside the Power BI sandbox).
 */

class InertWorker {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onmessageerror: ((ev: MessageEvent) => void) | null = null;
    onerror: ((ev: ErrorEvent) => void) | null = null;
    postMessage(): void { /* no worker features are used */ }
    terminate(): void { /* nothing to tear down */ }
    addEventListener(): void { /* noop */ }
    removeEventListener(): void { /* noop */ }
    dispatchEvent(): boolean { return false; }
}

(globalThis as unknown as { MonacoEnvironment?: unknown }).MonacoEnvironment = {
    getWorker: () => new InertWorker() as unknown as Worker
};

export {};
