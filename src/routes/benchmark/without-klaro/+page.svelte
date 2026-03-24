<script>
	import Counter from '../Counter.svelte';
	import TodoList from '../TodoList.svelte';
</script>

<svelte:head>
	<title>Benchmark: Without Klaro — svelte-klaro</title>
</svelte:head>

<h1>Without Klaro</h1>
<p>Typical page content, no consent manager.</p>
<Counter />
<TodoList />
