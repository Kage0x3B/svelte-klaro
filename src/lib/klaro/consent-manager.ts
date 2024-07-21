import { getCookies, deleteCookie } from './utils/cookies.js';
import { dataset, applyDataset } from './utils/compat.js';
import { type IKlaroStore, SessionStorageStore, availableStores, type KlaroStorageMethod } from './stores.js';
import type { KlaroServiceInterface } from '$lib/klaro/types/klaro-service.interface.js';
import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';

export type KlaroConsentNotificationType = 'consents' | 'saveConsents' | 'applyConsents';

export type KlaroConsentWatcher = {
    update: (
        consentManager: ConsentManager,
        type: KlaroConsentNotificationType,
        data: number | Record<string, unknown>
    ) => void;
};

export class ConsentManager {
    private readonly store: IKlaroStore;

    /**
     * the consent states of the configured services
     * @private
     */
    private consents: Record<string, boolean>;

    /**
     * true if the user actively confirmed his/her consent
     * @private
     */
    private confirmed = false;

    /**
     * true if the service config changed compared to the cookie
     * @private
     */
    private changed = false;

    /**
     * keep track of the change (enabled, disabled) of individual services
     * @private
     */
    private states: Record<string, boolean> = {};

    /**
     * keep track of which services have been initialized already
     * @private
     */
    private initialized: Record<string, boolean> = {};

    /**
     * keep track of which services have been executed at least once
     * @private
     */
    private executedOnce: Record<string, boolean> = {};

    private watchers = new Set<KlaroConsentWatcher>([]);

    private savedConsents: Record<string, boolean>;

    private auxiliaryStore: IKlaroStore;

    constructor(
        private readonly config: KlaroConfigInterface,
        store?: IKlaroStore,
        auxiliaryStore?: IKlaroStore
    ) {
        if (store !== undefined) {
            this.store = store;
        } else {
            this.store = new availableStores[this.storageMethod](this);
        }

        // we fall back to the cookie-based store if the store is undefined
        if (this.store === undefined) this.store = new availableStores['cookie'](this);

        if (auxiliaryStore !== undefined) {
            this.auxiliaryStore = auxiliaryStore;
        } else {
            this.auxiliaryStore = new SessionStorageStore(this);
        }

        this.consents = this.defaultConsents;
        this.loadConsents();
        this.applyConsents();
        this.savedConsents = { ...this.consents };
    }

    get storageMethod(): KlaroStorageMethod {
        return this.config.storageMethod || 'cookie';
    }

    get storageName() {
        return this.config.storageName || this.config.cookieName || 'klaro'; // deprecated: cookieName
    }

    get cookieDomain() {
        return this.config.cookieDomain || undefined;
    }

    get cookiePath() {
        return this.config.cookiePath || undefined;
    }

    get cookieExpiresAfterDays() {
        return this.config.cookieExpiresAfterDays || 120;
    }

    get defaultConsents(): Record<string, boolean> {
        const consents: Record<string, boolean> = {};
        for (let i = 0; i < this.config.services.length; i++) {
            const service = this.config.services[i];
            consents[service.name] = this.getDefaultConsent(service);
        }
        return consents;
    }

    watch(watcher: KlaroConsentWatcher) {
        if (!this.watchers.has(watcher)) this.watchers.add(watcher);
    }

    unwatch(watcher: KlaroConsentWatcher) {
        if (this.watchers.has(watcher)) this.watchers.delete(watcher);
    }

    notify(name: KlaroConsentNotificationType, data: number | Record<string, unknown>, serviceName?: string) {
        this.watchers.forEach((watcher) => {
            watcher.update(this, name, data);
        });
    }

    getService(name: string): KlaroServiceInterface | undefined {
        const matchingServices = this.config.services.filter((service) => service.name === name);

        if (matchingServices.length > 0) {
            return matchingServices[0];
        }

        return undefined;
    }

    getDefaultConsent(service: KlaroServiceInterface): boolean {
        return service.default ?? service.required ?? this.config.default ?? false;
    }

