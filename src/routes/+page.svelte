<script lang="ts">
    import '$lib/scss/klaro.scss';
    import { Klaro, showKlaro, getManager } from '$lib/index.js';
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import { consentGatedScripts } from './consent-test-scripts.js';

    type ThemeOption = 'top' | 'bottom' | 'left' | 'right' | 'wide' | 'light';

    let activeThemes: ThemeOption[] = $state([]);
    let mustConsent = $state(false);
    let noticeAsModal = $state(false);
    let hideDeclineAll = $state(false);
    let groupByPurpose = $state(true);
    let embedded = $state(false);

    let accentColor = $state('#1a936f');
    let borderRadius = $state('4');
    let fontSize = $state('14');
    let noticeMaxWidth = $state('400');

    let configId = $state('');
    let configIdLoading = $state(false);
    let configIdError = $state('');
    let remoteConfig: KlaroConfigInterface | undefined = $state(undefined);

    async function loadRemoteConfig() {
        if (!configId.trim()) return;
        configIdLoading = true;
        configIdError = '';
        remoteConfig = undefined;
        try {
            const response = await fetch(`/api/klaro-config?id=${encodeURIComponent(configId.trim())}`);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            remoteConfig = await response.json();
            console.log('Loaded remote config:', remoteConfig);
        } catch (e) {
            configIdError = e instanceof Error ? e.message : String(e);
            console.error('Failed to load config:', e);
        } finally {
            configIdLoading = false;
        }
    }

    const cssOverrides = $derived({
        ...(accentColor !== '#1a936f' ? { green1: accentColor } : {}),
        ...(borderRadius !== '4' ? { 'border-radius': borderRadius + 'px' } : {}),
        ...(fontSize !== '14' ? { 'font-size': fontSize + 'px' } : {}),
        ...(noticeMaxWidth !== '400' ? { 'notice-max-width': noticeMaxWidth + 'px' } : {})
    });

    const styling = $derived({
        ...(activeThemes.length > 0 ? { theme: activeThemes } : {}),
        ...cssOverrides
    });

    const localConfig: KlaroConfigInterface = $derived({
        acceptAll: true,
        mustConsent,
        noticeAsModal,
        hideDeclineAll,
        groupByPurpose,
        embedded,
        styling: Object.keys(styling).length > 0 ? styling : undefined,
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
                purposes: { analytics: 'Analytics', styling: 'Styling', marketing: 'Marketing' }
            }
        },
        services: [
            { name: 'googleAnalytics', purposes: ['analytics'], cookies: [/^_ga/, '_gid'] },
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

    const config = $derived(remoteConfig ?? localConfig);

    function toggleTheme(theme: ThemeOption) {
        if (activeThemes.includes(theme)) {
            activeThemes = activeThemes.filter((t) => t !== theme);
        } else {
            activeThemes = [...activeThemes, theme];
        }
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

<svelte:head>
    <title>svelte-klaro — Interactive Demo</title>
    <meta property="og:title" content="svelte-klaro — Interactive Demo" />
</svelte:head>

<div class="demo">
    <header class="demo-header">
        <h1>svelte-klaro</h1>
        <p class="subtitle">
            Svelte 5 cookie consent manager — a complete port of <a href="https://github.com/kiprotect/klaro">Klaro</a>.
            Fully typed, reactive, tree-shakeable, and localized.
        </p>
        <p class="subtitle">
            <a href="https://github.com/Kage0x3B/svelte-klaro">Full README on GitHub</a>
        </p>
    </header>

    <section class="demo-section about">
        <h2>About</h2>
        <ul class="feature-list">
            <li><strong>12 KB gzipped</strong> (vs 66 KB for original Klaro with Preact)</li>
            <li>Svelte 5 with full TypeScript types</li>
            <li>25 tree-shakeable translations (only English bundled by default)</li>
            <li>CSS custom property theming with composable position/color themes</li>
            <li>Cookie deletion on consent withdrawal</li>
            <li>Load config from KIProtect API or pass locally</li>
            <li>SSR-safe</li>
        </ul>

        <h3>Install</h3>
        <pre><code>pnpm add svelte-klaro</code></pre>

        <h3>Quick Start</h3>
        <!-- prettier-ignore -->
        <pre><code>&lt;script lang="ts"&gt;
  import {'{'} Klaro, type KlaroConfigInterface {'}'} from 'svelte-klaro';
  import 'svelte-klaro/styles';

  const config: KlaroConfigInterface = {'{'}
    acceptAll: true,
    services: [
      {'{'} name: 'analytics', title: 'Analytics', purposes: ['analytics'] {'}'}
    ]
  {'}'};
&lt;/script&gt;

&lt;Klaro {'{'}config{'}'} /&gt;</code></pre>

        <p class="read-more">
            <a href="https://github.com/Kage0x3B/svelte-klaro">Read more on GitHub</a>
        </p>
    </section>

    <section class="demo-section">
        <h2>Controls</h2>
        <div class="btn-group">
            <button class="btn btn-primary" onclick={() => showKlaro()}>Show Notice</button>
            <button class="btn btn-primary" onclick={() => showKlaro(true)}>Show Modal</button>
            <button class="btn btn-outline" onclick={() => getManager()?.resetConsents()}>Reset Consent</button>
        </div>
    </section>

    <section class="demo-section">
        <h2>Themes</h2>
        <div class="chip-group">
            {#each ['top', 'bottom', 'left', 'right', 'wide', 'light'] as const as theme (theme)}
                <button class="chip" class:active={activeThemes.includes(theme)} onclick={() => toggleTheme(theme)}>
                    {theme}
                </button>
            {/each}
        </div>
        <p class="muted">
            Active: {activeThemes.length > 0 ? activeThemes.join(', ') : 'default (bottom-right, dark)'}
        </p>
    </section>

    <section class="demo-section">
        <h2>Style Overrides</h2>
        <div class="controls-grid">
            <label class="control">
                <span class="control-label">Accent color</span>
                <input type="color" bind:value={accentColor} />
            </label>
            <label class="control">
                <span class="control-label">Border radius: {borderRadius}px</span>
                <input type="range" min="0" max="20" bind:value={borderRadius} />
            </label>
            <label class="control">
                <span class="control-label">Font size: {fontSize}px</span>
                <input type="range" min="10" max="20" bind:value={fontSize} />
            </label>
            <label class="control">
                <span class="control-label">Notice width: {noticeMaxWidth}px</span>
                <input type="range" min="200" max="800" step="50" bind:value={noticeMaxWidth} />
            </label>
        </div>
    </section>

    <section class="demo-section">
        <h2>Config Options</h2>
        <div class="checkbox-group">
            <label class="checkbox">
                <input type="checkbox" bind:checked={mustConsent} onchange={() => getManager()?.resetConsents()} />
                <span>mustConsent</span>
            </label>
            <label class="checkbox">
                <input type="checkbox" bind:checked={noticeAsModal} onchange={() => getManager()?.resetConsents()} />
                <span>noticeAsModal</span>
            </label>
            <label class="checkbox">
                <input type="checkbox" bind:checked={hideDeclineAll} onchange={() => getManager()?.resetConsents()} />
                <span>hideDeclineAll</span>
            </label>
            <label class="checkbox">
                <input type="checkbox" bind:checked={groupByPurpose} onchange={() => getManager()?.resetConsents()} />
                <span>groupByPurpose</span>
            </label>
            <label class="checkbox">
                <input type="checkbox" bind:checked={embedded} onchange={() => getManager()?.resetConsents()} />
                <span>embedded</span>
            </label>
        </div>
    </section>

    <section class="demo-section">
        <h2>Load Remote Config</h2>
        <p class="muted">Enter a KIProtect privacy manager ID to load config from the API.</p>
        <div class="config-loader">
            <input
                type="text"
                class="input mono"
                bind:value={configId}
                placeholder="a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
                onkeydown={(e) => e.key === 'Enter' && loadRemoteConfig()}
            />
            <button class="btn btn-primary" onclick={loadRemoteConfig} disabled={configIdLoading || !configId.trim()}>
                {configIdLoading ? 'Loading...' : 'Load'}
            </button>
            {#if remoteConfig}
                <button
                    class="btn btn-outline"
                    onclick={() => {
                        remoteConfig = undefined;
                        configId = '';
                    }}>Clear</button
                >
                <span class="badge success">Loaded ({remoteConfig.services?.length ?? 0} services)</span>
            {/if}
        </div>
        {#if configIdError}
            <p class="badge error">{configIdError}</p>
        {/if}
    </section>

    <section class="demo-section">
        <h2>Consent-gated Elements</h2>
        <p class="muted">
            These use <code>data-name</code> + <code>type="text/plain"</code> to block execution until consent. Check the
            console.
        </p>

        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html consentGatedScripts}

        <div class="iframe-demo">
            <h3>Blocked iframe (bootstrap)</h3>
            <iframe
                data-name="bootstrap"
                data-src="about:blank"
                width="300"
                height="50"
                title="Bootstrap iframe placeholder"
            ></iframe>
        </div>
    </section>
</div>

{#key config}
    <Klaro
        {config}
        onconsentchange={handleConsentChange}
        onsave={handleSave}
        oninit={(manager) => console.log('Klaro initialized', manager)}
    />
{/key}

<style>
    .demo {
        max-width: 720px;
        margin: 0 auto;
        padding: 32px 24px 80px;
    }

    .demo-header {
        margin-bottom: 32px;
    }

    .demo-header h1 {
        font-size: 28px;
        font-weight: 700;
        color: #1a936f;
        margin: 0 0 4px;
    }

    .subtitle {
        color: #777;
        margin: 4px 0 0;
        font-size: 15px;
    }

    .subtitle a {
        color: #1a936f;
        text-decoration: none;
    }

    .subtitle a:hover {
        text-decoration: underline;
    }

    .demo-section {
        background: #fff;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        padding: 20px 24px;
        margin-bottom: 16px;
    }

    .demo-section h2 {
        font-size: 15px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #555;
        margin: 0 0 14px;
    }

    .about h3 {
        font-size: 13px;
        font-weight: 600;
        color: #555;
        margin: 16px 0 8px;
    }

    .feature-list {
        margin: 0;
        padding-left: 20px;
        font-size: 14px;
        line-height: 1.7;
        color: #444;
    }

    .about pre {
        background: #f5f5f5;
        border: 1px solid #e5e5e5;
        border-radius: 6px;
        padding: 12px 16px;
        overflow-x: auto;
        font-size: 13px;
        line-height: 1.5;
    }

    .about code {
        background: none;
        padding: 0;
        font-family: 'SF Mono', 'Fira Code', monospace;
    }

    .read-more {
        margin: 16px 0 0;
        font-size: 14px;
    }

    .read-more a {
        color: #1a936f;
        text-decoration: none;
        font-weight: 500;
    }

    .read-more a:hover {
        text-decoration: underline;
    }

    .muted {
        color: #888;
        font-size: 13px;
        margin: 8px 0 0;
    }

    code {
        background: #f0f0f0;
        padding: 1px 5px;
        border-radius: 3px;
        font-size: 12px;
    }

    /* Buttons */
    .btn-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        transition:
            background 0.15s,
            border-color 0.15s;
    }

    .btn-primary {
        background: #1a936f;
        color: #fff;
        border-color: #1a936f;
    }

    .btn-primary:hover {
        background: #15785c;
    }

    .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .btn-outline {
        background: #fff;
        color: #555;
        border-color: #ccc;
    }

    .btn-outline:hover {
        border-color: #999;
    }

    /* Theme chips */
    .chip-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .chip {
        padding: 6px 14px;
        border: 2px solid #ddd;
        border-radius: 20px;
        background: #fff;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
    }

    .chip:hover {
        border-color: #aaa;
    }

    .chip.active {
        border-color: #1a936f;
        background: #e8f5e9;
        color: #1a936f;
        font-weight: 600;
    }

    /* Controls grid */
    .controls-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
    }

    .control {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .control-label {
        font-size: 12px;
        color: #888;
        font-weight: 500;
    }

    .control input[type='range'] {
        accent-color: #1a936f;
    }

    .control input[type='color'] {
        height: 32px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }

    /* Checkboxes */
    .checkbox-group {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }

    .checkbox {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        cursor: pointer;
    }

    .checkbox input {
        accent-color: #1a936f;
    }

    .checkbox span {
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 12px;
        color: #555;
    }

    /* Config loader */
    .config-loader {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .input {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
        width: 340px;
        transition: border-color 0.15s;
    }

    .input:focus {
        outline: none;
        border-color: #1a936f;
    }

    .mono {
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 12px;
    }

    /* Badges */
    .badge {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
    }

    .badge.success {
        color: #1a936f;
        background: #e8f5e9;
    }

    .badge.error {
        color: #da2c43;
        background: #fce4ec;
    }

    /* Iframe demo */
    .iframe-demo {
        margin-top: 12px;
    }

    .iframe-demo h3 {
        font-size: 13px;
        color: #666;
        margin: 0 0 8px;
    }

    .iframe-demo iframe {
        border: 1px dashed #ccc;
        border-radius: 4px;
    }
</style>
