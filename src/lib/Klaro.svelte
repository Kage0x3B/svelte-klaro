<script lang="ts">
    import { setContext, onMount, onDestroy } from 'svelte';
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import { KLARO_KEY, type KlaroContext, type TranslateFn } from '$lib/klaro/types/klaro-context.js';
    import { ConsentManager, type KlaroConsentWatcher } from '$lib/klaro/consent-manager.svelte.js';
    import { KlaroInstance } from '$lib/klaro/klaro-instance.js';
    import { t as rawT, language } from '$lib/klaro/utils/i18n.js';
    import { convertToMap, update as updateMap } from '$lib/klaro/utils/maps.js';
    import { injectStyles } from '$lib/klaro/utils/styling.js';
    import { themes } from '$lib/klaro/themes.js';
    import { setActiveInstance } from '$lib/klaro/klaro-instance.js';
    import type { KlaroEventHandler } from '$lib/klaro/types/klaro-events.type.js';
    import { loadKlaroConfig } from '$lib/klaro/load-config.js';
    import KlaroApi from '$lib/klaro/utils/api.js';
    import App from '$lib/components/App.svelte';
    import en from '$lib/klaro/translations/en.js';

    interface Props {
        /**
         * Klaro config object. Either `config` or `klaroId` is required.
         * When using `klaroId` without `config`, the config is fetched client-side from the API.
         * For SSR, use `loadKlaroConfig()` in a SvelteKit loader and pass the result here.
         */
        config?: KlaroConfigInterface;

        /**
         * KIProtect privacy manager ID. When provided without `config`, the config
         * is fetched from the API on mount. When provided with `config`, the API
         * is used for consent data submission only.
         */
        klaroId?: string;

        /**
         * Config name to load from the API. Defaults to 'default'.
         */
        klaroConfigName?: string;

        /**
         * Base URL of the KIProtect/Klaro API.
         * @default 'https://api.kiprotect.com'
         */
        klaroApiUrl?: string;

        /**
         * When `klaroId` is set, consent changes are automatically submitted to
         * the KIProtect API as consent receipts. Set this to `true` to disable
         * that behavior. Has no effect without `klaroId`.
         *
         * @default false
         */
        disableConsentTracking?: boolean;

        /**
         * Additional translations to merge on top of the bundled English defaults
         * and any translations in config. Useful when config is loaded from a remote
         * API and doesn't include translations. Pass language objects imported from
         * 'svelte-klaro/translations', e.g. `translations={{ de, fr }}`.
         */
        translations?: Record<string, Record<string, unknown>>;

        onconsentchange?: (consents: Record<string, boolean>, service: string, value: boolean) => void;
        onsave?: (manager: ConsentManager, eventType: string) => void;
        onapply?: (manager: ConsentManager, changedCount: number) => void;
        onshow?: () => void;
        onhide?: () => void;
        oninit?: (manager: ConsentManager) => void;
        onApiConfigsLoaded?: KlaroEventHandler<'apiConfigsLoaded'>;
        onApiConfigsFailed?: KlaroEventHandler<'apiConfigsFailed'>;
    }

    let {
        config: rawConfig,
        klaroId,
        klaroConfigName,
        klaroApiUrl,
        disableConsentTracking = false,
        translations: translationsProp,
        onconsentchange,
        onsave,
        onapply,
        onshow,
        onhide,
        oninit,
        onApiConfigsLoaded,
        onApiConfigsFailed
    }: Props = $props();

    // Validate deprecated config fields
    function validateConfig(config: KlaroConfigInterface): KlaroConfigInterface {
        const validated = { ...config };
        if (validated.version === 2) return validated;

        if (validated.apps !== undefined && validated.services === undefined) {
            validated.services = validated.apps;
            console.warn('Warning, your configuration file is outdated. Please change `apps` to `services`');
            delete validated.apps;
        }

        if (validated.translations !== undefined) {
            if (validated.translations.apps !== undefined && validated.translations.services === undefined) {
                validated.translations.services = validated.translations.apps;
                console.warn(
                    'Warning, your configuration file is outdated. Please change `apps` to `services` in the `translations` key'
                );
                delete validated.translations.apps;
            }
        }

        return validated;
    }

    function initializeWithConfig(cfg: KlaroConfigInterface) {
        cfg = validateConfig(cfg);

        // Merge translations: bundled English → translations prop → config.translations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trans = convertToMap({ en } as any);
        if (translationsProp) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateMap(trans, convertToMap(translationsProp as any));
        }
        if (cfg.translations) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateMap(trans, convertToMap(cfg.translations as any));
        }
        const lang = language(cfg);
        const t: TranslateFn = (key: string[], ...params: unknown[]) => rawT(trans, lang, 'zz', key, ...params);

        // Create consent manager (requires DOM)
        const mgr = new ConsentManager(cfg);
        manager = mgr;

        // Update context with real values
        context.manager = mgr;
        context.config = cfg;
        context.t = t;
        context.lang = lang;

        // Hash params for testing mode
        const hashParams = getHashParams();
        testing = !!hashParams.get('klaro-testing');

        // API setup
        if (klaroId) {
            api = new KlaroApi(klaroApiUrl || 'https://api.kiprotect.com', klaroId, { testing });

            // Submit consent receipts to the KIProtect API when the user saves
            if (!disableConsentTracking) {
                const configForApi = { ...cfg, id: cfg.id || klaroId! };
                const consentTrackingWatcher: KlaroConsentWatcher = {
                    update(_m, type, data) {
                        if (type === 'saveConsents') {
                            const saveData = data as {
                                changes: Record<string, unknown>;
                                consents: Record<string, boolean>;
                                type: string;
                            };
                            api!.update(
                                { config: configForApi },
                                'saveConsents',
                                {
                                    type: 'save',
                                    changes: saveData.changes,
                                    consents: saveData.consents,
                                    config: configForApi
                                }
                            );
                        }
                    }
                };
                mgr.watch(consentTrackingWatcher);
            }
        }

        // KlaroInstance for API event handlers
        if (onApiConfigsLoaded || onApiConfigsFailed) {
            const klaroInstance = new KlaroInstance();
            if (onApiConfigsLoaded) klaroInstance.addEventListener('apiConfigsLoaded', onApiConfigsLoaded);
            if (onApiConfigsFailed) klaroInstance.addEventListener('apiConfigsFailed', onApiConfigsFailed);
        }

        // Wire up Svelte event callbacks.
        // We only fire onconsentchange after the user commits (saveConsents),
        // not on every toggle in the modal.
        const eventWatcher: KlaroConsentWatcher = {
            update(m, type, data) {
                if (type === 'saveConsents') {
                    if (onconsentchange) {
                        const current = $state.snapshot(m.consents);
                        for (const [name, value] of Object.entries(current)) {
                            onconsentchange(current, name, value);
                        }
                    }
                    if (onsave) {
                        const saveData = data as Record<string, unknown>;
                        onsave(m, (saveData.type as string) || 'script');
                    }
                } else if (type === 'applyConsents' && onapply) {
                    onapply(m, data as number);
                }
            }
        };
        mgr.watch(eventWatcher);

        // Inject styles
        const element = document.getElementById(cfg.elementID || 'klaro');
        injectStyles(cfg, themes, element || document.documentElement);

        // Global window.klaro
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).klaro = {
            show: (asModal?: boolean) => {
                forceModal = !!asModal;
                showCount++;
                onshow?.();
            },
            hide: () => {
                showCount = 0;
                onhide?.();
            },
            getManager: () => mgr,
            version: () => '0.8.0'
        };

        setActiveInstance({
            show: (asModal?: boolean) => {
                forceModal = !!asModal;
                showCount++;
                onshow?.();
            },
            hide: () => {
                showCount = 0;
                onhide?.();
            },
            getManager: () => mgr
        });

        mounted = true;

        // Fire initial consent state for all services so consumers
        // always get the current state on load (whether from cookie or defaults).
        if (onconsentchange) {
            const current = $state.snapshot(mgr.consents);
            for (const [name, value] of Object.entries(current)) {
                onconsentchange(current, name, value);
            }
        }

        oninit?.(mgr);
    }

    // Client-only state
    let mounted = $state(false);
    let manager: ConsentManager | undefined = $state(undefined);
    let showCount = $state(0);
    let forceModal = $state(false);
    let testing = $state(false);
    let api: KlaroApi | undefined = $state(undefined);

    // Placeholder context — set synchronously so child components can call getContext()
    // during SSR without crashing. The actual values are populated in onMount.
    const context: KlaroContext = $state({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        manager: undefined as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        config: (rawConfig ?? {}) as any,
        t: () => '',
        lang: 'en'
    });
    setContext<KlaroContext>(KLARO_KEY, context);

    onMount(async () => {
        if (rawConfig) {
            // Config provided directly — initialize immediately
            initializeWithConfig(rawConfig);
        } else if (klaroId) {
            // No config — fetch from KIProtect API
            try {
                const cfg = await loadKlaroConfig(klaroId, {
                    configName: klaroConfigName,
                    apiUrl: klaroApiUrl,
                    testing: !!getHashParams().get('klaro-testing')
                });
                initializeWithConfig(cfg);
            } catch (error) {
                console.error('svelte-klaro: Failed to load config from API', error);
                onApiConfigsFailed?.(error);
            }
        } else {
            console.error('svelte-klaro: Either `config` or `klaroId` prop is required.');
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as any).klaro;
        }
    });

    function getHashParams() {
        if (typeof location === 'undefined') return new Map<string, string | boolean>();
        const entries = decodeURI(location.hash.slice(1))
            .split('&')
            .map((kv) => kv.split('='))
            .map((kv) => (kv.length === 1 ? [kv[0], true] : kv) as [string, string | boolean]);
        return new Map<string, string | boolean>(entries);
    }
</script>

{#if mounted && manager}
    <App {showCount} {testing} {api} modal={forceModal} />
{/if}
