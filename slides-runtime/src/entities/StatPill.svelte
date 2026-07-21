<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import Icon from '../icons/Icon.svelte';

  let { node } = $props();
</script>

<div class={`stat-pill accent-${node.accent ?? 'purple'} reveal`}>
  <div class="stat-pill__icon"><Icon name={node.icon} /></div>
  <div class="stat-pill__text">
    <span class="stat-pill__value">{node.value}</span>
    <span class="stat-pill__label">{node.label}</span>
  </div>
</div>
