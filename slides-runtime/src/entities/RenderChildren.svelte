<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderNode from '../RenderNode.svelte';

  let { children = [], currentStage = 0, steps = [] } = $props();
</script>

{#each children as child, index (index)}
  <RenderNode node={child} {currentStage} {steps} />
{/each}
