export type NestedRecord = { [k: string | number | symbol]: string | NestedRecord };
export type NestedMap = Map<string, string | NestedMap | null>;

export function convertToMap(d: NestedRecord): NestedMap {
    const dm = new Map<string, string | NestedMap | null>([]);

    for (const key of Object.keys(d)) {
        const value = d[key];

        if (!(typeof key === 'string')) {
            continue;
        }

        if (typeof value === 'string' || value === null) {
            dm.set(key, value);
        } else {
            dm.set(key, convertToMap(value));
        }
    }

    return dm;
}

export function update(d: NestedMap, ed: NestedMap, overwrite = true, clone = false) {
    const assign = (d: NestedMap, key: string, value: string | NestedMap | null) => {
        if (value instanceof Map) {
            const map = new Map<string, string | NestedMap | null>([]);
            //we deep-clone the map
            update(map, value, true, false);
            d.set(key, map);
        } else d.set(key, value);
    };

    if (!(ed instanceof Map) || !(d instanceof Map)) {
        throw new Error('Parameters are not maps!');
    }

    if (clone) {
        d = new Map(d);
    }

    for (const key of ed.keys()) {
        const value = ed.get(key) ?? null;
        const dvalue = d.get(key);

        if (!d.has(key)) {
            assign(d, key, value);
        } else if (value instanceof Map && dvalue instanceof Map) {
            d.set(key, update(dvalue, value, overwrite, clone));
        } else {
            if (!overwrite) continue;
            assign(d, key, value);
        }
    }

    return d;
}
