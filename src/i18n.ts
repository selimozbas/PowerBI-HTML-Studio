import powerbi from "powerbi-visuals-api";
import ILocalizationManager = powerbi.extensibility.ILocalizationManager;

export type Translate = (key: string, fallback: string) => string;

/**
 * Wraps the host localization manager into a plain `(key, fallback)`
 * function. Strings live in `stringResources/<locale>/resources.resjson`
 * (en-US, tr-TR); anything missing falls back to the supplied default so
 * the visual never shows a raw key.
 */
export function makeTranslator(manager: ILocalizationManager | undefined): Translate {
    return (key: string, fallback: string): string => {
        if (!manager) return fallback;
        try {
            const value = manager.getDisplayName(key);
            return value && value !== key ? value : fallback;
        } catch {
            return fallback;
        }
    };
}
