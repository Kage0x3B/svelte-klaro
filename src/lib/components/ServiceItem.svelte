<script lang="ts">
    import { getContext } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import { t as tt } from '$lib/klaro/utils/i18n.js';
    import { asTitle } from '$lib/klaro/utils/strings.js';
    import Text from './Text.svelte';

    let {
        checked,
        name,
        title = undefined,
        description = undefined,
        required = false,
        optOut = false,
        purposes = [],
        onlyRequiredEnabled = false,
        onToggle,
        translations = undefined,
        visible = true
    }: {
        checked: boolean;
        name: string;
        title?: string;
        description?: string;
        required?: boolean;
        optOut?: boolean;
        purposes?: string[];
        onlyRequiredEnabled?: boolean;
        onToggle: (value: boolean) => void;
        translations?: Record<string, unknown>;
        visible?: boolean;
    } = $props();

    const { t, lang } = getContext<KlaroContext>(KLARO_KEY);

    const id = $derived(`service-item-${name}`);
    const titleId = $derived(`${id}-title`);

    const resolvedTitle = $derived(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        title || tt(translations as any, lang, 'zz', ['!', 'title']) || t(['!', name, 'title?']) || asTitle(name)
    );

    const descriptionText = $derived(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description || tt(translations as any, lang, 'zz', ['!', 'description']) || t(['!', name, 'description?'])
    );

    const purposesText = $derived(
        purposes.map((purpose) => t(['!', 'purposes', purpose, 'title?']) || asTitle(purpose)).join(', ')
    );

    const inputClass = $derived(
        'cm-list-input' + (required ? ' required' : '') + (onlyRequiredEnabled ? ' half-checked only-required' : '')
    );

    function onChange(e: Event) {
        onToggle((e.target as HTMLInputElement).checked);
    }
</script>

<div>
    <input
        {id}
        class={inputClass}
        aria-labelledby={titleId}
        aria-describedby="{id}-description"
        disabled={required}
        checked={checked || required}
        tabindex={visible ? 0 : -1}
        type="checkbox"
        onchange={onChange}
    />
    <label for={id} class="cm-list-label" tabindex={required ? 0 : undefined}>
        <span class="cm-list-title" id={titleId}>
            {resolvedTitle}
        </span>
        {#if required}
            <span class="cm-required" title={t(['service', 'required', 'description']) as string}>
                {t(['service', 'required', 'title'])}
            </span>
        {/if}
        {#if optOut}
            <span class="cm-opt-out" title={t(['service', 'optOut', 'description']) as string}>
                {t(['service', 'optOut', 'title'])}
            </span>
        {/if}
        <span class="cm-switch">
            <div class="slider round active"></div>
        </span>
    </label>
    <div id="{id}-description">
        {#if descriptionText}
            <p class="cm-list-description">
                <Text text={descriptionText} />
            </p>
        {/if}
        {#if purposes.length > 0}
            <p class="purposes">
                {t(['service', purposes.length > 1 ? 'purposes' : 'purpose'])}:
                {purposesText}
            </p>
        {/if}
    </div>
</div>
