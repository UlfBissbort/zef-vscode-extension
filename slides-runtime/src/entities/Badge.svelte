<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<div class="hero-badge reveal">
  {#if node.icon === 'pulse-dot'}
    <span class="hero-badge__dot"></span>
  {/if}
  {node.value}
</div>
