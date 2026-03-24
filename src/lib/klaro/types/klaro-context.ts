import type { ConsentManager } from '../consent-manager.svelte.js';
import type { KlaroConfigInterface } from './klaro-config.interface.js';

/**
 * Pre-bound translation function. The translations map, language, and fallback
 * language are already captured — callers only pass the key path and optional
 * format parameters.
 *
 * Key path conventions:
 * - `['consentNotice', 'title']` — normal lookup
 * - `['!', 'name', 'title?']` — `!` prefix returns undefined instead of
 *   "[missing translation]"; `?` suffix treats the key as optional
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslateFn = (key: string[], ...params: any[]) => any;

export interface KlaroContext {
    manager: ConsentManager;
    config: KlaroConfigInterface;
    t: TranslateFn;
    lang: string;
}

export const KLARO_KEY = Symbol('klaro');
