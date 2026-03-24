<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	let { children }: { children: Snippet } = $props();

	const links = [
		{ href: '/', label: 'Demo' },
		{ href: '/benchmark/without-klaro', label: 'Benchmark: Baseline' },
		{ href: '/benchmark/with-klaro', label: 'Benchmark: Klaro' },
		{ href: '/benchmark/with-klaro-i18n', label: 'Benchmark: Klaro + i18n' }
	];
</script>

<svelte:head>
	<meta
		name="description"
		content="Svelte 5 cookie consent manager — a complete port of Klaro with reactive state, tree-shakeable translations, and CSS custom property theming."
	/>
	<meta property="og:title" content="svelte-klaro" />
	<meta
		property="og:description"
		content="Svelte 5 cookie consent manager — a complete port of Klaro with reactive state, tree-shakeable translations, and CSS custom property theming."
	/>
</svelte:head>

<nav class="site-nav">
	<a href="/" class="site-nav-brand">svelte-klaro</a>
	<div class="site-nav-links">
		{#each links as link (link.href)}
			<a href={link.href} class="site-nav-link" class:active={page.url.pathname === link.href}>
				{link.label}
			</a>
		{/each}
	</div>
	<a href="https://github.com/Kage0x3B/svelte-klaro" class="site-nav-link site-nav-github" target="_blank" rel="noopener">
		GitHub
	</a>
</nav>

<main>
	{@render children()}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #fafafa;
		color: #333;
	}

	.site-nav {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 24px;
		height: 48px;
		background: #fff;
		border-bottom: 1px solid #e5e5e5;
		font-size: 13px;
		overflow-x: auto;
	}

	.site-nav-brand {
		font-weight: 700;
		color: #1a936f;
		text-decoration: none;
		margin-right: 16px;
		white-space: nowrap;
	}

	.site-nav-links {
		display: flex;
		gap: 4px;
	}

	.site-nav-link {
		padding: 4px 10px;
		border-radius: 4px;
		color: #555;
		text-decoration: none;
		white-space: nowrap;
		transition: background 0.15s, color 0.15s;
	}

	.site-nav-link:hover {
		background: #f0f0f0;
		color: #333;
	}

	.site-nav-link.active {
		background: #e8f5e9;
		color: #1a936f;
		font-weight: 600;
	}

	.site-nav-github {
		margin-left: auto;
	}
</style>