    changeAll(value: boolean): number {
        let changedServices = 0;

        this.config.services
            .filter((service) => !service.contextualConsentOnly)
            .map((service) => {
                if (service.required || this.config.required || value) {
                    if (this.updateConsent(service.name, true)) changedServices++;
                } else {
                    if (this.updateConsent(service.name, false)) changedServices++;
                }
            });

        return changedServices;
    }

    updateConsent(name: string, value: boolean) {
        const changed = (this.consents[name] || false) !== value;
        this.consents[name] = value;
        this.notify('consents', this.consents);
        return changed;
    }

    resetConsents() {
        this.consents = this.defaultConsents;
        this.states = {};
        this.confirmed = false;
        this.applyConsents();
        this.savedConsents = { ...this.consents };
        this.store.delete();
        this.notify('consents', this.consents);
    }

    getConsent(name: string): boolean {
        return this.consents[name] || false;
    }

    loadConsents() {
        const consentData = this.store.get();
        if (consentData !== null) {
            this.consents = JSON.parse(decodeURIComponent(consentData));
            this._checkConsents();
            this.notify('consents', this.consents);
        }
        return this.consents;
    }

    saveAndApplyConsents(eventType: string) {
        this.saveConsents(eventType);
        this.applyConsents();
    }

    public changedConsents(): Record<string, boolean> {
        const cc: Record<string, boolean> = {};

        for (const [k, v] of Object.entries(this.consents)) {
            if (this.savedConsents[k] !== v) {
                cc[k] = v;
            }
        }

        return cc;
    }

    public saveConsents(eventType: string) {
        const v = encodeURIComponent(JSON.stringify(this.consents));
        this.store.set(v);
        this.confirmed = true;
        this.changed = false;
        const changes = this.changedConsents();
        this.savedConsents = { ...this.consents };
        this.notify('saveConsents', { changes: changes, consents: this.consents, type: eventType || 'script' });
    }

    public applyConsents(dryRun?: boolean, interactive?: boolean, serviceName?: string): number {
        function executeHandler(
            handler: ((service: KlaroServiceInterface) => void) | string | undefined,
            opts:
                | { service: KlaroServiceInterface; config: KlaroConfigInterface; vars: Record<string, unknown> }
                | undefined
        ) {
            if (handler === undefined) {
                return;
            }

            let handlerFunction;

            if (typeof handler === 'function') {
                handlerFunction = handler;
            } else {
                handlerFunction = new Function('opts', handler);
            }

            return handlerFunction(opts);
        }

        let changedServices = 0;

        // we make sure all services are properly initialized
        for (let i = 0; i < this.config.services.length; i++) {
            const service = this.config.services[i];
            if (serviceName !== undefined && serviceName !== service.name) continue;
            const vars = service.vars || {};
            const handlerOpts = { service: service, config: this.config, vars: vars };
            // we execute the init function of the service (if it is defined)
            if (!this.initialized[service.name]) {
                this.initialized[service.name] = true;
                executeHandler(service.onInit, handlerOpts);
            }
        }

        for (let i = 0; i < this.config.services.length; i++) {
            const service = this.config.services[i];
            if (serviceName !== undefined && serviceName !== service.name) continue;
            const state = this.states[service.name];
            const vars = service.vars || {};
            const optOut = service.optOut !== undefined ? service.optOut : this.config.optOut || false;
            const required = service.required !== undefined ? service.required : this.config.required || false;
            //opt out and required services are always treated as confirmed
            const confirmed = this.confirmed || optOut || dryRun || interactive;
            const consent = (this.getConsent(service.name) && confirmed) || required;
            const handlerOpts = {
                service: service,
                config: this.config,
                vars: vars,
                consents: this.consents,
                confirmed: this.confirmed
            };

            if (state !== consent) changedServices++;

            if (dryRun) continue;

            // we execute custom service handlers (if they are defined)
            executeHandler(consent ? service.onAccept : service.onDecline, handlerOpts);
            this.updateServiceElements(service, consent);
            this.updateServiceStorage(service, consent);

            // we execute the service callback (if one is defined)
            if (service.callback !== undefined) service.callback(consent, service);

            // we execute the global callback (if one is defined)
            if (this.config.callback !== undefined) this.config.callback(consent, service);

            this.states[service.name] = consent;
        }
        this.notify('applyConsents', changedServices, serviceName);
        return changedServices;
    }

