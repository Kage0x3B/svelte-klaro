<script lang="ts">
    import { getContext } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';
    import PurposeItem from './PurposeItem.svelte';
    import type { KlaroServiceInterface } from '$lib/klaro/types/klaro-service.interface.js';

    const { manager, config, t } = getContext<KlaroContext>(KLARO_KEY);

    const services = $derived(config.services);

    const purposes = $derived.by(() => {
        const map: Record<string, KlaroServiceInterface[]> = {};
        for (const service of services) {
            for (const purpose of service.purposes) {
                if (map[purpose] === undefined) map[purpose] = [];
                map[purpose].push(service);
            }
        }
        return map;
    });

    function checkServices(serviceList: KlaroServiceInterface[]) {
        const status = {
            allEnabled: true,
            onlyRequiredEnabled: true,
            allDisabled: true,
            allRequired: true
        };
        for (const service of serviceList) {
            if (!service.required) status.allRequired = false;
            if (manager.consents[service.name]) {
                if (!service.required) status.onlyRequiredEnabled = false;
                status.allDisabled = false;
            } else if (!service.required) {
                status.allEnabled = false;
            }
        }
        if (status.allDisabled) status.onlyRequiredEnabled = false;
        return status;
    }

    function toggle(purposeKeys: string[], value: boolean) {
        for (const purpose of purposeKeys) {
            const purposeServices = purposes[purpose];
            for (const service of purposeServices) {
                if (!service.required) {
                    manager.updateConsent(service.name, value);
                }
            }
        }
    }

    function toggleAll(value: boolean) {
        toggle(Object.keys(purposes), value);
    }

    const purposeOrder = $derived(config.purposeOrder || []);

    const sortedPurposeKeys = $derived(
        Object.keys(purposes).sort((a, b) => purposeOrder.indexOf(a) - purposeOrder.indexOf(b))
    );

    const togglablePurposes = $derived(
        Object.keys(purposes).filter((purpose) => {
            for (const service of purposes[purpose]) {
                if (!service.required) return true;
            }
            return false;
        })
    );

    const allStatus = $derived(checkServices(services));
</script>

<ul class="cm-purposes">
    {#each sortedPurposeKeys as purpose (purpose)}
        {@const status = checkServices(purposes[purpose])}
        <li class="cm-purpose">
            <PurposeItem
                allEnabled={status.allEnabled}
                allDisabled={status.allDisabled}
                onlyRequiredEnabled={status.onlyRequiredEnabled}
                required={status.allRequired}
                name={purpose}
                services={purposes[purpose]}
                onToggle={(value) => toggle([purpose], value)}
            />
        </li>
    {/each}
    {#if togglablePurposes.length > 1}
        <li class="cm-purpose cm-toggle-all">
            <PurposeItem
                name="disableAll"
                title={t(['service', 'disableAll', 'title']) as string}
                description={t(['service', 'disableAll', 'description']) as string}
                allDisabled={allStatus.allDisabled}
                allEnabled={allStatus.allEnabled}
                onlyRequiredEnabled={allStatus.onlyRequiredEnabled}
                onToggle={toggleAll}
                services={[]}
            />
        </li>
    {/if}
</ul>
