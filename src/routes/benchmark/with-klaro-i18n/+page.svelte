<script lang="ts">
	import '$lib/scss/klaro.scss';
	import { Klaro, getManager } from '$lib/index.js';
	import type { KlaroConfigInterface } from '$lib/klaro/types/klaro-config.interface.js';
	import { de, fr, es } from '$lib/klaro/translations/index.js';
	import Counter from '../Counter.svelte';
	import TodoList from '../TodoList.svelte';
	import ConsentGatedWidget from '../ConsentGatedWidget.svelte';

	const config: KlaroConfigInterface = {
		acceptAll: true,
		lang: 'de',
		services: [
			{ name: 'analytics', title: 'Analytics', purposes: ['analytics'] },
			{ name: 'ads', title: 'Ads', purposes: ['marketing'] }
		]
	};

	let analyticsConsent = $state(false);
	let consentTimestamp = $state('');

	function updateConsent() {
		const consent = !!getManager()?.getConsent('analytics');
		if (consent && !analyticsConsent) {
			consentTimestamp = new Date().toLocaleTimeString();
		}
		analyticsConsent = consent;
	}
</script>

<svelte:head>
	<title>Benchmark: With Klaro + i18n — svelte-klaro</title>
</svelte:head>

<h1>With Klaro + 3 translations (de, fr, es)</h1>
<p>Same page content, with consent manager and 3 extra languages loaded.</p>
<Counter />
<TodoList />

{#if analyticsConsent}
	<ConsentGatedWidget timestamp={consentTimestamp} />
{:else}
	<div class="widget-placeholder">
		<span>&#x26a0;</span>
		<p>This widget requires <strong>analytics</strong> consent to load.</p>
	</div>
{/if}

<Klaro {config} translations={{ de, fr, es }} onconsentchange={updateConsent} oninit={updateConsent} onsave={updateConsent} />

<style>
	.widget-placeholder {
		margin-top: 16px;
		border: 2px dashed #ccc;
		border-radius: 8px;
		padding: 20px;
		max-width: 400px;
		display: flex;
		align-items: center;
		gap: 12px;
		color: #888;
		font-size: 13px;
	}

	.widget-placeholder span {
		font-size: 24px;
	}

	.widget-placeholder p {
		margin: 0;
	}
</style>
