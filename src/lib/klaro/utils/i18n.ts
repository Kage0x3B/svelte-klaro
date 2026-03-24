import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
import type { NestedMap, NestedRecord } from '$lib/klaro/utils/maps.js';

const format = (str: string, ...rest: unknown[]) => {
    const t = typeof rest[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let args: any;

    if (rest.length === 0) {
        args = {};
    } else {
        args = t === 'string' || t === 'number' ? Array.prototype.slice.call(rest) : rest[0];
    }

    const splits: unknown[] = [];

    let s = str.toString();
    while (s.length > 0) {
        const m = s.match(/\{(?!\{)([\w\d]+)\}(?!\})/);

        if (m !== null) {
            const left = s.substring(0, m.index!);
            s = s.substring(m.index! + m[0].length);
            const n = parseInt(m[1]);
            splits.push(left);
            if (Number.isNaN(n)) {
                splits.push(args[m[1]]);
            } else {
                splits.push(args[n]);
            }
        } else {
            splits.push(s);
            s = '';
        }
    }
    return splits;
};

export function language(config: KlaroConfigInterface) {
    // if a language is given in the config we always return that
    if (config !== undefined && config.lang !== undefined && config.lang !== 'zz') return config.lang;
    const docLang = typeof document !== 'undefined' ? document.documentElement.lang : '';
    const lang = (
        docLang ||
        (config !== undefined && config.languages !== undefined && config.languages[0] !== undefined
            ? config.languages[0]
            : 'en')
    ).toLowerCase();
    const regex = new RegExp('^(\\w+)-(\\w+)$');
    const result = regex.exec(lang);
    if (result === null) {
        return lang;
    }
    return result[1];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hget<T>(d: any, key: string | string[], defaultValue?: T): T | undefined {
    const kl = Array.isArray(key) ? key : [key];

    let cv = d;

    for (let i = 0; i < kl.length; i++) {
        if (cv === undefined || cv === null) {
            return defaultValue;
        }

        if (kl[i] !== undefined && kl[i].endsWith('?')) {
            const kle = kl[i].slice(0, kl[i].length - 1);
            let cvn;

            if (cv instanceof Map) {
                cvn = cv.get(kle);
            } else {
                cvn = cv[kle];
            }

            if (cvn !== undefined && typeof cvn === 'string') {
                cv = cvn;
            }
        } else {
            if (cv instanceof Map) {
                cv = cv.get(kl[i]);
            } else {
                cv = cv[kl[i]];
            }
        }
    }
    if (cv === undefined || typeof cv !== 'string') return defaultValue;
    if (cv === '') return undefined;
    return cv as T;
}

export function t(
    trans: NestedRecord | NestedMap | undefined,
    lang: string,
    fallbackLang: string | undefined,
    key: string | string[],
    ...params: unknown[]
) {
    let kl = key;
    let returnUndefined = false;
    if (kl[0] === '!') {
        kl = kl.slice(1);
        returnUndefined = true;
    }
    if (!Array.isArray(kl)) kl = [kl];
    let value = hget(trans, [lang, ...kl]);
    // if a fallback language is defined, we try to look up the translation for
    // that language instead...
    if (value === undefined && fallbackLang !== undefined) value = hget(trans, [fallbackLang, ...kl]);
    if (value === undefined) {
        if (returnUndefined) return undefined;
        return [`[missing translation: ${lang}/${kl.join('/')}]`];
    }
    if (params.length > 0) return format(value as string, ...params);
    return value;
}
