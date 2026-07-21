<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderChildren from './RenderChildren.svelte';

  let { node, currentStage = 0, steps = [] } = $props();
  const children = $derived(node?.content_ ?? []);
</script>

<div class="feature-list">
  <RenderChildren {children} {currentStage} {steps} />
</div>
