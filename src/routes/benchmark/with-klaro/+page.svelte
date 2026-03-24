<script lang="ts">
    import '$lib/scss/klaro.scss';
    import { Klaro } from '$lib/index.js';
    import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
    import Counter from '../Counter.svelte';
    import TodoList from '../TodoList.svelte';

    const config: KlaroConfigInterface = {
        acceptAll: true,
        services: [
            { name: 'analytics', title: 'Analytics', purposes: ['analytics'] },
            { name: 'ads', title: 'Ads', purposes: ['marketing'] }
        ]
    };
</script>

<h1>With Klaro (English only)</h1>
<p>Same page content, with consent manager. No extra translations loaded.</p>
<Counter />
<TodoList />

<Klaro {config} />
