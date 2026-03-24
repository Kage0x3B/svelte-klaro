<script>
	import Counter from '../Counter.svelte';
	import TodoList from '../TodoList.svelte';
	import ConsentGatedWidget from '../ConsentGatedWidget.svelte';
</script>

<svelte:head>
	<title>Benchmark: Without Klaro — svelte-klaro</title>
</svelte:head>

<h1>Without Klaro</h1>
<p>Typical page content, no consent manager.</p>
<Counter />
<TodoList />

<div class="widget-warning">
	<span>&#x1f6a8;</span>
	<div>
		<strong>Analytics Widget</strong>
		<p>No cookie manager — everything is enabled. Probably breaking some laws.</p>
	</div>
</div>
<ConsentGatedWidget timestamp={new Date().toLocaleTimeString()} />

<style>
	.widget-warning {
		margin-top: 16px;
		border: 2px solid #da2c43;
		border-radius: 8px;
		padding: 20px;
		max-width: 400px;
		background: #fce4ec;
		display: flex;
		align-items: center;
		gap: 12px;
		color: #333;
		font-size: 13px;
	}

	.widget-warning span {
		font-size: 24px;
		flex-shrink: 0;
	}

	.widget-warning p {
		margin: 4px 0 0;
	}
</style>
