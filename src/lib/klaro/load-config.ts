import type { KlaroConfigInterface } from './types/klaro-config.interface.js';

const DEFAULT_API_URL = 'https://cdn.kiprotect.com/klaro';

export interface LoadKlaroConfigOptions {
    /**
     * Config name to load. Defaults to 'default'.
     */
    configName?: string;

    /**
     * Base URL of the KIProtect/Klaro API.
     * @default 'https://cdn.kiprotect.com/klaro'
     */
    apiUrl?: string;

    /**
     * Enable testing mode (loads draft/testing configs).
     * @default false
     */
    testing?: boolean;

    /**
     * Custom fetch function. Useful for passing SvelteKit's `fetch` from loaders
     * to benefit from server-side caching and credentials.
     *
     * @default globalThis.fetch
     */
    fetch?: typeof globalThis.fetch;
}

/**
 * Load a Klaro config from the KIProtect API.
 *
 * Works in both SSR (SvelteKit loaders) and client-side contexts.
 * Pass SvelteKit's `fetch` for server-side caching:
 *
 * ```ts
 * // +layout.ts
 * export async function load({ fetch }) {
 *     const config = await loadKlaroConfig('59adda...', { fetch });
 *     return { config };
 * }
 * ```
 */
export async function loadKlaroConfig(
    klaroId: string,
    options: LoadKlaroConfigOptions = {}
): Promise<KlaroConfigInterface> {
    const {
        configName = 'default',
        apiUrl = DEFAULT_API_URL,
        testing = false,
        fetch: fetchFn = globalThis.fetch
    } = options;

    const testingParam = testing ? '&testing=true' : '';
    const url = `${apiUrl}/v1/privacy-managers/${klaroId}/config.json?name=${configName}${testingParam}`;

    const response = await fetchFn(url);

    if (!response.ok) {
        throw new Error(`Failed to load Klaro config: ${response.status} ${response.statusText}`);
    }

    return response.json();
}
