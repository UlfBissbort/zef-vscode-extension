<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  import Icon from '../icons/Icon.svelte';

  let { node } = $props();
  const href = $derived(node.action?.startsWith('navigate:') ? node.action.slice(9) : '#');
</script>

<a class={`btn btn--${node.variant ?? 'primary'} reveal`} {href}>
  {node.label}
  {#if node.icon}<Icon name={node.icon} />{/if}
</a>
