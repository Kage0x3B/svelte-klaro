import { version } from '../klaro-instance.js';
import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';

function formatParams(params: Record<string, string>): string {
    return new URLSearchParams(params).toString();

    /*return (
			'?' +
			Object.keys(params)
					.map(function (key) {
							return key + '=' + encodeURIComponent(params[key]);
					})
					.join('&')
	);*/
}

interface KlaroApiOpts {
    testing?: boolean;
}

export default class KlaroApi {
    constructor(
        private readonly url: string,
        private readonly id: string,
        private readonly opts: KlaroApiOpts = {}
    ) {}

    getLocationData(config: { records?: { savePathname?: boolean } }) {
        const recordsConfig = config.records || {};
        const savePathname = recordsConfig.savePathname !== undefined ? recordsConfig.savePathname : true;

        return {
            pathname: savePathname ? location.pathname : undefined,
            port: location.port !== '' ? parseInt(location.port) : 0,
            hostname: location.hostname,
            protocol: location.protocol.slice(0, location.protocol.length - 1)
        };
    }

    getUserData(): { client_version: string; client_name: string } {
        return {
            client_version: version(),
            client_name: 'klaro:web'
        };
    }

    getBaseConsentData(config: { records?: { savePathname?: boolean } }) {
        return {
            location_data: this.getLocationData(config),
            user_data: this.getUserData()
        };
    }

    update(
        notifier: { config: { id: string; records?: { savePathname?: boolean } } },
        name: 'saveConsents' | 'showNotice',
        data: {
            type: 'save';
            changes: Record<string, unknown>;
            consents: Record<string, boolean>;
            config: { id: string; records?: { savePathname?: boolean } };
        }
    ) {
        if (name === 'saveConsents') {
            if (data.type === 'save' && Object.keys(data.changes).length === 0) return; // save event with no changes
            const consentData = {
                ...this.getBaseConsentData(notifier.config),
                consent_data: {
                    consents: data.consents,
                    changes: data.type === 'save' ? data.changes : undefined,
                    type: data.type,
                    config: notifier.config.id
                }
            };
            this.submitConsentData(consentData);
        } else if (name === 'showNotice') {
            const consentData = {
                ...this.getBaseConsentData(data.config),
                consent_data: {
                    consents: {},
                    changes: {},
                    type: 'show',
                    config: data.config.id
                }
            };
            this.submitConsentData(consentData);
        }
    }

    apiRequest<
        Response,
        RequestType extends 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        Data extends RequestType extends 'GET' ? Record<string, string> : Record<string, unknown>
    >(type: RequestType, path: string, dataOrParams?: Data, contentType?: string): Promise<Response> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.addEventListener('load', () => {
                const data = JSON.parse(xhr.response);
                if (xhr.status < 200 || xhr.status >= 300) {
                    data.status = xhr.status;
                    // the request wasn't successful
                    reject(data);
                } else {
                    // the request was successful
                    // resolve(data, xhr.status);
                    resolve(data);
                }
            });

            xhr.addEventListener('error', () => {
                // something else went wrong (e.g. request got blocked)
                reject({ status: 0, xhr: xhr });
            });

            let body;

            if (dataOrParams !== undefined) {
                if (type === 'GET') {
                    path += '?' + formatParams(dataOrParams as Record<string, string>);
                } else {
                    body = JSON.stringify(dataOrParams);
                }
            }

            xhr.open(type, this.url + path);

            if (body !== undefined) {
                // we must call setRequestHeader after 'open'
                xhr.setRequestHeader('Content-Type', contentType ?? 'application/json;charset=UTF-8');
            }

            xhr.send(body);
        });
    }

    submitConsentData(consentData: Record<string, unknown>): Promise<void> {
        return this.apiRequest(
            'POST',
            '/v1/privacy-managers/' + this.id + '/submit',
            consentData,
            'text/plain;charset=UTF-8'
        );
    }

    /**
     * Load a specific Klaro config from the API.
     * @param name
     */
    loadConfig(name: string): Promise<KlaroConfigInterface> {
        return this.apiRequest(
            'GET',
            `/v1/privacy-managers/${this.id}/config.json?name=${name}` + (this.opts.testing ? '&testing=true' : '')
        );
    }

    /**
     * Load Klaro configs from the API
     */
    loadConfigs() {
        return this.apiRequest(
            'GET',
            '/v1/privacy-managers/' + this.id + '/configs.json' + (this.opts.testing ? '&testing=true' : '')
        );
    }
}
