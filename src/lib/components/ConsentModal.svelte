<script lang="ts">
    import { getContext, onMount } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import CloseIcon from './CloseIcon.svelte';
    import Services from './Services.svelte';
    import Purposes from './Purposes.svelte';
    import Text from './Text.svelte';

    let {
        hide,
        confirming,
        saveAndHide,
        acceptAndHide,
        declineAndHide
    }: {
        hide: () => void;
        confirming: boolean;
        saveAndHide: () => void;
        acceptAndHide: () => void;
        declineAndHide: () => void;
    } = $props();

    const { manager, config, t, lang } = getContext<KlaroContext>(KLARO_KEY);

    let consentModalRef: HTMLButtonElement | undefined = $state();

    onMount(() => {
        consentModalRef?.focus();
    });

    const groupByPurpose = $derived(config.groupByPurpose !== undefined ? config.groupByPurpose : true);
    const embedded = $derived(config.embedded);

    const ppUrl = $derived.by(() => {
        if (config.privacyPolicy !== undefined) {
            if (typeof config.privacyPolicy === 'string') return config.privacyPolicy;
            if (typeof config.privacyPolicy === 'object') {
                return config.privacyPolicy[lang] || config.privacyPolicy.default;
            }
        }
        const url = t(['!', 'privacyPolicyUrl'], { lang });
        if (url !== undefined && Array.isArray(url)) return url.join('');
        return url as string | undefined;
    });

    const modalDescriptionText = $derived.by(() => {
        const desc = t(['consentModal', 'description']);
        if (!ppUrl) return desc;
        const ppLinkHtml = `<a href="${ppUrl}" target="_blank" rel="noopener">${t(['privacyPolicy', 'name'])}</a>`;
        const ppText = t(['privacyPolicy', 'text'], { privacyPolicy: ppLinkHtml });
        if (Array.isArray(desc) && Array.isArray(ppText)) {
            return [...desc, ' ', ...ppText].join('');
        }
        return `${desc} ${Array.isArray(ppText) ? ppText.join('') : ppText}`;
    });
</script>

<div id="cookieScreen" class="cookie-modal{embedded ? ' cm-embedded' : ''}">
    {#if !embedded}
        <div class="cm-bg" role="presentation" onclick={hide}></div>
    {/if}
    <div class="cm-modal cm-klaro">
        <div class="cm-header">
            {#if !config.mustConsent}
                <button
                    title={t(['close']) as string}
                    aria-label={t(['close']) as string}
                    class="hide"
                    type="button"
                    onclick={hide}
                    tabindex={0}
                    bind:this={consentModalRef}
                >
                    <CloseIcon />
                </button>
            {/if}
            <h1 class="title">
                <Text text={t(['consentModal', 'title'])} />
            </h1>
            <p>
                <Text text={modalDescriptionText} />
            </p>
        </div>
        <div class="cm-body">
            {#if groupByPurpose}
                <Purposes />
            {:else}
                <Services />
            {/if}
        </div>
        <div class="cm-footer">
            <div class="cm-footer-buttons">
                {#if !config.hideDeclineAll && !manager.confirmed}
                    <button
                        disabled={confirming}
                        class="cm-btn cm-btn-decline cm-btn-danger cn-decline"
                        type="button"
                        onclick={declineAndHide}
                    >
                        {t(['decline'])}
                    </button>
                {/if}
                <button
                    disabled={confirming}
                    class="cm-btn cm-btn-success cm-btn-info cm-btn-accept"
                    type="button"
                    onclick={saveAndHide}
                >
                    {t([manager.confirmed ? 'save' : 'acceptSelected'])}
                </button>
                {#if config.acceptAll && !manager.confirmed}
                    <button
                        disabled={confirming}
                        class="cm-btn cm-btn-success cm-btn-accept-all"
                        type="button"
                        onclick={acceptAndHide}
                    >
                        {t(['acceptAll'])}
                    </button>
                {/if}
            </div>
            {#if !config.disablePoweredBy}
                <p class="cm-powered-by">
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                    <a target="_blank" href={config.poweredBy || 'https://kiprotect.com/klaro'} rel="noopener">
                        {t(['poweredBy'])}
                    </a>
                </p>
            {/if}
        </div>
    </div>
</div>
