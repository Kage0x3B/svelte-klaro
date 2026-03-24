<script lang="ts">
    import { getContext } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';

    const { t } = getContext<KlaroContext>(KLARO_KEY);

    const label = $derived(t(['close']) as string);
</script>

<svg role="img" aria-label={label} width="12" height="12" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <title>{label}</title>
    <line x1="1" y1="11" x2="11" y2="1" stroke-width="1" />
    <line x1="1" y1="1" x2="11" y2="11" stroke-width="1" />
</svg>
