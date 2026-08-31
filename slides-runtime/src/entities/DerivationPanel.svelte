<!-- +++
ET.SvelteFile('🍃-252f23a01bed9fec7789',
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

<section class="derivation-panel reveal">
  <header>{node.title}</header>
  <RenderChildren {children} {currentStage} {steps} />
</section>
