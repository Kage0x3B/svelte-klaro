<script lang="ts">
    let count = $state(0);
    const doubled = $derived(count * 2);
</script>

<div class="counter">
    <h2>Counter: {count}</h2>
    <p>Doubled: {doubled}</p>
    <button onclick={() => count++}>Increment</button>
    <button onclick={() => (count = 0)}>Reset</button>
</div>

<style>
    .counter {
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 8px;
        max-width: 300px;
    }

    button {
        margin-right: 8px;
        padding: 6px 14px;
        border-radius: 4px;
        border: 1px solid #ccc;
        cursor: pointer;
    }
</style>
