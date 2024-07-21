import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';

export function getPurposes(config: KlaroConfigInterface): string[] {
    const purposes = new Set<string>([]);
    for (let i = 0; i < config.services.length; i++) {
        const servicePurposes = config.services[i].purposes ?? [];
        for (let j = 0; j < servicePurposes.length; j++) {
            purposes.add(servicePurposes[j]);
        }
    }

    return Array.from(purposes);
}

type NestedRecord = { [k: string]: string | NestedRecord };

export function updateConfig(ed: NestedRecord, d: NestedRecord, overwrite: boolean = true) {
    const keys = Object.keys(d);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const vd = d[key];
        const ved = ed[key];

        if (typeof vd === 'string') {
            if (overwrite || ved === undefined) {
                ed[key] = vd;
            }
        } else if (typeof vd === 'object') {
            if (typeof ved === 'object') {
                updateConfig(ved, vd, overwrite);
            } else if (overwrite || ved === undefined) {
                ed[key] = vd;
            }
        }
    }

    return ed;
}
