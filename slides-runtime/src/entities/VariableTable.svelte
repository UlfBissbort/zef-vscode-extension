<!-- +++
ET.SvelteFile('🍃-4a5c2588b5780b900504',
  tag_=[],
  created=Time('2026-05-15 16:38:11 +0800')
)
+++ -->

<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderChildren from './RenderChildren.svelte';

  let { node, currentStage = 0, steps = [] } = $props();
  const children = $derived(node?.content_ ?? []);
</script>

<div class="variable-table reveal">
  <RenderChildren {children} {currentStage} {steps} />
</div>
