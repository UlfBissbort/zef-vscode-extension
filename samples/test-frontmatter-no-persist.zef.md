---zef
[svelte]
persist_output = false
---

# Test Frontmatter - Svelte Output NOT Persisted

This document has `persist_output = false`, so Svelte rendered HTML will NOT be saved to the file.

```svelte
<script>
  let count = 0;
</script>

<button on:click={() => count++}>
  Clicked {count} times
</button>

<style>
  button {
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  button:hover {
    background: #45a049;
  }
</style>
```

After running the above Svelte block, you should see the rendered component in the preview, but **no `rendered-html` block should be added to this file**.
