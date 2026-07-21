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
