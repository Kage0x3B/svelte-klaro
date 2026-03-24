<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import type { ConsentManager, KlaroConsentWatcher } from '$lib/klaro/consent-manager.svelte.js';
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import type { KlaroServiceInterface } from '$lib/klaro/types/klaro-service.interface.js';
    import type { TranslateFn } from '$lib/klaro/types/klaro-context.js';
    import { t as tt } from '$lib/klaro/utils/i18n.js';
    import { asTitle } from '$lib/klaro/utils/strings.js';

    let {
        manager,
        config,
        t,
        lang,
        service,
        style = undefined
    }: {
        manager: ConsentManager;
        config: KlaroConfigInterface;
        t: TranslateFn;
        lang: string;
        service: KlaroServiceInterface;
        style?: string;
    } = $props();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used to trigger reactivity
    let updateCnt = $state(0);

    const watcher: KlaroConsentWatcher = {
        update: () => {
            updateCnt++;
        }
    };

    onMount(() => {
        manager.watch(watcher);
    });

    onDestroy(() => {
        manager.unwatch(watcher);
    });

    const title = $derived(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tt((service.translations as any) || {}, lang, 'zz', ['!', 'title']) ||
            t(['!', service.name, 'title?']) ||
            asTitle(service.name)
    );

    function accept() {
        manager.updateConsent(service.name, true);
        if (manager.confirmed) {
            manager.saveConsents('contextual-accept');
            manager.applyConsents(false, true, service.name);
        } else {
            manager.applyConsents(false, true, service.name);
        }
    }

    function acceptOnce() {
        manager.updateConsent(service.name, true);
        manager.applyConsents(false, true, service.name);
        manager.updateConsent(service.name, false);
    }

    const rootClass = $derived(
        (config.stylePrefix || 'klaro') +
            (config.additionalClass ? ' ' + config.additionalClass : '') +
            ' cm-as-context-notice'
    );

    const noticeClass = $derived('context-notice' + (style !== undefined ? ` cm-${style}` : ''));
</script>

<div {lang} class={rootClass}>
    <div class={noticeClass}>
        <p>
            {t(['contextualConsent', 'description'], { title })}
        </p>
        <p class="cm-buttons">
            <button class="cm-btn cm-btn-success" type="button" onclick={acceptOnce}>
                {t(['contextualConsent', 'acceptOnce'])}
            </button>
            {#if manager.store.get() !== null}
                <button class="cm-btn cm-btn-success-var" type="button" onclick={accept}>
                    {t(['contextualConsent', 'acceptAlways'])}
                </button>
            {/if}
        </p>
        {#if manager.store.get() === null && config.showDescriptionEmptyStore}
            <p class="ccn-description-empty-store">
                {t(['contextualConsent', 'descriptionEmptyStore'], {
                    title,
                    link: `<a class="ccn-modal-link" href="#">${t(['contextualConsent', 'modalLinkText'])}</a>`
                })}
            </p>
        {/if}
    </div>
</div>
