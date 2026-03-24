<script lang="ts">
    import { getContext } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import ServiceItem from './ServiceItem.svelte';
    import type { KlaroServiceInterface } from '$lib/klaro/types/klaro-service.interface.js';

    const { manager, config, t } = getContext<KlaroContext>(KLARO_KEY);

    const services = $derived(config.services);

    function toggle(serviceList: KlaroServiceInterface[], value: boolean) {
        for (const service of serviceList) {
            if (!service.required) {
                manager.updateConsent(service.name, value);
            }
        }
    }

    function toggleAll(value: boolean) {
        toggle(services, value);
    }

    const togglableServices = $derived(services.filter((s) => !s.required));
    const nEnabled = $derived(togglableServices.filter((s) => manager.consents[s.name]).length);
    const nRequired = $derived(services.filter((s) => s.required).length);
    const allEnabled = $derived(nEnabled === togglableServices.length);
</script>

<ul class="cm-services">
    {#each services as service (service.name)}
        <li class="cm-service">
            <ServiceItem
                checked={manager.consents[service.name] || !!service.required}
                onToggle={(value) => toggle([service], value)}
                name={service.name}
                title={service.title}
                description={service.description}
                required={service.required}
                optOut={service.optOut}
                purposes={service.purposes}
                visible={true}
            />
        </li>
    {/each}
    {#if !config.hideToggleAll && togglableServices.length > 1}
        <li class="cm-service cm-toggle-all">
            <ServiceItem
                name="disableAll"
                title={t(['service', 'disableAll', 'title']) as string}
                description={t(['service', 'disableAll', 'description']) as string}
                checked={allEnabled}
                onlyRequiredEnabled={!allEnabled && nRequired > 0}
                onToggle={toggleAll}
            />
        </li>
    {/if}
</ul>
