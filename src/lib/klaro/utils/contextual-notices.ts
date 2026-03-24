import { mount, unmount } from 'svelte';
import { dataset, applyDataset } from './compat.js';
import type { ConsentManager } from '../consent-manager.svelte.js';
import type { KlaroConfigInterface } from '../types/klaro-config.interface.js';
import type { TranslateFn } from '../types/klaro-context.js';
import ContextualConsentNotice from '../../components/ContextualConsentNotice.svelte';

interface MountedNotice {
    component: Record<string, unknown>;
    element: HTMLElement;
}

const mountedNotices: MountedNotice[] = [];

export function renderContextualConsentNotices(
    manager: ConsentManager,
    t: TranslateFn,
    lang: string,
    config: KlaroConfigInterface
) {
    for (const service of config.services) {
        const consent = manager.getConsent(service.name) && (manager.confirmed || service.optOut);
        const elements = document.querySelectorAll<HTMLElement>("[data-name='" + service.name + "']");

        for (const element of elements) {
            const ds = dataset(element);
            if (ds.type === 'placeholder') continue;

            if (element.tagName === 'IFRAME' || element.tagName === 'DIV') {
                let placeholderElement = element.previousElementSibling as HTMLElement | null;

                if (placeholderElement !== null) {
                    const pds = dataset(placeholderElement);
                    if (pds.type !== 'placeholder' || pds.name !== service.name) {
                        placeholderElement = null;
                    }
                }

                if (placeholderElement === null) {
                    placeholderElement = document.createElement('DIV');
                    placeholderElement.style.maxWidth = (element as HTMLIFrameElement).width + 'px';
                    placeholderElement.style.height = (element as HTMLIFrameElement).height + 'px';
                    applyDataset({ type: 'placeholder', name: service.name }, placeholderElement);

                    if (consent) {
                        placeholderElement.style.display = 'none';
                    }

                    element.parentElement?.insertBefore(placeholderElement, element);

                    const component = mount(ContextualConsentNotice, {
                        target: placeholderElement,
                        props: {
                            manager,
                            config,
                            t,
                            lang,
                            service,
                            style: ds.style
                        }
                    });

                    mountedNotices.push({ component, element: placeholderElement });
                }

                if (element.tagName === 'IFRAME') {
                    ds['src'] = (element as HTMLIFrameElement).src;
                }

                if (ds['modified-by-klaro'] === undefined && element.style.display === undefined) {
                    ds['original-display'] = element.style.display;
                }
                ds['modified-by-klaro'] = 'yes';
                applyDataset(ds, element);

                if (!consent) {
                    (element as HTMLIFrameElement).src = '';
                    element.style.display = 'none';
                }
            }
        }
    }
}

export function cleanupContextualConsentNotices() {
    for (const notice of mountedNotices) {
        try {
            unmount(notice.component);
            notice.element.remove();
        } catch {
            // element may already be removed
        }
    }
    mountedNotices.length = 0;
}
