<script lang="ts">
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import { KlaroInstance } from '$lib/klaro/klaro-instance.js';
    import {
        type KlaroEventHandler,
        type KlaroEventType,
        klaroEventTypes
    } from '$lib/klaro/types/klaro-events.type.js';

    type KlaroEventProps = {
        [Property in KlaroEventType as `on${Capitalize<Property>}`]: KlaroEventHandler<Property>;
    };

    interface Props extends KlaroEventProps {
        config?: KlaroConfigInterface;
        klaroId?: string;
        klaroConfigName?: string;
        klaroApiUrl?: string;
    }

    let { config, klaroId, klaroConfigName, klaroApiUrl, ...restProps }: Props = $props();

    let klaroInstance = $state<KlaroInstance | undefined>(undefined);
    let show = $state(false);

    $effect(() => {
        klaroInstance = new KlaroInstance();

        const lowerCaseEventNames = klaroEventTypes.map((type) => type.toLowerCase());

        for (const [key, value] of Object.entries(restProps)) {
            if (!key.toLowerCase().startsWith('on')) {
                continue;
            }

            const eventName = key.toLowerCase().slice(2) as KlaroEventType;

            if (lowerCaseEventNames.includes(eventName)) {
                klaroInstance.addEventListener(eventName, value as KlaroEventHandler);
            }
        }

        (async () => {
            if (klaroId && config) {
                klaroInstance.initializeWithApi(config, klaroId, klaroApiUrl);
            } else if (klaroId) {
                await klaroInstance.initializeWithConfigFromApi(klaroId, klaroConfigName, klaroApiUrl);
            } else if (config) {
                klaroInstance.initializeWithConfig(config);
            }

            console.log(klaroInstance.getManager());
        })();
    });

    /*export function resetManagers() {
	for (const key in Object.keys(managers)) delete managers[key];
}

export function getManager(config) {
	config = config || defaultConfig;
	const name = config.storageName || config.cookieName || 'default'; // deprecated: cookieName
	if (managers[name] === undefined) managers[name] = new ConsentManager(validateConfig(config));
	return managers[name];
}*/
</script>

Klaro!
