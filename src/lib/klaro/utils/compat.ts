/**
 * Returns a mutable record of the element's data-* attributes.
 * Keys use the hyphenated format (e.g., 'original-display' for data-original-display).
 */
export function dataset(element: HTMLElement): Record<string, string> {
    const ds: Record<string, string> = {};
    for (const attr of element.attributes) {
        if (attr.name.startsWith('data-')) {
            ds[attr.name.slice(5)] = attr.value;
        }
    }
    return ds;
}

/**
 * Applies a record of hyphenated data-* keys back to the element.
 */
export function applyDataset(ds: Record<string, string>, element: HTMLElement) {
    for (const [key, value] of Object.entries(ds)) {
        element.setAttribute('data-' + key, value);
    }
}
