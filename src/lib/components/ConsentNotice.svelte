<script lang="ts">
    import { getContext, onMount } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import { getPurposes } from '$lib/klaro/utils/config.js';
    import { asTitle } from '$lib/klaro/utils/strings.js';
    import ConsentModal from './ConsentModal.svelte';

    let {
        show,
        testing = false,
        modal: initialModal = false,
        hide
    }: {
        show: boolean;
        testing?: boolean;
        modal?: boolean;
        hide: () => void;
    } = $props();

    const { manager, config, t, lang } = getContext<KlaroContext>(KLARO_KEY);

    let modal = $state(initialModal);
    let confirming = $state(false);
    let noticeRef: HTMLDivElement | undefined = $state();

    onMount(() => {
        if (config.autoFocus && noticeRef) {
            noticeRef.focus();
        }
    });

    // Compute purposes text for notice description
    const purposeOrder = $derived(config.purposeOrder || []);
    const purposes = $derived(
        getPurposes(config)
            .filter((purpose) => purpose !== 'functional')
            .sort((a, b) => purposeOrder.indexOf(a) - purposeOrder.indexOf(b))
    );
    const purposesText = $derived.by(() => {
        const trans = purposes.map((purpose) => t(['!', 'purposes', purpose, 'title?']) || asTitle(purpose));
        if (trans.length === 1) return trans[0] as string;
        return [...trans.slice(0, -2), trans.slice(-2).join(' & ')].join(', ');
    });

    // Privacy policy URL
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

    const noticeIsVisible = $derived(
        (!config.mustConsent || config.noticeAsModal) && !manager.confirmed && !config.noNotice
    );

    function executeButtonClicked(setChangedAll: boolean, changedAllValue: boolean, eventType: string) {
        let changedServices = 0;

        if (setChangedAll) {
            changedServices = manager.changeAll(changedAllValue);
        }

        const confirmed = manager.confirmed;
        manager.saveAndApplyConsents(eventType);

        if (setChangedAll && !confirmed && (modal || config.mustConsent)) {
            const close = () => {
                confirming = false;
                hide();
            };

            confirming = true;
            if (changedServices === 0) close();
            else setTimeout(close, 800);
        } else {
            hide();
        }
    }

    function saveAndHide() {
        executeButtonClicked(false, false, 'save');
    }

    function acceptAndHide() {
        executeButtonClicked(true, true, 'accept');
    }

    function declineAndHide() {
        executeButtonClicked(true, false, 'decline');
    }

    function showModal(e: Event) {
        e.preventDefault();
        modal = true;
    }

    function hideModal() {
        if (config.mustConsent && !config.acceptAll) return;
        if (manager.confirmed && !testing) hide();
        else modal = false;

        setTimeout(() => {
            noticeRef?.focus();
        }, 1);
    }

    const noticeClass = $derived(
        `cookie-notice` +
            (!noticeIsVisible && !testing ? ' cookie-notice-hidden' : '') +
            (config.noticeAsModal ? ' cookie-modal-notice' : '') +
            (config.embedded ? ' cn-embedded' : '')
    );

    // Build description with interpolation as HTML
    const noticeDescriptionHtml = $derived.by(() => {
        const ppLinkHtml = ppUrl ? `<a href="${ppUrl}">${t(['privacyPolicy', 'name'])}</a>` : '';

        const learnMoreHtml = config.noticeAsModal
            ? '' // handled separately as a button
            : '';

        const desc = t(['consentNotice', 'description'], {
            purposes: `<strong>${purposesText}</strong>`,
            privacyPolicy: ppLinkHtml,
            learnMoreLink: learnMoreHtml
        });

        return Array.isArray(desc) ? desc.join('') : desc;
    });
</script>

{#if !show && !testing && !confirming}
    <div></div>
{:else if modal || (manager.confirmed && !testing) || (!manager.confirmed && config.mustConsent)}
    <ConsentModal hide={hideModal} {confirming} {saveAndHide} {acceptAndHide} {declineAndHide} />
{:else if config.noticeAsModal}
    <div id="cookieScreen" class="cookie-modal">
        <div class="cm-bg" role="presentation"></div>
        <div
            role="dialog"
            aria-describedby="id-cookie-notice"
            aria-labelledby="id-cookie-title"
            id="klaro-cookie-notice"
            tabindex={0}
            class={noticeClass}
            bind:this={noticeRef}
        >
            <div class="cn-body">
                {#if t(['!', 'consentNotice', 'title']) && config.showNoticeTitle}
                    <h2 id="id-cookie-title">
                        {t(['consentNotice', 'title'])}
                    </h2>
                {/if}
                <p id="id-cookie-notice">
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    {@html noticeDescriptionHtml}
                </p>
                {#if testing}
                    <p>{t(['consentNotice', 'testing'])}</p>
                {/if}
                {#if manager.changed}
                    <p class="cn-changes">
                        {t(['consentNotice', 'changeDescription'])}
                    </p>
                {/if}
                <div class="cn-ok">
                    {#if !config.hideLearnMore}
                        <button class="cm-btn cm-btn-lern-more cm-btn-info" type="button" onclick={showModal}>
                            {t(['consentNotice', 'learnMore'])}
                        </button>
                    {/if}
                    <div class="cn-buttons">
                        {#if !config.hideDeclineAll}
                            <button class="cm-btn cm-btn-danger cn-decline" type="button" onclick={declineAndHide}>
                                {t(['decline'])}
                            </button>
                        {/if}
                        {#if config.acceptAll}
                            <button class="cm-btn cm-btn-success" type="button" onclick={acceptAndHide}>
                                {t(['ok'])}
                            </button>
                        {:else}
                            <button class="cm-btn cm-btn-success" type="button" onclick={saveAndHide}>
                                {t(['ok'])}
                            </button>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{:else}
    <div
        role="dialog"
        aria-describedby="id-cookie-notice"
        aria-labelledby="id-cookie-title"
        id="klaro-cookie-notice"
        tabindex={0}
        class={noticeClass}
        bind:this={noticeRef}
    >
        <div class="cn-body">
            {#if t(['!', 'consentNotice', 'title']) && config.showNoticeTitle}
                <h2 id="id-cookie-title">
                    {t(['consentNotice', 'title'])}
                </h2>
            {/if}
            <p id="id-cookie-notice">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html noticeDescriptionHtml}
            </p>
            {#if testing}
                <p>{t(['consentNotice', 'testing'])}</p>
            {/if}
            {#if manager.changed}
                <p class="cn-changes">
                    {t(['consentNotice', 'changeDescription'])}
                </p>
            {/if}
            <div class="cn-ok">
                {#if !config.hideLearnMore}
                    <a class="cm-link cn-learn-more" href="#" onclick={showModal}>
                        {t(['consentNotice', 'learnMore'])}
                    </a>
                {/if}
                <div class="cn-buttons">
                    {#if !config.hideDeclineAll}
                        <button class="cm-btn cm-btn-danger cn-decline" type="button" onclick={declineAndHide}>
                            {t(['decline'])}
                        </button>
                    {/if}
                    {#if config.acceptAll}
                        <button class="cm-btn cm-btn-success" type="button" onclick={acceptAndHide}>
                            {t(['ok'])}
                        </button>
                    {:else}
                        <button class="cm-btn cm-btn-success" type="button" onclick={saveAndHide}>
                            {t(['ok'])}
                        </button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
{/if}
