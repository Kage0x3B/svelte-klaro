export interface KlaroServiceInterface {
    /**
     * Each service should have a unique (and short) name.
     */
    name: string;

    /**
     * If "default" is set to true, the service will be enabled by default
     * Overwrites global "default" setting.
     * We recommend leaving this to "false" for services that collect
     * personal information.
     */
    default?: boolean;

    /**
     * The title of your service as listed in the consent modal.
     */
    title?: string;

    /**
     * The purpose(s) of this service. Will be listed on the consent notice.
     * Do not forget to add translations for all purposes you list here.
     */
    purposes?: string[];

    /**
     * A list of regex expressions or strings giving the names of
     * cookies set by this service. If the user withdraws consent for a
     * given service, Klaro will then automatically delete all matching
     * cookies.
     *
     * You can also explicitly provide a path and a domain for
     * a given cookie. This is necessary if you have services that
     * set cookies for a path that is not "/" or a domain that
     * is not the current domain. If you do not set these values
     * properly, the cookie can't be deleted by Klaro
     * (there is no way to access the path or domain of a cookie in JS)
     *
     * Notice that it is not possible to delete cookies that were set
     * on a third-party domain! See the note at mdn:
     * https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie#new-cookie_domain
     *
     * @example [/^_pk_.*$/, '/', 'klaro.kiprotect.com'], //for the production version
     * @example [/^_pk_.*$/, '/', 'localhost'], //for the local version
     * @example 'piwik_ignore'
     */
    cookies?: (
        | string
        | [RegExp, string, string]
        | RegExp
        | { pattern: string | RegExp; path: string | undefined; domain: string | undefined }
    )[];

    /**
     * An optional callback function that will be called each time
     * the consent state for the service changes (true=consented). Passes
     * the `service` config as the second parameter as well.
     */
    callback?: (consent: boolean, service: KlaroServiceInterface) => void;

    /**
     * If "required" is set to true, Klaro will not allow this service to
     * be disabled by the user.
     */
    required?: boolean;

    /**
     * If "optOut" is set to true, Klaro will load this service without
     * prior consent and the user will be able to opt out of it.
     */
    optOut?: boolean;

    /**
		 * If "onlyOnce" is set to true, the service will only be executed
		 * once regardless of consent
		onlyOnce?: boolean;

    /**
     * The purpose(s) of this service. Will be listed on the consent notice.
     */
    contextualConsentOnly?: boolean;

    onInit?: (service: KlaroServiceInterface) => void;

    onAccept?: (service: KlaroServiceInterface) => void;

    onDecline?: (service: KlaroServiceInterface) => void;

    vars?: { [key: string]: any };

    onlyOnce?: boolean;
}
