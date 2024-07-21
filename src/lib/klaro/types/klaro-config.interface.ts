import type { KlaroServiceInterface } from '$lib/klaro/types/klaro-service.interface.js';
import type { KlaroStorageMethod } from '$lib/klaro/stores.js';

export interface KlaroConfigInterface {
    /**
     * With the 0.7.0 release we introduce a 'version' paramter that will make
     * it easier for us to keep configuration files backwards-compatible in the future.
     */
    version?: number;

    /**
     * You can customize the ID of the DIV element that Klaro will create
     * when starting up. If undefined, Klaro will use 'klaro'.
     *
     * @default 'klaro'
     */
    elementID?: string;

    /**
     * You can override CSS style variables here. For IE11, Klaro will
     * dynamically inject the variables into the CSS. If you still consider
     * supporting IE9-10 (which you probably shouldn't) you need to use Klaro
     * with an external stylesheet as the dynamic replacement won't work there.
     *
     * @default { theme: ['light', 'top', 'wide'] }
     */
    styling?: {
        theme: ('light' | 'top' | 'wide')[];
    };

    /**
     * You can show a description in contextual consent overlays for store
     * being empty. In that case the accept always button is omitted.
     * The description contains a link for opening the consent manager.
     *
     * @default true
     */
    showDescriptionEmptyStore?: boolean;

    /**
     * Setting this to true will keep Klaro from automatically loading itself
     * when the page is being loaded.
     *
     * @default false
     */
    noAutoLoad?: boolean;

    /**
     * Setting this to true will render the descriptions of the consent
     * modal and consent notice are HTML. Use with care.
     *
     * @default false
     */
    htmlTexts?: boolean;

    /**
     * Setting 'embedded' to true will render the Klaro modal and notice without
     * the modal background, allowing you to e.g. embed them into a specific element
     * of your website, such as your privacy notice.
     *
     * @default false
     */
    embedded?: boolean;

    /**
     * You can group services by their purpose in the modal. This is advisable
     * if you have a large number of services. Users can then enable or disable
     * entire groups of services instead of having to enable or disable every service.
     *
     * @default true
     */
    groupByPurpose?: boolean;

    /**
     * You can make the consent notice autofocused by enabling the following option
     *
     * @default false
     */
    autoFocus?: boolean;

    /**
     * You can show a title in the consent notice by enabling the following option
     *
     * @default false
     */
    showNoticeTitle?: boolean;

    /**
     * How Klaro should store the user's preferences. It can be either 'cookie'
     * (the default) or 'localStorage'.
     *
     * @default 'cookie'
     */
    storageMethod?: KlaroStorageMethod;

    /**
     * You can customize the name of the cookie that Klaro uses for storing
     * user consent decisions. If undefined, Klaro will use 'klaro'.
     *
     * @default 'klaro'
     */
    cookieName?: string;

    storageName?: string;

    /**
     * You can also set a custom expiration time for the Klaro cookie.
     * By default, it will expire after 120 days.
     *
     * @default 120
     */
    cookieExpiresAfterDays?: number;

    /**
     * You can change to cookie domain for the consent manager itself.
     * Use this if you want to get consent once for multiple matching domains.
     * If undefined, Klaro will use the current domain.
     *
     * @default undefined
     */
    cookieDomain?: string;

    /**
     * You can change to cookie path for the consent manager itself.
     * Use this to restrict the cookie visibility to a specific path.
     * If undefined, Klaro will use '/' as cookie path.
     *
     * @default '/'
     */
    cookiePath?: string;

    required?: boolean;

    /**
     * Defines the default state for services (true=enabled by default).
     *
     * @default false
     */
    default?: boolean;

    /**
     * If "mustConsent" is set to true, Klaro will directly display the consent
     * manager modal and not allow the user to close it before having actively
     * consented or declines the use of third-party services.
     *
     * @default false
     */
    mustConsent?: boolean;

    /**
     * Show "accept all" to accept all services instead of "ok" that only accepts
     * required and "default: true" services
     *
     * @default true
     */
    acceptAll?: boolean;

    /**
     * replace "decline" with cookie manager modal
     *
     * @default false
     */
    hideDeclineAll?: boolean;

    /**
     * hide "learnMore" link
     *
     * @default false
     */
    hideLearnMore?: boolean;

    /**
     * show cookie notice as modal
     *
     * @default false
     */
    noticeAsModal?: boolean;

    /**
     * You can also remove the 'Realized with Klaro!' text in the consent modal.
     * Please don't do this! We provide Klaro as a free open source tool.
     * Placing a link to our website helps us spread the word about it,
     * which ultimately enables us to make Klaro! better for everyone.
     * So please be fair and keep the link enabled. Thanks :)
     *
     * @default false
     */
    disablePoweredBy?: boolean;

    /**
     * you can specify an additional class (or classes) that will be added to the Klaro `div`
     *
     * @default undefined
     */
    additionalClass?: string;

    /**
     * You can define the UI language directly here. If undefined, Klaro will
     * use the value given in the global "lang" variable. If that does
     * not exist, it will use the value given in the "lang" attribute of your
     * HTML tag. If that also doesn't exist, it will use 'en'.
     *
     * @default 'en'
     */
    lang?: string;

    languages?: string[];

    /**
     * You can overwrite existing translations and add translations for your
     * service descriptions and purposes. See `src/translations/` for a full
     * list of translations that can be overwritten:
     *
     * @see https://github.com/KIProtect/klaro/tree/master/src/translations
     */
    translations?: Record<
        string,
        Record<string, string | Record<string, string | Record<string, string | Record<string, string>>>>
    >;

    /**
     * This is a list of third-party services that Klaro will manage for you.
     */
    services: KlaroServiceInterface[];

    /**
     * An optional callback function that will be called each time
     * the consent state for the service changes (true=consented). Passes
     * the `service` config as the second parameter as well.
     */
    callback?: (consent: boolean, service: KlaroServiceInterface) => void;

    optOut?: boolean;
}
