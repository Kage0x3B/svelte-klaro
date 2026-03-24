<script lang="ts">
    import { getContext } from 'svelte';
    import { KLARO_KEY, type KlaroContext } from '$lib/klaro/types/klaro-context.js';

    let { text }: { text: string | (string | unknown)[] } = $props();

    const { config } = getContext<KlaroContext>(KLARO_KEY);

    const textArray = $derived(Array.isArray(text) ? text : [text]);
</script>

{#if config.htmlTexts}
    {@const wrapped = typeof textArray[0] === 'string' && textArray[0].startsWith('<')}
    {#if wrapped}
        {#each textArray as element, i (i)}
            {#if typeof element === 'string'}
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html element}
            {:else}
                {element}
            {/if}
        {/each}
    {:else}
        <span>
            {#each textArray as element, i (i)}
                {#if typeof element === 'string'}
                    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                    <span>{@html element}</span>
                {:else}
                    {element}
                {/if}
            {/each}
        </span>
    {/if}
{:else}
    <span>{textArray.join('')}</span>
{/if}
