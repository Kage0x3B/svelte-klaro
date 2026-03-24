<script lang="ts">
    import { getContext } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import { asTitle } from '$lib/klaro/utils/strings.js';
    import Text from './Text.svelte';
    import ServiceItem from './ServiceItem.svelte';
    import type { KlaroServiceInterface } from '$lib/klaro/types/klaro-service.interface.js';

    let {
        allEnabled,
        allDisabled,
        onlyRequiredEnabled,
        required = false,
        services,
        name,
        title = undefined,
        description = undefined,
        onToggle
    }: {
        allEnabled: boolean;
        allDisabled: boolean;
        onlyRequiredEnabled: boolean;
        required?: boolean;
        services: KlaroServiceInterface[];
        name: string;
        title?: string;
        description?: string;
        onToggle: (value: boolean) => void;
    } = $props();

    const { manager, t } = getContext<KlaroContext>(KLARO_KEY);

    let servicesVisible = $state(false);

    const id = $derived(`purpose-item-${name}`);
    const titleId = $derived(`${id}-title`);

    const resolvedTitle = $derived(title || t(['!', 'purposes', name, 'title?']) || asTitle(name));

    const descriptionText = $derived(description || t(['!', 'purposes', name, 'description']));

    const inputClass = $derived(
        'cm-list-input' +
            (required ? ' required' : '') +
            (!allEnabled ? (onlyRequiredEnabled ? ' only-required' : ' half-checked') : '')
    );

    function onChange(e: Event) {
        onToggle((e.target as HTMLInputElement).checked);
    }

    function toggleServicesVisible(e: Event) {
        e.preventDefault();
        servicesVisible = !servicesVisible;
    }

    function handleSpace(e: KeyboardEvent) {
        if (e.keyCode === 32) {
            toggleServicesVisible(e);
        }
    }

    function toggleService(serviceList: KlaroServiceInterface[], value: boolean) {
        for (const service of serviceList) {
            if (!service.required) {
                manager.updateConsent(service.name, value);
            }
        }
    }
</script>

<input
    {id}
    class={inputClass}
    aria-labelledby={titleId}
    aria-describedby="{id}-description"
    disabled={required}
    checked={allEnabled || (!allDisabled && !onlyRequiredEnabled)}
    type="checkbox"
    onchange={onChange}
/>
<label for={id} class="cm-list-label" tabindex={required ? 0 : undefined}>
    <span class="cm-list-title" id={titleId}>
        {resolvedTitle}
    </span>
    {#if required}
        <span class="cm-required" title={(t(['!', 'service', 'required', 'description']) as string) || ''}>
            {t(['service', 'required', 'title'])}
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
</div>
{#if services.length > 0}
    <div class="cm-services">
        <div class="cm-caret">
            <a
                href="#"
                aria-haspopup="true"
                aria-expanded={servicesVisible}
                tabindex={0}
                onclick={toggleServicesVisible}
                onkeydown={handleSpace}
            >
                {#if servicesVisible}
                    <span>&#8593;</span>
                {:else}
                    <span>&#8595;</span>
                {/if}
                {services.length}
                {t(['purposeItem', services.length > 1 ? 'services' : 'service'])}
            </a>
        </div>
        <ul class="cm-content{servicesVisible ? ' expanded' : ''}">
            {#each services as service (service.name)}
                <li class="cm-service">
                    <ServiceItem
                        checked={manager.consents[service.name] || !!service.required}
                        onToggle={(value) => toggleService([service], value)}
                        name={service.name}
                        title={service.title}
                        description={service.description}
                        required={service.required}
                        optOut={service.optOut}
                        purposes={service.purposes}
                        visible={servicesVisible}
                    />
                </li>
            {/each}
        </ul>
    </div>
{/if}
