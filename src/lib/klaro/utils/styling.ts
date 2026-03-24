import type { KlaroConfigInterface } from '../types/klaro-config.interface.js';
import type { KlaroTheme, ThemeName } from '../themes.js';

export function injectStyles(
    config: KlaroConfigInterface,
    themes: Record<ThemeName, KlaroTheme>,
    element?: HTMLElement
) {
    if (config.styling === undefined) return;

    let styling: Record<string, string> = { ...config.styling } as unknown as Record<string, string>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((config.styling as any).theme !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let styleThemes: string[] = (config.styling as any).theme;
        if (!Array.isArray(styleThemes)) {
            styleThemes = [styleThemes];
        }

        styling = {};

        for (const themeName of styleThemes) {
            const theme = themes[themeName as ThemeName];
            if (theme !== undefined) {
                for (const [key, value] of Object.entries(theme)) {
                    if (key.startsWith('_')) continue;
                    if (typeof value === 'string') {
                        styling[key] = value;
                    }
                }
            }
        }

        for (const [key, value] of Object.entries(config.styling as Record<string, unknown>)) {
            if (key === 'theme') continue;
            if (typeof value === 'string') {
                styling[key] = value;
            }
        }
    }

    const target = element ?? document.documentElement;

    for (const [key, value] of Object.entries(styling)) {
        target.style.setProperty('--' + key, value);
    }
}
