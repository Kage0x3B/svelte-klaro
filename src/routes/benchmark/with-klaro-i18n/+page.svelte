<script lang="ts">
    import '$lib/scss/klaro.scss';
    import { Klaro } from '$lib/index.js';
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import { de, fr, es } from '$lib/klaro/translations/index.js';
    import Counter from '../Counter.svelte';
    import TodoList from '../TodoList.svelte';

    const config: KlaroConfigInterface = {
        acceptAll: true,
        lang: 'de',
        services: [
            { name: 'analytics', title: 'Analytics', purposes: ['analytics'] },
            { name: 'ads', title: 'Ads', purposes: ['marketing'] }
        ]
    };
</script>

<h1>With Klaro + 3 translations (de, fr, es)</h1>
<p>Same page content, with consent manager and 3 extra languages loaded.</p>
<Counter />
<TodoList />

<Klaro {config} translations={{ de, fr, es }} />
