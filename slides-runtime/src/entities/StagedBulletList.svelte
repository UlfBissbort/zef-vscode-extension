<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderChildren from './RenderChildren.svelte';

  let { node, currentStage = 0, steps = [] } = $props();
  const children = $derived(node?.content_ ?? []);
  const density = $derived(node?.density ?? (children.length >= 5 ? 'dense' : children.length >= 4 ? 'compact' : 'normal'));
</script>

<ol class={`bullet-list staged-bullet-list marker-${node.marker ?? 'number'} density-${density} reveal`}>
  <RenderChildren {children} {currentStage} {steps} />
</ol>