    public updateServiceElements(service: KlaroServiceInterface, consent: boolean) {
        // we make sure we execute this service only once if the option is set
        if (consent) {
            if (service.onlyOnce && this.executedOnce[service.name]) return;
            this.executedOnce[service.name] = true;
        }

        const elements = document.querySelectorAll<HTMLElement>("[data-name='" + service.name + "']");
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];

            const parent = element.parentElement;
            const ds = dataset(element);
            const { type, src, href } = ds;
            const attrs = ['href', 'src', 'type'];

            // we handle placeholder elements here...
            if (type === 'placeholder') {
                if (consent) {
                    element.style.display = 'none';
                    ds['original-display'] = element.style.display;
                } else {
                    element.style.display = ds['original-display'] || 'block';
                }
                continue;
            }

            const isIFrameElement = (element: HTMLElement): element is HTMLIFrameElement =>
                element.tagName === 'IFRAME';
            const isScriptElement = (element: HTMLElement): element is HTMLScriptElement =>
                element.tagName === 'SCRIPT';
            const isLinkElement = (element: HTMLElement): element is HTMLLinkElement => element.tagName === 'LINK';

            if (isIFrameElement(element)) {
                // this element is already active, we do not touch it...
                if (consent && element.src === src) {
                    // eslint-disable-next-line no-console
                    console.debug(
                        `Skipping ${element.tagName} for service ${service.name}, as it already has the correct type...`
                    );
                    continue;
                }
                // we create a new script instead of updating the node in
                // place, as the script won't start correctly otherwise
                const newElement = document.createElement(element.tagName) as HTMLIFrameElement;
                for (const attribute of element.attributes) {
                    newElement.setAttribute(attribute.name, attribute.value);
                }
                newElement.innerText = element.innerText;
                newElement.text = element.text;

                if (consent) {
                    if (ds['original-display'] !== undefined) newElement.style.display = ds['original-display'];
                    if (ds.src !== undefined) newElement.src = ds.src;
                } else {
                    newElement.src = '';
                    if (ds['modified-by-klaro'] !== undefined && ds['original-display'] !== undefined)
                        // this is already a placeholder
                        newElement.setAttribute('data-original-display', ds['original-display']);
                    else {
                        // this is a new element we haven't touched before
                        if (element.style.display !== undefined)
                            newElement.setAttribute('data-original-display', element.style.display);
                        newElement.setAttribute('data-modified-by-klaro', 'yes');
                    }
                    newElement.style.display = 'none';
                }
                //we remove the original element and insert a new one
                parent?.insertBefore(newElement, element);
                parent?.removeChild(element);
            } else if (isScriptElement(element) || isLinkElement(element)) {
                // this element is already active, we do not touch it...
                if (consent && element.type === (type || '') && element.src === src) {
                    // eslint-disable-next-line no-console
                    console.debug(
                        `Skipping ${element.tagName} for service ${service.name}, as it already has the correct type or src...`
                    );
                    continue;
                }
                // we create a new script instead of updating the node in
                // place, as the script won't start correctly otherwise
                const newElement = document.createElement(element.tagName) as HTMLScriptElement | HTMLLinkElement;
                for (const attribute of element.attributes) {
                    newElement.setAttribute(attribute.name, attribute.value);
                }

                newElement.innerText = element.innerText;
                newElement.text = element.text;

                if (consent) {
                    newElement.type = type || '';
                    if (src !== undefined) newElement.src = src;
                    if (href !== undefined) newElement.href = href;
                } else {
                    newElement.type = 'text/plain';
                }
                //we remove the original element and insert a new one
                parent?.insertBefore(newElement, element);
                parent?.removeChild(element);
            } else {
                // all other elements (images etc.) are modified in place...
                if (consent) {
                    for (const attr of attrs) {
                        const attrValue = ds[attr];
                        if (attrValue === undefined) continue;
                        if (ds['original-' + attr] === undefined) ds['original-' + attr] = element[attr];
                        element[attr] = attrValue;
                    }
                    if (ds.title !== undefined) element.title = ds.title;
                    if (ds['original-display'] !== undefined) {
                        element.style.display = ds['original-display'];
                    } else {
                        element.style.removeProperty('display');
                    }
                } else {
                    if (ds.title !== undefined) element.removeAttribute('title');
                    if (ds['original-display'] === undefined && element.style.display !== undefined)
                        ds['original-display'] = element.style.display;
                    element.style.display = 'none';
                    for (const attr of attrs) {
                        const attrValue = ds[attr];
                        if (attrValue === undefined) continue;
                        if (ds['original-' + attr] !== undefined) element[attr] = ds['original-' + attr];
                        else element.removeAttribute(attr);
                    }
                }
                applyDataset(ds, element);
            }
        }
    }

    public updateServiceStorage(service: KlaroServiceInterface, consent: boolean) {
        if (consent) {
            return;
        }

        function escapeRegexStr(str: string) {
            return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
        }

        if (service.cookies !== undefined && service.cookies.length > 0) {
            const cookies = getCookies();
            for (let i = 0; i < service.cookies.length; i++) {
                const cookieConfig = service.cookies[i];
                let cookiePattern: string | RegExp | undefined = undefined;
                let cookiePath: string | undefined;
                let cookieDomain: string | undefined;

                if (Array.isArray(cookieConfig)) {
                    [cookiePattern, cookiePath, cookieDomain] = cookieConfig;
                } else if (cookieConfig instanceof Object && !(cookieConfig instanceof RegExp)) {
                    cookiePattern = cookieConfig.pattern;
                    cookiePath = cookieConfig.path;
                    cookieDomain = cookieConfig.domain;
                }

                if (cookiePattern === undefined) continue;

                if (!(cookiePattern instanceof RegExp)) {
                    if (cookiePattern.startsWith('^')) {
                        // we assume this is already a regex
                        cookiePattern = new RegExp(cookiePattern);
                    } else {
                        // we assume this is a normal string
                        cookiePattern = new RegExp('^' + escapeRegexStr(cookiePattern) + '$');
                    }
                }

                for (let j = 0; j < cookies.length; j++) {
                    const cookie = cookies[j];
                    const match = cookiePattern.exec(cookie.name);

                    if (match !== null) {
                        console.debug(
                            'Deleting cookie:',
                            cookie.name,
                            'Matched pattern:',
                            cookiePattern,
                            'Path:',
                            cookiePath,
                            'Domain:',
                            cookieDomain
                        );

                        deleteCookie(cookie.name, cookiePath, cookieDomain);
                        // if no cookie domain is given, we also try to delete the cookie with
                        // domain '.[current domain]' as some services set cookies for this
                        // dotted domain explicitly (e.g. the Facebook pixel).

                        if (cookieDomain === undefined) {
                            deleteCookie(cookie.name, cookiePath, '.' + window.location.hostname);
                        }
                    }
                }
            }
        }
    }

    private _checkConsents() {
        let complete = true;
        const services = new Set(
            this.config.services.map((service) => {
                return service.name;
            })
        );
        const consents = new Set(Object.keys(this.consents));
        for (const key of Object.keys(this.consents)) {
            if (!services.has(key)) {
                delete this.consents[key];
            }
        }
        for (const service of this.config.services) {
            if (!consents.has(service.name)) {
                this.consents[service.name] = this.getDefaultConsent(service);
                complete = false;
            }
        }
        this.confirmed = complete;
        if (!complete) this.changed = true;
    }
}
