<!-- @ts-nocheck -->
<script>
  // @ts-nocheck
  let { node } = $props();
</script>

<figure class="equation-card reveal">
  {#if node.label}<figcaption>{node.label}</figcaption>{/if}
  <div class="equation-expression">{node.expression}</div>
</figure>
