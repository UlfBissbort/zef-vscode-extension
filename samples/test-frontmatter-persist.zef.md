+++
ET.MarkdownDocument('🍃-c3a4bc92b65846692711',
  title='test-frontmatter-persist.zef',
  importance=1,
  tag_=[],
  created=Time('2026-01-23 08:32:10 +0800')
)
+++

---zef
[svelte]
persist_output = true
---

# Test Frontmatter - Svelte Output Persisted

This document has `persist_output = true`, so Svelte rendered HTML WILL be saved to the file (this is also the default behavior).

```svelte
<script>
  let name = 'World';
</script>

<h2>Hello {name}!</h2>

<style>
  h2 {
    color: #2196F3;
  }
</style>
```

After running the above Svelte block, you should see both:
1. The rendered component in the preview
2. A `rendered-html` block added below the code block in this file
