<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import RenderChildren from './RenderChildren.svelte';
  import Icon from '../icons/Icon.svelte';

  let { node, currentStage = 0, steps = [] } = $props();
  const children = $derived(node?.content_ ?? []);
</script>

<div class="timeline__item reveal">
  <div class="timeline__node">
    <Icon name={node.icon} />
  </div>
  <div class="timeline__content">
    <RenderChildren {children} {currentStage} {steps} />
  </div>
</div>
