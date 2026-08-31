<!-- +++
ET.SvelteFile('🍃-086b8a575a1a3476f185',
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

<div class="timeline">
  <RenderChildren {children} {currentStage} {steps} />
</div>
