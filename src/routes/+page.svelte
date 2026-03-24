<script lang="ts">
    import '$lib/scss/klaro.scss';
    import { Klaro, showKlaro, getManager } from '$lib/index.js';
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import { consentGatedScripts } from './consent-test-scripts.js';

    type ThemeOption = 'top' | 'bottom' | 'left' | 'right' | 'wide' | 'light';

    let activeThemes: ThemeOption[] = $state([]);
    let mustConsent = $state(false);
    let noticeAsModal = $state(false);

    const config: KlaroConfigInterface = $derived({
        acceptAll: true,
        mustConsent,
        noticeAsModal,
        styling: activeThemes.length > 0 ? { theme: activeThemes } : undefined,
        translations: {
            en: {
                googleAnalytics: {
                    title: 'Google Analytics',
                    description: 'The analytics service ran by a most definitely non-evil company.'
                },
                bootstrap: {
                    title: 'Bootstrap',
                    description: 'Example for embedding external stylesheets.'
                },
                purposes: {
                    analytics: 'Analytics',
                    styling: 'Styling',
                    marketing: 'Marketing'
                }
            }
        },
        services: [
            {
                name: 'googleAnalytics',
                purposes: ['analytics'],
                cookies: [/^_ga/, '_gid']
            },
            {
                name: 'bootstrap',
                title: 'Bootstrap (external resource)',
                description: 'Example for embedding external stylesheets.',
                purposes: ['styling']
            },
            {
                name: 'facebookPixel',
                title: 'Facebook Pixel',
                description: 'Used for tracking conversions.',
                purposes: ['marketing'],
                optOut: true
            },
            {
                name: 'essential',
                title: 'Essential Services',
                description: 'Required for the website to function.',
                purposes: ['analytics'],
                required: true
            }
        ]
    });

    function toggleTheme(theme: ThemeOption) {
        if (activeThemes.includes(theme)) {
            activeThemes = activeThemes.filter((t) => t !== theme);
        } else {
            activeThemes = [...activeThemes, theme];
        }
        // Reset consent to see the notice again with new theme
        getManager()?.resetConsents();
    }

    function handleConsentChange(consents: Record<string, boolean>, service: string, value: boolean) {
        console.log(`Consent changed: ${service} = ${value}`, consents);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleSave(manager: any, eventType: string) {
        console.log(`Consent saved: ${eventType}`);
    }
</script>

<h1>svelte-klaro Demo</h1>

<h2>Controls</h2>

<p>
    <button onclick={() => showKlaro()}>Show Notice</button>
    <button onclick={() => showKlaro(true)}>Show Modal</button>
    <button onclick={() => getManager()?.resetConsents()}>Reset Consent</button>
</p>

<h2>Themes</h2>
<p>Toggle themes to see different positions and color schemes. Resets consent on change.</p>

<div style="display: flex; gap: 8px; flex-wrap: wrap;">
    {#each ['top', 'bottom', 'left', 'right', 'wide', 'light'] as const as theme (theme)}
        <button
            onclick={() => toggleTheme(theme)}
            style="padding: 6px 12px; border: 2px solid {activeThemes.includes(theme)
                ? '#1a936f'
                : '#ccc'}; background: {activeThemes.includes(theme)
                ? '#e8f5e9'
                : '#fff'}; border-radius: 4px; cursor: pointer;"
        >
            {theme}
            {#if activeThemes.includes(theme)}✓{/if}
        </button>
    {/each}
</div>

<p style="color: #666; font-size: 13px;">
    Active: {activeThemes.length > 0 ? activeThemes.join(', ') : 'default (bottom-right, dark)'}
</p>

<h2>Config Variants</h2>
<div style="display: flex; gap: 16px;">
    <label>
        <input type="checkbox" bind:checked={mustConsent} onchange={() => getManager()?.resetConsents()} />
        mustConsent (blocks page)
    </label>
    <label>
        <input type="checkbox" bind:checked={noticeAsModal} onchange={() => getManager()?.resetConsents()} />
        noticeAsModal
    </label>
</div>

<h2>Consent-gated elements</h2>

<p>
    These elements use <code>data-name</code> and <code>type="text/plain"</code> to block execution until consent is given.
    Check the console after accepting.
</p>

<!-- eslint-disable svelte/no-at-html-tags -->
{@html consentGatedScripts}

<h3>Bootstrap CDN (iframe, blocked until consent)</h3>
<iframe
    data-name="bootstrap"
    data-src="about:blank"
    width="300"
    height="50"
    style="border: 1px dashed #ccc;"
    title="Bootstrap iframe placeholder"
></iframe>

{#key config}
    <Klaro
        {config}
        onconsentchange={handleConsentChange}
        onsave={handleSave}
        oninit={(manager) => console.log('Klaro initialized', manager)}
    />
{/key}
