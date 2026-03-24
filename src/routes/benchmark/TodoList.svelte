<script lang="ts">
    let items: { id: number; text: string; done: boolean }[] = $state([
        { id: 1, text: 'Learn Svelte 5', done: true },
        { id: 2, text: 'Build a project', done: false },
        { id: 3, text: 'Ship it', done: false }
    ]);
    let input = $state('');
    let nextId = 4;

    const remaining = $derived(items.filter((i) => !i.done).length);

    function add() {
        if (!input.trim()) return;
        items = [...items, { id: nextId++, text: input.trim(), done: false }];
        input = '';
    }

    function toggle(id: number) {
        items = items.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
    }

    function remove(id: number) {
        items = items.filter((i) => i.id !== id);
    }
</script>

<div class="todo">
    <h2>Todo ({remaining} remaining)</h2>
    <form
        onsubmit={(e) => {
            e.preventDefault();
            add();
        }}
    >
        <input bind:value={input} placeholder="Add item..." />
        <button type="submit">Add</button>
    </form>
    <ul>
        {#each items as item (item.id)}
            <li class:done={item.done}>
                <label>
                    <input type="checkbox" checked={item.done} onchange={() => toggle(item.id)} />
                    <span>{item.text}</span>
                </label>
                <button onclick={() => remove(item.id)}>x</button>
            </li>
        {/each}
    </ul>
</div>

<style>
    .todo {
        padding: 16px;
        border: 1px solid #ddd;
        border-radius: 8px;
        max-width: 400px;
        margin-top: 16px;
    }

    form {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }

    input[type='text'],
    input:not([type]) {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    ul {
        list-style: none;
        padding: 0;
    }

    li {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 0;
    }

    li.done span {
        text-decoration: line-through;
        color: #999;
    }

    button {
        padding: 4px 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;
    }
</style>
