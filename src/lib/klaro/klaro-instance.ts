import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
import { convertToMap, type NestedMap, update } from '$lib/klaro/utils/maps.js';
import type { KlaroEventArgs, KlaroEventHandler, KlaroEventType } from '$lib/klaro/types/klaro-events.type.js';
import KlaroApi from '$lib/klaro/utils/api.js';
import { ConsentManager } from '$lib/klaro/consent-manager.js';

export { updateConfig } from './utils/config.js';

const defaultKlaroConfigName = 'default';
const defaultKlaroApiUrl = 'https://cdn.kiprotect.com/klaro';

export class KlaroInstance {
    private defaultConfig: KlaroConfigInterface | undefined;
    private readonly defaultTranslations: NestedMap = new Map([]);
    private readonly eventHandlers: Partial<Record<KlaroEventType, KlaroEventHandler[]>> = {};
    private readonly events: Partial<Record<KlaroEventType, KlaroEventArgs[]>> = {};

    private readonly hashParams: Map<string, string | boolean>;
    private readonly testing: boolean;
    private api: KlaroApi | undefined;
    private consentManager: ConsentManager | undefined;

    constructor() {
        this.hashParams = this.getHashParams();
        this.testing = !!this.hashParams.get('klaro-testing');
    }

    public initializeWithConfig(config: KlaroConfigInterface) {
        this.defaultConfig = this.validateConfig(config);
        this.consentManager = new ConsentManager(this.defaultConfig);
    }

    public initializeWithApi(config: KlaroConfigInterface, klaroId: string, klaroApiUrl = defaultKlaroApiUrl) {
        this.api = new KlaroApi(klaroApiUrl, klaroId, { testing: this.testing });

        if (this.executeEventHandlers('apiConfigsLoaded', [config], this.api) === true) {
            return;
        }

        this.defaultConfig = this.validateConfig(config);
        this.consentManager = new ConsentManager(this.defaultConfig);
    }

    public async initializeWithConfigFromApi(
        klaroId: string,
        klaroConfigName = defaultKlaroConfigName,
        klaroApiUrl = defaultKlaroApiUrl
    ): Promise<void> {
        if (this.hashParams.has('klaro-config')) {
            klaroConfigName = String(this.hashParams.get('klaro-config'));
        }

        this.api = new KlaroApi(klaroApiUrl, klaroId, { testing: this.testing });
        try {
            const config = await this.api.loadConfig(klaroConfigName);

            // an event handler can interrupt the initialization, e.g. if it wants to perform
            // its own initialization given the API configs
            if (this.executeEventHandlers('apiConfigsLoaded', [config], this.api) === true) {
                return;
            }

            this.defaultConfig = this.validateConfig(config);
            this.consentManager = new ConsentManager(this.defaultConfig);
        } catch (error) {
            console.error(error, 'cannot load Klaro configs');
            this.executeEventHandlers('apiConfigsFailed', error);
        }
    }

    public addEventListener<EventType extends KlaroEventType>(
        eventType: EventType,
        handler: KlaroEventHandler<EventType>
    ) {
        eventType = eventType.toLowerCase() as EventType;

        if (this.eventHandlers[eventType] === undefined) {
            this.eventHandlers[eventType] = [handler];
        } else {
            this.eventHandlers[eventType]!.push(handler);
        }

        // this event did already fire, we call the handler
        if (this.events[eventType] !== undefined) {
            for (const event of this.events[eventType] as KlaroEventArgs<EventType>[]) {
                if (handler(...event) === false) {
                    break;
                }
            }
        }
    }

    public executeEventHandlers(eventType: KlaroEventType, ...args: KlaroEventArgs): true | undefined {
        eventType = eventType.toLowerCase() as KlaroEventType;

        const handlers = this.eventHandlers[eventType];
        if (this.events[eventType] === undefined) {
            this.events[eventType] = [args];
        } else {
            this.events[eventType]!.push(args);
        }

        if (handlers !== undefined) {
            for (const handler of handlers) {
                if (handler(...args) === true) {
                    return true;
                }
            }
        }
    }

    public getConfigTranslations(config: KlaroConfigInterface): NestedMap {
        const trans: NestedMap = new Map([]);

        update(trans, this.defaultTranslations);
        update(trans, convertToMap(config.translations ?? {}));

        return trans;
    }

    public version() {
        return version;
    }

    private getHashParams() {
        const entries = decodeURI(location.hash.slice(1))
            .split('&')
            .map((kv) => kv.split('='))
            .map((kv) => (kv.length === 1 ? [kv[0], true] : kv) as [string, string | boolean]);

        return new Map<string, string | boolean>(entries);
    }

    private validateConfig(config: KlaroConfigInterface) {
        const validatedConfig = { ...config };

        if (validatedConfig.version === 2) {
            return validatedConfig;
        }

        if (validatedConfig.apps !== undefined && validatedConfig.services === undefined) {
            validatedConfig.services = validatedConfig.apps;
            console.warn('Warning, your configuration file is outdated. Please change `apps` to `services`');
            delete validatedConfig.apps;
        }

        if (validatedConfig.translations !== undefined) {
            if (validatedConfig.translations.apps !== undefined && validatedConfig.services === undefined) {
                validatedConfig.translations.services = validatedConfig.translations.apps;
                console.warn(
                    'Warning, your configuration file is outdated. Please change `apps` to `services` in the `translations` key'
                );
                delete validatedConfig.translations.apps;
            }
        }

        return validatedConfig;
    }

    public resetManagers() {
        // TODO: Should this do anything?
    }

    public getManager(): ConsentManager | undefined {
        return this.consentManager;
    }
}

// TODO: Can this be replaced with a dynamic value? Maybe not because this is actually the fixed klaro package version, not from the package.json. Or should the version be modified with a -svelte prefix?
export const version = '0.7.22' as const;
