<!-- +++
ET.SvelteFile('🍃-3d41aede05557fd4dc2c',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderNode from '../RenderNode.svelte';

  let { children = [], currentStage = 0, steps = [] } = $props();
</script>

{#each children as child, index (index)}
  <RenderNode node={child} {currentStage} {steps} />
{/each}
