<!-- +++
ET.SvelteFile('🍃-0c3f52ed6c96e26e24ec',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<figure class="equation-card reveal">
  {#if node.label}<figcaption>{node.label}</figcaption>{/if}
  <div class="equation-expression">{node.expression}</div>
</figure>
