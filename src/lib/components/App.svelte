<script lang="ts">
    import { getContext, onMount, onDestroy } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import ConsentNotice from './ConsentNotice.svelte';
    import type { KlaroConsentWatcher } from '$lib/klaro/consent-manager.svelte.js';
    import type KlaroApi from '$lib/klaro/utils/api.js';

    let {
        showCount = 0,
        testing = false,
        modal = false,
        api = undefined
    }: {
        showCount?: number;
        testing?: boolean;
        modal?: boolean;
        api?: KlaroApi;
    } = $props();

    const { manager, config, lang } = getContext<KlaroContext>(KLARO_KEY);

    let show = $state(!manager.confirmed);
    let prevShowCount = showCount;

    // Only re-show when showCount *increments* (not on absolute value)
    $effect(() => {
        if (showCount > prevShowCount) {
            show = true;
            prevShowCount = showCount;
        }
    });

    // Watch manager for applyConsents events to auto-hide
    const watcher: KlaroConsentWatcher = {
        update(mgr, type) {
            if (mgr === manager && type === 'applyConsents') {
                if (!config.embedded && manager.confirmed) {
                    show = false;
                }
            }
        }
    };

    manager.watch(watcher);

    onDestroy(() => {
        manager.unwatch(watcher);
    });

    // Notify API on first show
    function notifyApi() {
        if (api !== undefined) {
            if (modal || showCount > 0) return;
            if (!manager.confirmed) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const auxStore = manager.auxiliaryStore as any;
                const shownBefore = auxStore.getWithKey?.('shown-before');
                if (!shownBefore) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    api.update({ config: config as any }, 'showNotice', {
                        type: 'save',
                        changes: {},
                        consents: {},
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        config: config as any
                    });
                    auxStore.setWithKey?.('shown-before', true);
                }
            }
        }
    }

    onMount(() => {
        notifyApi();
    });

    function hideNotice() {
        if (!config.embedded) show = false;
    }

    const rootClass = $derived(
        (config.stylePrefix || 'klaro') + (config.additionalClass ? ' ' + config.additionalClass : '')
    );
</script>

<div {lang} class={rootClass}>
    {#key showCount}
        <ConsentNotice {show} {testing} {modal} hide={hideNotice} />
    {/key}
</div>
