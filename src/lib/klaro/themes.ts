// Klaro themes that can be mixed & matched. Some of them change the position,
// others the color scheme. The `_meta` field contains data used e.g. by
// the configuration IDE to see which themes are mutually compatible.

export type ThemeName = 'top' | 'bottom' | 'left' | 'right' | 'wide' | 'light';

export interface KlaroThemeMeta {
    incompatibleWith: ThemeName[];
}

export interface KlaroTheme {
    _meta?: KlaroThemeMeta;
    [cssVariable: string]: string | KlaroThemeMeta | undefined;
}

export const top: KlaroTheme = {
    _meta: {
        incompatibleWith: ['bottom']
    },
    'notice-top': '20px',
    'notice-bottom': 'auto'
};

export const bottom: KlaroTheme = {
    _meta: {
        incompatibleWith: ['top']
    },
    'notice-bottom': '20px',
    'notice-top': 'auto'
};

export const left: KlaroTheme = {
    _meta: {
        incompatibleWith: ['wide']
    },
    'notice-left': '20px',
    'notice-right': 'auto'
};

export const right: KlaroTheme = {
    _meta: {
        incompatibleWith: ['wide']
    },
    'notice-right': '20px',
    'notice-left': 'auto'
};

export const wide: KlaroTheme = {
    // position the notice on the left screen edge
    'notice-left': '20px',
    'notice-right': 'auto',
    // make the notice span the entire screen
    'notice-max-width': 'calc(100vw - 60px)',
    'notice-position': 'fixed'
};

export const light: KlaroTheme = {
    'button-text-color': '#fff',
    dark1: '#fafafa',
    dark2: '#777',
    dark3: '#555',
    light1: '#444',
    light2: '#666',
    light3: '#111',
    green3: '#f00'
};

export const themes: Record<ThemeName, KlaroTheme> = {
    top,
    bottom,
    left,
    right,
    wide,
    light
};
