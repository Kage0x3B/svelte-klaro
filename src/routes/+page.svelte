<script lang="ts">
    import 'klaro/dist/klaro.css';
    import Klaro from '$lib/Klaro.svelte';

    const config = {
        translations: {
            en: {
                googleAnalytics: {
                    title: 'Google Analytics',
                    description: 'The analytics service ran by a most definitely non-evil company.'
                },
                purposes: {
                    analytics: 'Analytics',
                    styling: 'Styling'
                }
            }
        },
        services: [
            {
                name: 'googleAnalytics',
                purposes: ['analytics']
            },
            {
                name: 'bootstrap',
                title: 'Bootstrap (external resource)',
                description: 'Example for embedding external stylesheets.',
                purposes: ['styling']
            }
        ]
    };
</script>

<h1>Welcome to your library project</h1>
<p>Create your package using @sveltejs/package and preview/showcase your work with SvelteKit</p>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<Klaro {config} />
