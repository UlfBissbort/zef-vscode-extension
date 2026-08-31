<!-- +++
ET.SvelteFile('🍃-06533a4ec44d3a68da65',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<figure class="quote-panel reveal">
  <blockquote>{node.quote}</blockquote>
  {#if node.attribution}<figcaption>{node.attribution}</figcaption>{/if}
</figure>
