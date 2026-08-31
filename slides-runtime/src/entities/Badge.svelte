<!-- +++
ET.SvelteFile('🍃-3439b66ad0c4adca153e',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<div class="hero-badge reveal">
  {#if node.icon === 'pulse-dot'}
    <span class="hero-badge__dot"></span>
  {/if}
  {node.value}
</div>
